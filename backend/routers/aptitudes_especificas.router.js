import Router from "express";
import AptitudesEspecificasController from "../controllers/aptitudes_especificas.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/buscarAptitudesEspecificas", AptitudesEspecificasController.buscarAptitudesEspecificas);

export default router