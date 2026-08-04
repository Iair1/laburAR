import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import {verifyToken, verifyAdmin} from "../auth.middleware.js";

const router = Router();

router.get("/prueba", UsuariosController.prueba);
router.get("/sip", UsuariosController.sip);
router.post("/crearCuenta", UsuariosController.crearCuenta);
router.post("/iniciarSesion", UsuariosController.iniciarSesion);

export default router;