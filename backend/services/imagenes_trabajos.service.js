import config from "../dbconfig.js";
import pkg from "pg";
import {v2 as cloudinary} from "cloudinary";
const {Client} = pkg;

async function subirImagen(imagen) {
    console.log("ya esdtamos es subiurimagebn")
    if(!imagen) return null;
    console.log("hay imagne")
    const result = await cloudinary.uploader.upload(imagen);
    console.log("subidaaa")
    // Ojo: Cloudinary devuelve "public_id" (antes se leía "publicid", que no
    // existe, y por eso la foto se guardaba como NULL en la base).
    // crop "fill" + gravity "face" recorta un cuadrado centrado en la cara sin deformarla.
    const url = cloudinary.url(result.public_id, {
        secure: true,
        version: result.version,
        transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" }
        ]
    });
    return url;
}


async function subirImagenTrabajo(id, imagen, descripcion) {
    console.log("CA extra:", process.env.NODE_EXTRA_CA_CERTS);
    console.log("alñ service tambien")
    const client = new Client(config);
    try{
        await client.connect()
        console.log("ya vamos a subir la imagen")
        const imglink = await subirImagen(imagen)
        console.log("se subio, queda solo el query")
        const result = await client.query("INSERT INTO imagenes_trabajos (userid, imagen, descripcion) VALUES ($1, $2, $3) RETURNING *", [id, imglink, descripcion]);
        console.log("terminamos el querry!!!")
        return result.rows[0]
    } catch(error){
        console.error("Error subir imagen:", error?.error?.message ?? error?.message ?? error);
        throw error;
    }finally{
        await client.end();
    }
}

async function eliminarImagen(id, imagen){
    const client = new Client(config)
    try{
        await client.connect()
        const result = await client.query("DELETE FROM imagenes_trabajos WHERE userid=$1 AND id=$2 RETURNING *", [id, imagen])
        if(result.rowCount === 0){
            throw new Error("La imagen no existe o no le pertenece");
        }
        return result.rows[0]
    } catch(error){
        console.error("Error borrar imagen:", error.message);
        throw error;
    } finally{
        await client.end()
    }
}

async function misImagenes(id){
    const client = new Client(config)
    try{
        await client.connect()
        const result = await client.query("SELECT * FROM imagenes_trabajos WHERE userid=$1", [id])
        return result.rows
    }catch(error){
        throw error
    } finally{
        await client.end()
    }
}

async function cambiarDescripcion(id, imagen, descripcion){
    const client = new Client(config)
    try{
        await client.connect()
        const result = await client.query("UPDATE imagenes_trabajos SET descripcion = $3 WHERE userid = $1 AND id = $2 RETURNING descripcion",[id, imagen, descripcion]);
        if(result.rowCount===0){
            throw new Error("La imagen no existe o no le pertenece");            
        }
        return result.rows[0]
    } catch(error){
        throw error
    } finally{
        await client.end()
    }
}

const ImaganesTrabajosService = {
    subirImagenTrabajo,
    eliminarImagen,
    misImagenes,
    cambiarDescripcion
}
export default ImaganesTrabajosService