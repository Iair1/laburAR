import ReseñaService from "../services/reseña.service.js";

const nuevaReseña = async(req, res)=>{
    const id = req.id;
    const { reseña, puntuacion, otroid, rol, trabajo } = req.body;
    if(!reseña || !puntuacion || !otroid || !rol || !trabajo) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await ReseñaService.nuevaReseña(id, reseña, puntuacion, otroid, rol, trabajo);
        res.status(201).json({ message: "Reseña agregada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const ReseñaController = {
    nuevaReseña
}
export default ReseñaController;