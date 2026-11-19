import BloqueosService from "../services/bloqueos.service.js";

const responderError = (res, error, accion) => {
    if (!error.status) console.error(`Error al ${accion}:`, error);
    res.status(error.status || 500).json({ message: error.message });
};

const bloquear = async (req, res) => {
    try {
        const result = await BloqueosService.bloquear(req.id, req.body?.userid);
        res.status(201).json({ message: "Usuario bloqueado", result });
    } catch (error) {
        responderError(res, error, "bloquear");
    }
};

const desbloquear = async (req, res) => {
    try {
        const result = await BloqueosService.desbloquear(req.id, req.body?.userid);
        res.status(200).json({ message: "Usuario desbloqueado", result });
    } catch (error) {
        responderError(res, error, "desbloquear");
    }
};

const misBloqueados = async (req, res) => {
    try {
        const result = await BloqueosService.misBloqueados(req.id);
        res.status(200).json({ message: "Usuarios bloqueados", result });
    } catch (error) {
        responderError(res, error, "listar bloqueados");
    }
};

const BloqueosController = {
    bloquear,
    desbloquear,
    misBloqueados,
};
export default BloqueosController;
