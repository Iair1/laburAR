import SolicitudesService from "../services/solicitudes.service.js";

const borrarSolicitud = async(req, res)=>{
    const id = req.id;
    const { solicitudid } = req.body;
    if(!solicitudid) {
        return res.status(400).json({ message: "Debe proporcionar el ID de la solicitud a eliminar"});
    }
    try{
        const result = await SolicitudesService.borrarSolicitud(id, solicitudid);
        res.status(200).json({ message: "Solicitud eliminada exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const subirSolicitud = async(req, res)=>{
    const id = req.id;
    const { solicitud, aptitudid, aptitud_especificaid, trabajoid, periodo, localidad } = req.body;
    if(!solicitud || !aptitudid || !periodo || !localidad) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await SolicitudesService.subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid);
        res.status(201).json({ message: "Solicitud subida exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}



const busqueda = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.busqueda(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}
const SolicitudesController = {
    busqueda,
    subirSolicitud,
    borrarSolicitud
}
export default SolicitudesController;