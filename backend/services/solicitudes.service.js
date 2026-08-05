import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";


async function entregarS (solicitudes) {
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
}

async function busqueda(id) {
    const client = new Client(config);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT id
            FROM (

            SELECT s.id
            FROM solicitudes s
            JOIN usuarios_aptitudes ua
                ON ua.aptitudid = s.aptitudid
            JOIN usuarios u
                ON u.id = ua.userid
            WHERE u.id = $1 AND u.localidad = s.localidad

            UNION ALL

            SELECT s.id
            FROM solicitudes s
            JOIN usuarios_aptitudes_e uae
                ON uae.aptitud_especificaid = s.aptitud_especificaid
            JOIN usuarios u
                ON u.id = uae.userid
            WHERE u.id = $1 AND u.localidad = s.localidad

            UNION ALL

            SELECT s.id
            FROM solicitudes s
            JOIN usuarios_tdr ut
                ON ut.trabajoid = s.trabajoid
            JOIN usuarios u
                ON u.id = ut.userid
            WHERE u.id = $1 AND u.localidad = s.localidad
            
            UNION ALL
            
            SELECT s.id
            FROM solicitudes s
            JOIN usuarios u
                ON u.localidad = s.localidad
            WHERE u.id = $1

            ) t
            GROUP BY id
            ORDER BY coincidencias DESC;
            `, [id]);

        const sMasComodas = []
        for(const solicitud of sUtiles.rows){
            sMasComodas.push(solicitud.id)
        }
        
            
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const SolicitudesService = {
    busqueda
}

export default SolicitudesService;