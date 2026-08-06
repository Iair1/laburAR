import Router from "express";
import SolicitudesController from "../controllers/solicitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/busqueda", verifyToken, SolicitudesController.busqueda);

export default router;