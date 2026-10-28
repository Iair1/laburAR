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

async function subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida, aptitud) {
    const client = new Client(config);
    try {
        await client.connect();
        // Si no vienen días (o vienen todos en false), se aceptan todos los días.
        // (Antes decía "diassemana = [...]", que asigna en vez de comparar y siempre pisaba los días.)
        if(!Array.isArray(diassemana) || diassemana.length !== 7 || diassemana.every((d) => !d)){
            diassemana = [true, true, true, true, true, true, true];
        }
        // La categoría puede venir por nombre (ej: "Plomería"): se busca o se crea, igual que en nuevaAptitud
        if(!aptitudid && aptitud){
            const apt = await client.query(`
                INSERT INTO aptitudes (aptitud) VALUES ($1)
                ON CONFLICT (aptitud) DO UPDATE SET aptitud = EXCLUDED.aptitud
                RETURNING id`, [aptitud]);
            aptitudid = apt.rows[0].id;
        }
        const result = await client.query(
            "INSERT INTO solicitudes (contratadorid, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida]
        );
        return result.rows[0];
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

async function misProblemas(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, a.aptitud,
                ut.nombre_completo AS trabajador_nombre, ut.foto_perfil AS trabajador_foto, ut.puntuacion_trabajador
            FROM solicitudes s
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            LEFT JOIN usuarios ut ON ut.id = s.trabajadorid
            WHERE s.contratadorid = $1 AND s.dirigida = FALSE
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener mis problemas:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function misSolicitudes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.trabajadorid
            WHERE s.contratadorid = $1 AND s.estado = 'por revisar'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos solicitudes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function trabajosPendientes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.contratadorid
            WHERE s.trabajadorid = $1 AND s.estado = 'pendiente'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos pendientes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function serviciosPendientes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.trabajadorid
            WHERE s.contratadorid = $1 AND s.estado = 'pendiente'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos pendientes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function busqueda(id) {
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, s.diassemana, a.aptitud, ae.aptitud_especifica, t.trabajo, uc.nombre_completo, uc.foto_perfil, uc.puntuacion_contratador,
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
            WHERE s.estado = 'por revisar'           
            ORDER BY coincidencias DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const aceptarSolicitud = async(id, solicitudid, dia, hora = null) => {
    const client = new Client(config);
    try {
        await client.connect();
        let result;
        if(dia){
            // El trabajador elige un día dentro del período y en los días de la semana pedidos.
            //  - solicitud dirigida (o vieja, con dirigida en NULL): solo el trabajador al que va dirigida
            //  - problema abierto (dirigida = false): cualquier trabajador menos el que lo publicó
            // diassemana va de Lunes [1] a Domingo [7], igual que ISODOW.
            // Si elige hora, se agrega al texto como "Hora acordada: 10:00 hs" (no hay columna para la hora).
            result = await client.query(`
                UPDATE solicitudes
                SET estado = 'pendiente',
                    trabajadorid = $1,
                    periodo = ARRAY[$3::date, $3::date],
                    solicitud = CASE WHEN $4::text IS NULL THEN solicitud
                                     ELSE solicitud || E'\nHora acordada: ' || $4::text || ' hs' END
                WHERE id = $2
                  AND estado = 'por revisar'
                  AND $3::date BETWEEN periodo[1] AND periodo[2]
                  AND COALESCE(diassemana[EXTRACT(ISODOW FROM $3::date)::int], TRUE) = TRUE
                  AND (
                        (COALESCE(dirigida, TRUE) = TRUE AND trabajadorid = $1)
                     OR (dirigida = FALSE AND contratadorid <> $1)
                  )
                RETURNING *`, [id, solicitudid, dia, hora]);
        } else {
            // Sin día (como lo manda hoy "Aceptar solicitud"): solo solicitudes dirigidas, sin tocar el período
            result = await client.query(`
                UPDATE solicitudes SET estado = 'pendiente'
                WHERE trabajadorid = $1 AND id = $2 AND estado = 'por revisar' AND COALESCE(dirigida, TRUE) = TRUE
                RETURNING *`, [id, solicitudid]);
        }
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea aceptar no existe, no le pertenece a este usuario, o no coincide con las fechas propuestas por el usuario.-");
        }
        const s = result.rows[0];
        let avisotxt;
        if(s.dirigida === false){
            const trabajador = await client.query("SELECT nombre_completo FROM usuarios WHERE id = $1", [id]);
            const fecha = new Date(`${dia}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
            avisotxt=`${trabajador.rows[0]?.nombre_completo || "Un trabajador"} agendó una cita para tu problema
                        Día: ${fecha}${hora ? ` a las ${hora} hs` : ""}
                        Problema: ${s.solicitud}`;
        } else if(dia){
            const fecha = new Date(`${dia}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
            avisotxt=`Su solicitud ha sido aceptada por el trabajador
                        Día: ${fecha}${hora ? ` a las ${hora} hs` : ""}
                        Solicitud: ${s.solicitud}`;
        } else {
            avisotxt=`Su solicitud ha sido aceptada por el trabajador
                        Solicitud: ${s.solicitud}
                        Periodo: ${s.periodo}`;
        }
        const aviso = await client.query(`
            INSERT INTO notificaciones (tipo, userid, contenido)
            VALUES('solicitud-aceptada', $1
            , $2)`, [s.contratadorid, avisotxt]);
        return{solicitud: s, aviso: aviso.rows[0]};
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
            VALUES('solicitud-rechazada', $1
            , $2)`, [result.rows[0].contratadorid, avisotxt]);
        return{solicitud: result.rows[0], aviso: aviso.rows[0]};
    } catch(error) {
        console.error("Error al rechazar la solicitud:", error);
        throw error;
    } finally {
        await client.end();
    }
}

const cancelarTrabajo = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            UPDATE solicitudes s
            SET estado = 'cancelado'
            FROM usuarios u
            WHERE (s.contratadorid = $1 OR s.trabajadorid = $1) AND s.id = $2 AND s.estado = 'pendiente'
            AND u.id = CASE WHEN s.contratadorid = $1 THEN s.contratadorid ELSE s.trabajadorid END
            RETURNING s.*, u.nombre_completo`, [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea cancelar no existe o no le pertenece a este usuario");
        }
        let otro = result.rows[0].contratadorid
        if(result.rows[0].contratadorid === id){
            otro = result.rows[0].trabajadorid
        }
        const avisotxt=`El trabajo ha sido cancelado por el usuario
                        Solicitud: ${result.rows[0].solicitud}
                        Periodo: ${result.rows[0].periodo}
                        Usuario que cancela: ${result.rows[0].nombre_completo}`;
        const aviso = await client.query(`
            INSERT INTO notificaciones (tipo, userid, contenido, otroid)
            VALUES('trabajo-cancelado', $1, $2, $3)`, 
            [otro, avisotxt, result.rows[0].id]);
        return result.rows[0];
    } catch(error) {
        console.error("Error al cancelar el trabajo:", error);
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
        return notificaciones.rows;
    }catch(error) {
        console.error("Error al revisar solicitudes terminadas:", error.message);
        throw error;
    } finally {
        await client.end();
    }
}

//puede que la saque

async function busquedaAA(id) {
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, s.diassemana, s.localidad, s.contratadorid, s.aptitudid,
                a.aptitud, ae.aptitud_especifica, t.trabajo, uc.nombre_completo, uc.foto_perfil, uc.puntuacion_contratador,
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
            LEFT JOIN aptitudes a
                ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae
                ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t
                ON t.id = s.trabajoid
            INNER JOIN usuarios uc
                ON uc.id = s.contratadorid
            WHERE s.estado = 'por revisar' AND s.dirigida = FALSE
              AND s.contratadorid <> $1
              AND s.periodo[2] >= CURRENT_DATE - 1
            ORDER BY coincidencias DESC, s.id DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}





const SolicitudesService = {
    misProblemas,
    busqueda,
    busquedaAA,
    misSolicitudes,
    trabajosPendientes,
    subirSolicitud,
    borrarSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    serviciosPendientes,
    cancelarTrabajo,
    revisarTerminadas
}

export default SolicitudesService;