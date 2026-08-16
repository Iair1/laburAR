import Router from "express";
import Usuarios_Aptitudes_EspecificasController from "../controllers/usuarios_aptitudes_especificas.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/nuevaAptitudEspecifica", verifyToken, Usuarios_Aptitudes_EspecificasController.nuevaAptitudEspecifica);

export default router;