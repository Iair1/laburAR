import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";


/*async function entregarS (solicitudes) {
    const sCompletas = {}
    try{
        for(const solicitud of solicitudes){
            const completa = await client.query("SELECT * FROM solicitudes WHERE id = $1", [solicitud]);
            sCompletas[solicitud] = completa.rows[0];
        }
        return sCompletas;
    }catch(error){
        console.error("Error al entregar solicitudes completas:", error);
        throw error;
    } 
}*/
async function borrarSolicitud(id, solicitudid) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("DELETE FROM solicitudes WHERE contratadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea borrar no existe o no le pertenece a este usuario");
        }
    } catch(error){
        console.error("Error al borrar la solicitud:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(
            "INSERT INTO solicitudes (contratadorid, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid]
        );
        return result.rows[0];
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

async function busqueda(id) {
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, a.aptitud, ae.aptitud_especifica, t.trabajo FROM (

            SELECT s.id, s.solicitud, s.periodo
            FROM solicitudes s
            JOIN usuarios_aptitudes ua
                ON ua.aptitudid = s.aptitudid
            JOIN usuarios u
                ON u.id = ua.userid
            WHERE u.id = $1 AND u.localidad = s.localidad

            UNION ALL

            SELECT s.id, s.solicitud, s.periodo
            FROM solicitudes s
            JOIN usuarios_aptitudes_e uae
                ON uae.aptitud_especificaid = s.aptitud_especificaid
            JOIN usuarios u
                ON u.id = uae.userid
            WHERE u.id = $1 AND u.localidad = s.localidad

            UNION ALL

            SELECT s.id, s.solicitud, s.periodo
            FROM solicitudes s
            JOIN usuarios_tdr ut
                ON ut.trabajoid = s.trabajoid
            JOIN usuarios u
                ON u.id = ut.userid
            WHERE u.id = $1 AND u.localidad = s.localidad
            
            UNION ALL
            
            SELECT s.id, s.solicitud, s.periodo
            FROM solicitudes s
            JOIN usuarios u
                ON u.localidad = s.localidad
            WHERE u.id = $1

            ) r
            INNER JOIN solicitudes s ON s.id = r.id
            INNER JOIN aptitudes a ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t ON t.id = s.trabajoid
            GROUP BY s.id, s.solicitud, s.periodo, a.aptitud, ae.aptitud_especifica, t.trabajo
            ORDER BY COUNT(*) DESC;
            `, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const SolicitudesService = {
    busqueda,
    subirSolicitud,
    borrarSolicitud
}

export default SolicitudesService;