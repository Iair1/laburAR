import Router from "express";
import HistorialBusquedaController from "../controllers/historial_busqueda.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/miHistorial", verifyToken, HistorialBusquedaController.miHistorial);
router.post("/agregarBusqueda", verifyToken, HistorialBusquedaController.agregarBusqueda);

export default router;