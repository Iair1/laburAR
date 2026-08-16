import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function nuevaAptitudEspecifica(id, aptitud_especifica, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid, aptID) {
    const client = new Client(config);
    console.log("Ya lo hago")
    try{
        await client.connect();
        console.log("hola")
        const aptEspecificaId = await client.query(`
            INSERT INTO aptitudes_especificas (aptitud_especifica, aptitudid) 
            VALUES ($1, $2)
            ON CONFLICT (aptitud_especifica) 
            DO UPDATE SET aptitud_especifica = EXCLUDED.aptitud_especifica
            RETURNING id, aptitudid;
        `, [aptitud_especifica, aptID]);
        console.log("Conseugila aptitud")
        if(aptEspecificaId.rows[0].aptitudid != aptID){
            throw new Error("La aptitud específica no pertenece a la aptitud seleccionada");
        }
        console.log("Ya esta, solo la agrego")
        console.log([id, aptEspecificaId.rows[0].id, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid])
        const result = await client.query(`
            INSERT INTO usuarios_aptitudes_especificas
            (userid, aptitud_especificaid, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [id, aptEspecificaId.rows[0].id, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid]);
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const Usuarios_Aptitudes_EspecificasService = {
    nuevaAptitudEspecifica
}
export default Usuarios_Aptitudes_EspecificasService;