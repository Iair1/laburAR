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

async function subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(
            "INSERT INTO solicitudes (contratadorid, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana]
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
            SELECT s.id, s.solicitud, s.periodo, a.aptitud, ae.aptitud_especifica, t.trabajo,
                (
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes ua
                        WHERE ua.userid = $1 AND ua.aptitudid = s.aptitudid AND s.aptitudid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes_e uae
                        WHERE uae.userid = $1 AND uae.aptitud_especificaid = s.aptitud_especificaid AND s.aptitud_especificaid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_tdr ut
                        WHERE ut.userid = $1 AND ut.trabajoid = s.trabajoid AND s.trabajoid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                ) AS coincidencias
            FROM solicitudes s
            JOIN usuarios u
                ON u.id = $1 AND u.localidad = s.localidad
            JOIN aptitudes a
                ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae
                ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t
                ON t.id = s.trabajoid
            ORDER BY coincidencias DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const SolicitudesService = {
    busqueda,
    subirSolicitud,
    borrarSolicitud
}

export default SolicitudesService;