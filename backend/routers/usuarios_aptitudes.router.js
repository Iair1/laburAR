import Router from "express";
import Usuarios_AptitudesController from "../controllers/usuarios_aptitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/nuevaAptitud", verifyToken, Usuarios_AptitudesController.nuevaAptitud);
router.delete("/eliminarAptitud", verifyToken, Usuarios_AptitudesController.eliminarAptitud);
router.get("/misAptitudes", verifyToken, Usuarios_AptitudesController.misAptitudes);

export default router;