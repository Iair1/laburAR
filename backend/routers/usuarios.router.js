import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/crearCuenta", UsuariosController.crearCuenta);
router.post("/iniciarSesion", UsuariosController.iniciarSesion);
router.post("/iniciarSesionGoogle", UsuariosController.iniciarSesionGoogle);
router.post("/recuperarContrasena", UsuariosController.recuperarContraseña);
router.post("/restablecerContrasena", UsuariosController.restablecerContraseña);
router.post("/verificarEmail", UsuariosController.verificarEmail);
router.post("/reenviarVerificacion", verifyToken, UsuariosController.reenviarVerificacion);
router.post("/enviarCodigoTelefono", verifyToken, UsuariosController.enviarCodigoTelefono);
router.post("/verificarTelefono", verifyToken, UsuariosController.verificarTelefono);
router.get("/estadisticas/:userid", verifyToken, UsuariosController.estadisticas);
router.delete("/eliminarCuenta", verifyToken, UsuariosController.eliminarCuenta);
router.post("/subirDni", verifyToken, UsuariosController.subirDni);
router.put("/cambiarDato", verifyToken, UsuariosController.cambiarDato);
router.put("/cambiarContrasena", verifyToken, UsuariosController.cambiarContraseña);
router.post("/buscarTrabajadores", verifyToken, UsuariosController.buscarTrabajadores)
router.get("/miPerfil", verifyToken, UsuariosController.miPerfil)
router.get("/misNotificaciones", verifyToken, UsuariosController.misNotificaciones)
router.put("/leerNotificaciones", verifyToken, UsuariosController.leerNotificaciones)

export default router;