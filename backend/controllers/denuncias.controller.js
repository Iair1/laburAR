import DenunciasService, { MOTIVOS_DENUNCIA } from "../services/denuncias.service.js";

const motivos = (req, res) => {
    res.status(200).json({ message: "Motivos de denuncia", result: MOTIVOS_DENUNCIA });
};

const nuevaDenuncia = async (req, res) => {
    try {
        const result = await DenunciasService.nuevaDenuncia(req.id, req.body || {});
        res.status(201).json({ message: "Recibimos tu denuncia. La vamos a revisar.", result });
    } catch (error) {
        if (!error.status) console.error("Error al denunciar:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

const DenunciasController = {
    motivos,
    nuevaDenuncia,
};
export default DenunciasController;
