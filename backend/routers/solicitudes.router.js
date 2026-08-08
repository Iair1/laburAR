import Router from "express";
import SolicitudesController from "../controllers/solicitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/busqueda", verifyToken, SolicitudesController.busqueda);
router.post("/subirSolicitud", verifyToken, SolicitudesController.subirSolicitud);
router.delete("/borrarSolicitud", verifyToken, SolicitudesController.borrarSolicitud);

export default router;