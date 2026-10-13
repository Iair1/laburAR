import Usuarios_AptitudesService from "../services/usuarios_aptitudes.service.js";

// Valida y normaliza los datos propios de cada servicio (precio, descripción, experiencia).
// Devuelve { error } si algo no es válido.
function datosDelServicio(body) {
    const { cobro_por_hora, descripcion, anios_experiencia } = body;
    const vacio = (v) => v === undefined || v === null || v === "";
    const precio = vacio(cobro_por_hora) ? null : Number(cobro_por_hora);
    const experiencia = vacio(anios_experiencia) ? null : Number(anios_experiencia);
    if (precio !== null && (!Number.isFinite(precio) || precio < 0)) {
        return { error: "El precio tiene que ser un número válido" };
    }
    if (experiencia !== null && (!Number.isInteger(experiencia) || experiencia < 0 || experiencia > 80)) {
        return { error: "Los años de experiencia tienen que ser un número entero válido" };
    }
    const texto = vacio(descripcion) ? null : String(descripcion).trim().slice(0, 2000);
    return { cobro_por_hora: precio, descripcion: texto, anios_experiencia: experiencia };
}

const nuevaAptitud = async(req, res)=>{
    const id = req.id;
    const{aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria} = req.body;
    if(!aptitud){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    const servicio = datosDelServicio(req.body);
    if(servicio.error){
        return res.status(400).json({ message: servicio.error });
    }
    try{
        const result = await Usuarios_AptitudesService.nuevaAptitud(id, aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria, servicio.cobro_por_hora, servicio.descripcion, servicio.anios_experiencia);
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

const editarAptitud = async(req, res)=>{
    const id = req.id;
    const {aptitud} = req.body;
    if(!aptitud){
        return res.status(400).json({ message: "Debe indicar qué servicio quiere editar"});
    }
    const servicio = datosDelServicio(req.body);
    if(servicio.error){
        return res.status(400).json({ message: servicio.error });
    }
    try{
        const result = await Usuarios_AptitudesService.editarAptitud(id, aptitud, servicio.cobro_por_hora, servicio.descripcion, servicio.anios_experiencia);
        res.status(200).json({ message: "Servicio actualizado exitosamente", result});
    } catch (error) {
        const status = error.message === "No ofrecés ese servicio" ? 404 : 500;
        res.status(status).json({ message: error.message || "Error al editar el servicio" });
    }
}

const Usuarios_AptitudesController = {
    nuevaAptitud,
    eliminarAptitud,
    misAptitudes,
    editarAptitud
}

export default Usuarios_AptitudesController;
