import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

/*async function entregarS (solicitudes) {
    const sCompletas = {}
    try{
        for(const solicitud of solicitudes){
            const completa = await client.query("SELECT * FROM solicitudes WHERE id = $1", [solicitud]);
            sCompletas[solicitud] = completa.rows[0];
        }
        return sCompletas;
    }catch(error){
        console.error("Error al entregar solicitudes completas:", error);
        throw error;
    } 
}*/
async function borrarSolicitud(id, solicitudid) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("DELETE FROM solicitudes WHERE contratadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea borrar no existe o no le pertenece a este usuario");
        }
    } catch(error){
        console.error("Error al borrar la solicitud:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(
            "INSERT INTO solicitudes (contratadorid, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid]
        );
        return result.rows[0];
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

async function busqueda(id) {
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, a.aptitud, ae.aptitud_especifica, t.trabajo, uc.nombre_completo, uc.foto_perfil, uc.puntuacion_contratador,
                (
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes ua
                        WHERE ua.userid = $1 AND ua.aptitudid = s.aptitudid AND s.aptitudid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes_especificas uae
                        WHERE uae.userid = $1 AND uae.aptitud_especificaid = s.aptitud_especificaid AND s.aptitud_especificaid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_tdr ut
                        WHERE ut.userid = $1 AND ut.trabajoid = s.trabajoid AND s.trabajoid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                ) AS coincidencias
            FROM solicitudes s
            INNER JOIN usuarios u
                ON u.id = $1 AND u.id=s.trabajadorid
            LEFT JOIN aptitudes a
                ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae
                ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t
                ON t.id = s.trabajoid
            INNER JOIN usuarios uc
                ON uc.id = s.contratadorid
            ORDER BY coincidencias DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const aceptarSolicitud = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query("UPDATE solicitudes SET estado = 'pendiente' WHERE trabajadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea aceptar no existe o no le pertenece a este usuario");
        }
        const avisotxt=`Su solicitud ha sido aceptada por el trabajador
                        Solicitud: ${result.rows[0].solicitud}
                        Periodo: ${result.rows[0].periodo}`;
        const aviso = await client.query(`
            INSERT INTO notificaciones (tipo, userid, contenido)
            VALUES('solicitudes', $1
            , $2)`, [result.rows[0].contratadorid, avisotxt]);
        return{solicitud: result.rows[0], aviso: aviso.rows[0]};
    } catch(error) {
        console.error("Error al aceptar la solicitud:", error);
        throw error;
    } finally {
        await client.end();
    }
}

const rechazarSolicitud = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query("DELETE FROM solicitudes WHERE trabajadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea rechazar no existe o no le pertenece a este usuario");
        }
        const avisotxt=`Su solicitud ha sido rechazada por el trabajador
                        Solicitud: ${result.rows[0].solicitud}
                        Periodo: ${result.rows[0].periodo}`;
        const aviso = await client.query(`
            INSERT INTO notificaciones (tipo, userid, contenido)
            VALUES('solicitudes', $1
            , $2)`, [result.rows[0].contratadorid, avisotxt]);
        return{solicitud: result.rows[0], aviso: aviso.rows[0]};
    } catch(error) {
        console.error("Error al rechazar la solicitud:", error);
        throw error;
    } finally {
        await client.end();
    }
}

const revisarTerminadas = async() => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            WITH updated_solicitudes AS (
                UPDATE solicitudes
                SET estado = 'terminada'
                WHERE estado = 'pendiente' AND periodo[2] < CURRENT_DATE
                RETURNING trabajadorid, contratadorid, solicitud
            )
            SELECT 
                s.trabajadorid, 
                ut.nombre_completo AS trabajador_nombre,
                s.contratadorid, 
                uc.nombre_completo AS contratador_nombre,
                s.solicitud
            FROM updated_solicitudes s
            JOIN usuarios ut ON s.trabajadorid = ut.id
            JOIN usuarios uc ON s.contratadorid = uc.id;
        `);
        let notificaciones=[]
        for(const trabajo of result.rows){
            const avisotxtC=`Su tabajo con ${trabajo.trabajador_nombre} sido marcada como terminada por el sistema
                            Solicitud: ${trabajo.solicitud}
                            ¿Quieres dejar una reseña?`;
            const avisoC = await client.query(`
                INSERT INTO notificaciones (tipo, userid, contenido, otroid)
                VALUES('solicitudes', $1
                , $2, $3)`, [trabajo.contratadorid, avisotxtC, trabajo.trabajadorid]);

            const avisotxtT=`Su tabajo con ${trabajo.contratador_nombre} sido marcada como terminada por el sistema
                            Solicitud: ${trabajo.solicitud}
                            ¿Quieres dejar una reseña?`;
            const avisoT = await client.query(`
                INSERT INTO notificaciones (tipo, userid, contenido, otroid)
                VALUES('solicitudes', $1
                , $2, $3)`, [trabajo.trabajadorid, avisotxtT, trabajo.contratadorid]);
            notificaciones.push({avisoC: avisoC.rows[0], avisoT: avisoT.rows[0]});
        }
        return notificaciones;
    }catch(error) {
        console.error("Error al revisar solicitudes terminadas:", error.message);
        throw error;
    } finally {
        await client.end();
    }
}
const SolicitudesService = {
    busqueda,
    subirSolicitud,
    borrarSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    revisarTerminadas
}

export default SolicitudesService;