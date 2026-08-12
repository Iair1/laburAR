import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function cambiarContraseña(id, contraseñaVieja, contraseñaNueva) {
    const client = new Client(config);
    await client.connect();
    try{
        const user = await client.query("SELECT * FROM usuarios WHERE id = $1", [id]);
        if (user.rowCount === 0) {
            throw new Error("Usuario no encontrado");
        }
        const dbUser = user.rows[0];
        const contraCorrecta = await bcrypt.compare(contraseñaVieja, dbUser.contraseña);
        if (!contraCorrecta) {
            throw new Error("Contraseña invalida");
        }
        const hasheada = await bcrypt.hash(contraseñaNueva, 11);
        const result = await client.query("UPDATE usuarios SET contraseña = $1 WHERE id = $2", [hasheada, id]);
        return result;
    } catch(error){
        console.error("Error al cambiar contraseña:", error);
        throw error;
    } finally{
        await client.end();
    }
}

cloudinary.config({
    cloud_name: 'dntg1hezf',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function cambiarDato(id, inf) {
    const client = new Client(config);
    await client.connect();
    try{
        let a = ""
        for(let i = 0; i < inf.length; i++){
            if(inf[i].dato==="foto_perfil"){
                inf[i].valor = await subirImagen(inf[i].valor);
            }
            a = a + `${inf[i].dato} = ${inf[i].valor}, `;
        }
        a = a.slice(0, -2);
        console.log(a);
        const result = await client.query(`UPDATE usuarios SET ${a} WHERE id = $1`, [id]);
        return result;
    } catch(error){
        console.error("Error al cambiar dato:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function subirImagen(imagen) {
    if(imagen){
        const result = await cloudinary.uploader.upload(imagen)
        console.log(result)
        const url = cloudinary.url(result.public_id, {
            transformation: [
                { width: 150, height: 150}
            ]
        })
        return url;
    }
}

const sip= async()=>{
    
    const client = new Client(config);
    try{
        await client.connect()
        const result = subirImagen("https://recursos.ort.edu.ar/static/archivos/banner/3418")
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


const crearCuenta = async (nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil ) => {
    const client = new Client(config);
    try {
        await client.connect();
        const hasheada = await bcrypt.hash(contraseña, 11);
        const fpurl = await subirImagen(foto_perfil);
        const result = await client.query(
            "INSERT INTO usuarios (nombre_completo, contraseña, localidad, direccion_calle, direccion_altura, codigo_postal, dni, foto_perfil) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre_completo, dni",
            [nombre_completo, hasheada, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, fpurl]
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
        { userid: dbUser.id, nombre_completo: dbUser.nombre_completo},
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
    cambiarDato,
    prueba,
    sip,
    cambiarContraseña
}
export default UsuariosService;