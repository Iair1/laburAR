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
            WHERE periodo[0] <= $4
            AND periodo[1] >= $5
            AND id = $2)`, [id, solicitudid, periodo, periodo[0], periodo[1]]);
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const AplicacionesService = {
    subirAplicacion
}
export default AplicacionesService;