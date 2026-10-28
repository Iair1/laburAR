import ImagenesTrabajosService from "../services/imagenes_trabajos.service.js"

const subirImagenTrabajo = async(req, res)=>{
    console.log("Al controller llego")
    const id = req.id
    const{imagen, descripcion} = req.body
    if(!imagen){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await ImagenesTrabajosService.subirImagenTrabajo(id, imagen, descripcion)
        res.status(201).json({ message: "Imagen agregada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const eliminarImagen = async(req, res)=>{
    const id = req.id
    const{imagen} = req.body
    if(!imagen){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await ImagenesTrabajosService.eliminarImagen(id, imagen)
        res.status(201).json({ message: "Imagen eliminada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const misImagenes = async(req, res)=>{
    const id = req.id
    try{
        const result = await ImagenesTrabajosService.misImagenes(id)
        res.status(201).json({ message: "Imagenes encontradas exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const cambiarDescripcion = async(req, res)=>{
    const id = req.id
    const{imagen, descripcion} = req.body
    if(!imagen || !descripcion){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await ImagenesTrabajosService.cambiarDescripcion(id, imagen, descripcion)
        res.status(201).json({ message: "Descripcion cambiada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}



// Fotos de los trabajos de otro usuario (para mostrarlas en su perfil)
const imagenesDe = async(req, res)=>{
    const userid = Number(req.params.userid)
    if(!Number.isInteger(userid) || userid <= 0){
        return res.status(400).json({ message: "Usuario inválido"});
    }
    try{
        const result = await ImagenesTrabajosService.misImagenes(userid)
        res.status(200).json({ message: "Imagenes encontradas exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const ImagenesTrabajosController = {
    imagenesDe,
    subirImagenTrabajo,
    eliminarImagen,
    misImagenes,
    cambiarDescripcion
}
export default ImagenesTrabajosController;