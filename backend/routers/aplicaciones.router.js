import Router from "express";
import AplicacionesController from "../controllers/aplicaciones.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/subirAplicacion", verifyToken, AplicacionesController.subirAplicacion);
router.delete("/borrarAplicacion", verifyToken, AplicacionesController.borrarAplicacion);

export default router;