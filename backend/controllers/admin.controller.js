import AdminService from "../services/admin.service.js";

const responder = (accion, funcion, status = 200) => async (req, res) => {
    try {
        const result = await funcion(req);
        res.status(status).json({ message: accion, result });
    } catch (error) {
        if (!error.status) console.error(`Error en admin (${accion}):`, error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

// Solo deja pasar a los administradores (va después de verifyToken)
const soloAdmin = async (req, res, next) => {
    try {
        if (await AdminService.esAdmin(req.id)) return next();
        res.status(403).json({ message: "Solo para administradores" });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const idValido = (valor) => {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error("Id inválido");
        error.status = 400;
        throw error;
    }
    return id;
};

const AdminController = {
    soloAdmin,
    resumen: responder("Resumen", () => AdminService.resumen()),
    errores: responder("Errores", (req) => AdminService.errores(String(req.query.origen || ""))),
    denuncias: responder("Denuncias", (req) => AdminService.denuncias(req.query.estado)),
    resolverDenuncia: responder("Denuncia actualizada", (req) =>
        AdminService.resolverDenuncia(idValido(req.body?.id), req.body?.estado, req.body?.nota)),
    usuarios: responder("Usuarios", (req) => AdminService.usuarios(req.query.busqueda || "", req.query.filtro || "")),
    usuario: responder("Usuario", (req) => AdminService.usuario(idValido(req.params.userid))),
    suspender: responder("Usuario actualizado", (req) =>
        AdminService.suspender(req.id, idValido(req.body?.userid), req.body?.suspendido === true, req.body?.motivo)),
    verificarDni: responder("Verificación actualizada", (req) =>
        AdminService.verificarDni(idValido(req.body?.userid), req.body?.aprobado === true, req.body?.nota)),
};
export default AdminController;
