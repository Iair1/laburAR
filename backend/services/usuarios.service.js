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
    return result
}

const sip= async()=>{
    
    const client = new Client(config);
    try{
        await client.connect()
        const result = subirImagen("./descarga.png")
        return result;
    }catch(error){
        console.error("Error al subir la imagen:", error);
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