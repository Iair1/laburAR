import AptitudesService from "../services/aptitudes.service.js"

const buscarAptitudes = async(req, res)=>{
    try{
        const result = await AptitudesService.buscarAptitudes()
        res.status(201).json({ message: "Aptitudes encontradas exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const AptitudesController = {
    buscarAptitudes
}
export default AptitudesController;