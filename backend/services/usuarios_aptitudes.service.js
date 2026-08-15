import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function nuevaAptitud(id, aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria) {
    const client = new Client(config);
    try{
        await client.connect();
        const aptId = await client.query(`
            INSERT INTO aptitudes (aptitud) 
            VALUES ($1)
            ON CONFLICT (aptitud) 
            DO UPDATE SET aptitud = EXCLUDED.aptitud
            RETURNING id;
        `, [aptitud]);
        
        const result = await client.query(`
            INSERT INTO usuarios_aptitudes
            (userid, aptitudid, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [id, aptId.rows[0].id, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria]);
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const Usuarios_AptitudesService = {
    nuevaAptitud
};
export default Usuarios_AptitudesService;