import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function busqueda(id) {
    const client = new Client(config);
    try {
        await client.connect();
        const sUtiles = await client.query(`SELECT s.id
            FROM solicitudes s
            JOIN usuarios_aptitudes ua
                ON ua.aptitudid = s.aptitudid
            WHERE ua.userid = $1

            UNION ALL

            SELECT s.id
            FROM solicitudes s
            JOIN usuarios_aptitudes_e uae
                ON uae.aptitud_especificaid = s.aptitud_especificaid
            WHERE uae.userid = $1

            UNION ALL

            SELECT s.id
            FROM solicitudes s
            JOIN usuarios_tdr ut
                ON ut.trabajoid = s.trabajoid
            WHERE ut.userid = $1;`, [id]);
        const conteo = {};

        for (const { id } of sUtiles) {
            conteo[id] = (conteo[id] || 0) + 1;
        }
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}