import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function nuevaAptitudEspecifica(id, aptitud_especifica, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid, aptID) {
    const client = new Client(config);
    try{
        await client.connect();
        const aptEspecificaId = await client.query(`
            INSERT INTO aptitudes_especificas (aptitud_especifica, aptitudid) 
            VALUES ($1, $2)
            ON CONFLICT (aptitud_especifica) 
            DO UPDATE SET aptitud_especifica = EXCLUDED.aptitud_especifica
            RETURNING id, aptitudid;
        `, [aptitud_especifica, aptID]);
        if(aptEspecificaId.rows[0].aptitudid != aptID){
            throw new Error("La aptitud específica no pertenece a la aptitud seleccionada");
        }
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


async function misAptitudesEspecificas(id){
    const client = new Client(config);
    try{
        await client.connect();
        console.log("ACA ACA")
        const result = await client.query(`SELECT uae.*, ae.aptitud_especifica, a.aptitud 
            FROM usuarios_aptitudes_especificas uae
            INNER JOIN aptitudes_especificas ae
            ON uae.aptitud_especificaid = ae.id
            INNER JOIN usuarios_aptitudes ua
            ON uae.usuario_aptitudid = ua.id
            INNER JOIN aptitudes a
            ON ua.aptitudid = a.id
            WHERE uae.userid=$1`, [id]);
        return result.rows
    } catch(error){
        throw error
    } finally{
        await client.end();
    }
}

async function eliminarAptitudEspecifica(id, filaid) {
    const client = new Client(config)
    try{
        await client.connect();
        const result = await client.query("DELETE FROM usuarios_aptitudes_especificas WHERE userid = $1 AND id=$2", [id, filaid])
        return result.rows
    }catch(error){
        throw error
    }finally{
        await client.end();
    }
}

const Usuarios_Aptitudes_EspecificasService = {
    nuevaAptitudEspecifica,
    misAptitudesEspecificas,
    eliminarAptitudEspecifica
}
export default Usuarios_Aptitudes_EspecificasService;