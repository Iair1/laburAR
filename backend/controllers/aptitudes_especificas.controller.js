import AptitudesEspecificasService from "../services/aptitudes_especificas.service.js"

const buscarAptitudesEspecificas = async(req, res)=>{
    try{
        const result = await AptitudesEspecificasService.buscarAptitudesEspecificas()
        res.status(201).json({ message: "Aptitudes Especificas encontradas exitosamente", result });
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}

const AptitudesEspecificasController = {
    buscarAptitudesEspecificas
}
export default AptitudesEspecificasController;