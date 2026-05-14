import Router from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
//import {verifyToken, verifyAdmin} from "../middlewares/auth.js";

const router = Router();

router.get("/prueba", UsuariosController.prueba);

export default router;