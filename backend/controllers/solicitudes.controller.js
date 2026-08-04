//import SolicitudesService from "../services/solicitudes.service.js";

const busqueda = async(req, res)=>{
    const id = req.id;
    try{
        //const result = await SolicitudesService.busqueda(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const SolicitudesController = {
    // BANANA
}
export default SolicitudesController;