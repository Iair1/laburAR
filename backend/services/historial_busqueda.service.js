import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function miHistorial(id){
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT DISTINCT ON (busqueda) *
            FROM historial_busqueda
            WHERE userid = $1
            ORDER BY busqueda, id DESC
        `, [id]);
        return result.rows;
    } catch(error){
        throw new Error(error.message);
    } finally{
        await client.end();
    }
}

async function agregarBusqueda(id, busqueda){
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("INSERT INTO historial_busqueda (userid, busqueda) VALUES ($1, $2) RETURNING *", [id, busqueda]);
        return result.rows[0];
    } catch(error){
        throw new Error(error.message);
    } finally{
        await client.end();
    }
}

const HistorialBusquedaService = {
    miHistorial,
    agregarBusqueda
}
export default HistorialBusquedaService;

