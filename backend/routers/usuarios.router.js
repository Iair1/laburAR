import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/prueba", UsuariosController.prueba);
router.get("/sip", UsuariosController.sip);
router.post("/crearCuenta", UsuariosController.crearCuenta);
router.post("/iniciarSesion", UsuariosController.iniciarSesion);
router.put("/cambiarDato", verifyToken, UsuariosController.cambiarDato);
router.put("/cambiarContrasena", verifyToken, UsuariosController.cambiarContraseña);
router.get("/buscarUsuarios", verifyToken, UsuariosController.buscarUsuarios)

export default router;