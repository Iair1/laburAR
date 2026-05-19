import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
//import {verifyToken, verifyAdmin} from "../middlewares/auth.js";

const router = Router();

router.get("/prueba", UsuariosController.prueba);
router.post("/crearCuenta", UsuariosController.crearCuenta);
router.post("/iniciarSesion", UsuariosController.iniciarSesion);

export default router;