import Router from "express";
import SolicitudesController from "../controllers/solicitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/busqueda", verifyToken, SolicitudesController.busqueda);
router.get("/trabajosPendientes", verifyToken, SolicitudesController.trabajosPendientes);
router.get("/serviciosPendientes", verifyToken, SolicitudesController.serviciosPendientes);
router.post("/subirSolicitud", verifyToken, SolicitudesController.subirSolicitud);
router.delete("/borrarSolicitud", verifyToken, SolicitudesController.borrarSolicitud);
router.post("/aceptarSolicitud", verifyToken, SolicitudesController.aceptarSolicitud);
router.post("/rechazarSolicitud", verifyToken, SolicitudesController.rechazarSolicitud);
router.put("/cancelarTrabajo", verifyToken, SolicitudesController.cancelarTrabajo);
//router.put("/terminarTrabajo", verifyToken, SolicitudesController.terminarTrabajo);

export default router;