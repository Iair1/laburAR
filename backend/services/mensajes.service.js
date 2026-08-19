import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function mandarMensaje(id, receptor, texto) {
    const client = new Client(config);
    try {
        await client.connect();
        const result =  await client.query("INSERT INTO mensajes (emisorid, receptorid, contenido) VALUES ($1, $2, $3)", [id, receptor, texto]);
        return result.rows[0]
    }catch(error){
        throw error
    }finally{
        await client.end();
    }  
}

async function borrarMensaje(id, mensaje) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("DELETE FROM mensajes WHERE id = $2 AND emisorid=$1 RETURNING *", [id, mensaje]);
        if(result.rows.length === 0){
            throw new Error("El mensaje que desea eliminar no existe o no es suyo.")
        }
        return result.rows[0].contenido
    }catch(error){
        throw error
    }finally{
        await client.end();
    }
}

async function conseguirChat(id, otroid) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("SELECT * FROM mensajes WHERE emisorid IN ($1, $2) and receptorid IN ($1, $2)",
            [id, otroid]);
    return result.rows
    }catch(error){
        throw error
    }finally{
        await client.end();
    }
}

async function misChats(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`SELECT DISTINCT
                u.id,
                u.nombre,
                u.foto
            FROM mensajes m
            JOIN usuarios u
                ON u.id = CASE
                    WHEN m.emisorid = $1 THEN m.receptorid
                    ELSE m.emisorid
                END
            WHERE m.emisorid = $1 OR m.receptorid = $1;`, [id]);
    return result.rows
    }catch(error){
        throw error
    }finally{
        await client.end();
    }
}

const MensajesService ={
    mandarMensaje,
    borrarMensaje,
    conseguirChat, 
    misChats
}
export default MensajesService