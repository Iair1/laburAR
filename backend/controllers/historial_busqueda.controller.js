import HistorialBusquedaService from "../services/historial_busqueda.service.js";

const miHistorial = async(req, res)=>{
    const id = req.id;
    try{
        const result = await HistorialBusquedaService.miHistorial(id);
        res.status(201).json({ message: "Busqueda exitosa", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const agregarBusqueda = async(req, res)=>{
    const id = req.id;
    const { busqueda } = req.body;
    if(!busqueda){
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    try{
        const result = await HistorialBusquedaService.agregarBusqueda(id, busqueda);
        res.status(201).json({ message: "Busqueda agregada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const HistorialBusquedaController = {
    miHistorial,
    agregarBusqueda
}
export default HistorialBusquedaController;