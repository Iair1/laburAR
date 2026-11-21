import config from "../dbconfig.js";
import { Client } from "../db.js";


async function miHistorial(id){
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT * FROM(
                SELECT DISTINCT ON (busqueda) *
                FROM historial_busqueda
                WHERE userid = $1
                ORDER BY busqueda, id DESC
            ) h ORDER BY id DESC
            LIMIT 20
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

// Borra todo el historial de búsquedas del usuario
async function borrarHistorial(id){
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("DELETE FROM historial_busqueda WHERE userid = $1", [id]);
        return result.rowCount;
    } finally{
        await client.end();
    }
}

const HistorialBusquedaService = {
    miHistorial,
    agregarBusqueda,
    borrarHistorial
}
export default HistorialBusquedaService;

