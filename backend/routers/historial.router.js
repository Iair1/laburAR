import Router from "express";
import HistorialController from "../controllers/historial.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/miHistorial", verifyToken, HistorialController.miHistorial);

export default router;