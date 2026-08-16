import Usuarios_AptitudesService from "../services/usuarios_aptitudes.service.js";

const nuevaAptitud = async(req, res)=>{
    const id = req.id;
    const{aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria} = req.body;
    if(!aptitud){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await Usuarios_AptitudesService.nuevaAptitud(id, aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria);
        res.status(201).json({ message: "Aptitud agregada exitosamente", result});
    } catch (error) {
        res.status(500).json({ message: "Error al agregar aptitud", error });
    }
}

const eliminarAptitud = async(req, res)=>{
    const id = req.id;
    const {aptitud} = req.body;
    if(!aptitud){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await Usuarios_AptitudesService.eliminarAptitud(id, aptitud);
        res.status(200).json({ message: "Aptitud eliminada exitosamente", result});
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar aptitud", error });
    }
}

const misAptitudes = async(req, res)=>{
    const id = req.id;
    try{
        const result = await Usuarios_AptitudesService.misAptitudes(id);
        res.status(200).json({ message: "Aptitudes obtenidas exitosamente", result});
    } catch (error) {
        res.status(500).json({ message: "Error al obtener aptitudes", error });
    }
}

const Usuarios_AptitudesController = {
    nuevaAptitud,
    eliminarAptitud,
    misAptitudes
}

export default Usuarios_AptitudesController;
