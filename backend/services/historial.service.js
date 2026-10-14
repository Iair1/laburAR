import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function miHistorial(id){
    const client = new Client(config);
    try{
        await client.connect();
        const result1 = await client.query(`
            SELECT * FROM(
                SELECT DISTINCT ON (contratadorid) *
                FROM historial
                WHERE trabajadorid = $1
                ORDER BY contratadorid, id DESC
            ) ORDER BY id DESC`, [id]);
        const result2 = await client.query(`
            SELECT * FROM(
                SELECT DISTINCT ON (trabajadorid) *
                FROM historial
                WHERE contratadorid = $1
                ORDER BY trabajadorid, id DESC
            )ORDER BY id DESC`, [id]);
        return [...result1.rows, ...result2.rows];
    }catch(error){
        throw new Error(error.message);
    } finally{
        await client.end();
    }
}

const HistorialService = {
    miHistorial
}
export default HistorialService;