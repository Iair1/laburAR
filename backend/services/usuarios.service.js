import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

cloudinary.config({
    cloud_name: 'dntg1hezf',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function subirImagen(imagen) {
    const result = await cloudinary.uploader.upload(imagen)
    console.log(result)
    const url = cloudinary.url(result.public_id, {
        transformation: [
            { width: 150, height: 150}
        ]
    })
    return url;
}

const sip= async()=>{
    
    const client = new Client(config);
    try{
        await client.connect()
        const result = subirImagen("data:image/png;base64,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")
        return result;
    }catch(error){
        console.error("Error al subir la imagen:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const prueba = async()=>{
    const client = new Client(config);
    try{
        await client.connect()
        return{ "HOLA": "CONEXION EXITOSA" }
    }finally{
        await client.end();
    }
}


const crearCuenta = async (nombre_completo, contraseña, localidad, domicilio, dni, foto_perfil ) => {
    const client = new Client(config);
    try {
        await client.connect();
        const hasheada = await bcrypt.hash(contraseña, 11);
        const result = await client.query(
            "INSERT INTO usuarios (nombre_completo, contraseña, localidad, domicilio, dni, puntuaciones_como_trabajador, puntuaciones_como_contratador, foto_perfil) VALUES ($1, $2, $3, $4, $5, 0, 0, $6) RETURNING id, nombre_completo, dni",
            [nombre_completo, hasheada, localidad, domicilio, dni, foto_perfil]
        );
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}
const iniciarSesion = async (nombre_completo, contraseña) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query("SELECT * FROM usuarios WHERE nombre_completo = $1", [nombre_completo]);
        if (result.rowCount === 0) {
            throw new Error("Usuario no encontrado");
        }
        const dbUser = result.rows[0];
        const contraCorrecta = await bcrypt.compare(contraseña, dbUser.contraseña);
        if (!contraCorrecta) {
            throw new Error("Contraseña invalida");
        }
        const token = jwt.sign(
        { userid: dbUser.userid, nombre_completo: dbUser.nombre_completo, rol: dbUser.rol },
        JWT_SECRET,
        { expiresIn: "1h" }
        );
        return token;
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const UsuariosService={
    crearCuenta, 
    iniciarSesion,

    prueba,
    sip
}
export default UsuariosService;