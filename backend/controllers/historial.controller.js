import HistorialService from "../services/historial.service.js";

const miHistorial = async (req, res) => {
    const id = req.id;
    try {
        const result = await HistorialService.miHistorial(id);
        res.status(200).json({ message: "Historial obtenido exitosamente", result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const HistorialController = {
    miHistorial
}
export default HistorialController;