import AplicacionesService from "../services/aplicaciones.service.js";

const subirAplicacion = async(req, res)=>{
    const id = req.id;
    const {periodo, solicitudid } = req.body;
    if(!periodo || !solicitudid) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await AplicacionesService.subirAplicacion(id, solicitudid, periodo);
        res.status(201).json({ message: "Aplicación subida exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const borrarAplicacion = async(req, res)=>{
    const id = req.id;
    const {solicitudid} = req.body;
    if(!solicitudid) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await AplicacionesService.borrarAplicacion(id, solicitudid);
        res.status(201).json({ message: "Aplicación borrada exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const AplicacionesController = {
    subirAplicacion,
    borrarAplicacion
}
export default AplicacionesController;