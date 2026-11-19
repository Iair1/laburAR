import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/crearCuenta", UsuariosController.crearCuenta);
router.post("/iniciarSesion", UsuariosController.iniciarSesion);
router.post("/iniciarSesionGoogle", UsuariosController.iniciarSesionGoogle);
router.post("/recuperarContrasena", UsuariosController.recuperarContraseña);
router.post("/restablecerContrasena", UsuariosController.restablecerContraseña);
router.delete("/eliminarCuenta", verifyToken, UsuariosController.eliminarCuenta);
router.post("/subirDni", verifyToken, UsuariosController.subirDni);
router.put("/cambiarDato", verifyToken, UsuariosController.cambiarDato);
router.put("/cambiarContrasena", verifyToken, UsuariosController.cambiarContraseña);
router.post("/buscarTrabajadores", verifyToken, UsuariosController.buscarTrabajadores)
router.get("/miPerfil", verifyToken, UsuariosController.miPerfil)
router.get("/misNotificaciones", verifyToken, UsuariosController.misNotificaciones)

export default router;