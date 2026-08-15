import Router from "express";
import Usuarios_AptitudesController from "../controllers/usuarios_aptitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/nuevaAptitud", verifyToken, Usuarios_AptitudesController.nuevaAptitud);

export default router;