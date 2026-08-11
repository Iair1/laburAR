import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function subirAplicacion(id, solicitudid, periodo) {
    const client = new Client(config);
    try {
        await client.connect();
        constmresult =  await client.query(`INSERT INTO aplicaciones (trabajadorid, solicitudid, periodo)
            VALUES ($1, $2, $3)
            RETURNING `, [id, solicitudid, periodo]);
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