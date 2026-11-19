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
    if(String(busqueda).length > 1000){
        return res.status(400).json({ message: "La búsqueda es demasiado larga" });
    }
    try{
        const result = await HistorialBusquedaService.agregarBusqueda(id, busqueda);
        res.status(201).json({ message: "Busqueda agregada exitosamente", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const borrarHistorial = async(req, res)=>{
    try{
        const result = await HistorialBusquedaService.borrarHistorial(req.id);
        res.status(200).json({ message: "Historial borrado", result});
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const HistorialBusquedaController = {
    miHistorial,
    agregarBusqueda,
    borrarHistorial
}
export default HistorialBusquedaController;