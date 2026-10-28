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
    const { solicitud, aptitudid, aptitud, aptitud_especificaid, trabajoid, periodo, localidad, diassemana, trabajadorid, dirigida } = req.body;
    // dirigida === false → "problema" abierto que ve cualquier trabajador (no lleva trabajadorid).
    // Si no, es una solicitud a un trabajador puntual, como siempre.
    const abierta = dirigida === false;
    if(!solicitud || !periodo || !localidad || (!abierta && !trabajadorid)) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    if(!Array.isArray(periodo) || periodo.length !== 2 || !periodo[0] || !periodo[1] || periodo[1] < periodo[0]) {
        return res.status(400).json({ message: "El período no es válido"});
    }
    try{
        const result = await SolicitudesService.subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, abierta ? null : trabajadorid, !abierta, aptitud);
        res.status(201).json({ message: "Solicitud subida exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const aceptarSolicitud = async(req, res)=>{
    const id = req.id;
    const { solicitudid, dia, hora } = req.body;
    if(!solicitudid /*|| !dia #lo descomento cuando agregue la funcion al front*/) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    // hora (opcional): la que elige el trabajador, "HH:MM"
    if(hora && (!dia || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))) {
        return res.status(400).json({ message: "La hora no es válida"});
    }
    try{
        const result = await SolicitudesService.aceptarSolicitud(id, solicitudid, dia, hora || null);
        res.status(200).json({ message: "Solicitud aceptada exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const rechazarSolicitud = async(req, res)=>{
    const id = req.id;
    const { solicitudid } = req.body;
    try{
        const result = await SolicitudesService.rechazarSolicitud(id, solicitudid);
        res.status(200).json({ message: "Solicitud rechazada exitosamente", result });
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
const misSolicitudes = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.misSolicitudes(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}
const trabajosPendientes = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.trabajosPendientes(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}
const serviciosPendientes = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.serviciosPendientes(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

/*const terminarTrabajo = async(req, res)=>{
    const id = req.id;
    const { solicitudid } = req.body;
    try{
        const result = await SolicitudesService.terminarTrabajo(id, solicitudid);
        res.status(201).json({ message: result.message, resultado: result.resultado});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}*/
const cancelarTrabajo = async(req, res)=>{
    const id = req.id;
    const { solicitudid } = req.body;
    if(!solicitudid) {
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await SolicitudesService.cancelarTrabajo(id, solicitudid);
        res.status(201).json({ message: "Cancelacion exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const revisarTerminadas = async(req, res)=>{
    try{
        const result = await SolicitudesService.revisarTerminadas();
        res.status(200).json({ message: "Revisión de solicitudes terminadas exitosa", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}



//puede que lo saque

const busquedaAA = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.busquedaAA(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

// Problemas abiertos (dirigida = false) que publicó el usuario, en cualquier estado
const misProblemas = async(req, res)=>{
    const id = req.id;
    try{
        const result = await SolicitudesService.misProblemas(id);
        res.status(200).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const SolicitudesController = {
    misProblemas,
    busqueda,
    busquedaAA,
    subirSolicitud,
    borrarSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    trabajosPendientes,
    serviciosPendientes,
    cancelarTrabajo,
    misSolicitudes,
    revisarTerminadas
}
export default SolicitudesController;