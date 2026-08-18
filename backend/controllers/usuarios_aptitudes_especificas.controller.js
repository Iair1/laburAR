import Usuarios_Aptitudes_EspecificasService from "../services/usuarios_aptitudes_especificas.service.js";

const nuevaAptitudEspecifica = async(req, res)=>{
    const id = req.id;
    const{aptitud_especifica, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid, aptID} = req.body;
    if(!aptitud_especifica || !usuario_aptitudid || !aptID){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await Usuarios_Aptitudes_EspecificasService.nuevaAptitudEspecifica(id, aptitud_especifica, matricula_numero, matricula_jurisdiccion, matricula_categoria, usuario_aptitudid, aptID);
        res.status(201).json({ message: "Aptitud específica agregada exitosamente", result});
    } catch (error) {
        res.status(500).json({ message: "Error al agregar aptitud específica", error: error.message });
    }
}

const misAptitudesEspecificas = async(req, res)=>{
    const id = req.id
    try{
        const result = await Usuarios_Aptitudes_EspecificasService.misAptitudesEspecificas(id)
        res.status(201).json({message: "Aptitudes conseguidad", result})
    }catch(error){
        res.status(500).json({message: "Error al buscar aptitudes especificas", error: error.message})
    }
}

const eliminarAptitudEspecifica = async(req, res)=>{
    const id = req.id
    const{filaid} = req.body
    try{
        const result = await Usuarios_Aptitudes_EspecificasService.eliminarAptitudEspecifica(id, filaid)
        res.status(201).json({message: "Aptitud eliminada exitosamente", result})
    }catch(error){
        res.status(500).json({message: "No se pudo eliminar la aptitud", error: error.message})
    }
}

const Usuarios_Aptitudes_EspecificasController = {
    nuevaAptitudEspecifica,
    misAptitudesEspecificas,
    eliminarAptitudEspecifica
}

export default Usuarios_Aptitudes_EspecificasController