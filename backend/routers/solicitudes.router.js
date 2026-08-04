import Router from "express";
import SolicitudesController from "../controllers/solicitudes.controller.js";
import {verifyToken, verifyAdmin} from "../auth.middleware.js";

const router = Router();

//router.get("/busqueda", verifyToken, UsuariosController.busqueda);

export default router;