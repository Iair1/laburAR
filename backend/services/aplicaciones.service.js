import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;



async function subirAplicacion(id, solicitudid, periodo) {
    const client = new Client(config);
    try {
        await client.connect();
        const result =  await client.query(
            `INSERT INTO aplicaciones (trabajadorid, solicitudid, periodo)
            SELECT $1, $2, $3
            WHERE EXISTS(
            SELECT 1 FROM solicitudes
            WHERE periodo[1] <= $4
            AND periodo[2] >= $5
            AND id = $2) RETURNING *`, [id, solicitudid, periodo, periodo[0], periodo[1]]);
        if(result.rows.length === 0) {
            throw new Error("No se puede subir la aplicación, el periodo no coincide con el de la solicitud");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

async function borrarAplicacion(id, solicitudid) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`DELETE FROM aplicaciones WHERE trabajadorid = $1 AND solicitudid = $2`, [id, solicitudid]);
        return result
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const AplicacionesService = {
    subirAplicacion,
    borrarAplicacion
}
export default AplicacionesService;