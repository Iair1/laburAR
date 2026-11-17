import ReseñaService from "../services/reseña.service.js";

const nuevaReseña = async(req, res)=>{
    const id = req.id;
    const { reseña, resena, puntuacion, otroid, rol, trabajo } = req.body;
    const texto = String(reseña ?? resena ?? "").trim();
    const estrellas = Number(puntuacion);
    if(!texto || !puntuacion || !trabajo) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    if(!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
        return res.status(400).json({ message: "La puntuación tiene que ser de 1 a 5 estrellas"});
    }
    if(texto.length > 1000) {
        return res.status(400).json({ message: "La reseña puede tener hasta 1000 caracteres"});
    }
    try{
        const result = await ReseñaService.nuevaReseña(id, texto, estrellas, otroid, rol, Number(trabajo));
        res.status(201).json({ message: "Reseña agregada exitosamente", result});
    } catch(error){
        res.status(error.status || 500).json({ message: error.message });
    }
}

// Trabajos terminados que el usuario todavía no reseñó
const pendientes = async(req, res)=>{
    try{
        const result = await ReseñaService.pendientes(req.id);
        res.status(200).json({ message: "Reseñas pendientes", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

// Reseñas que recibió un usuario (para su perfil)
const reseñasDe = async(req, res)=>{
    const userid = Number(req.params.userid);
    if(!Number.isInteger(userid) || userid <= 0) {
        return res.status(400).json({ message: "Usuario inválido"});
    }
    try{
        const result = await ReseñaService.reseñasDe(userid);
        res.status(200).json({ message: "Reseñas encontradas", result});
    } catch(error){
        res.status(error.status || 500).json({ message: error.message });
    }
}

const ReseñaController = {
    nuevaReseña,
    pendientes,
    reseñasDe
}
export default ReseñaController;
