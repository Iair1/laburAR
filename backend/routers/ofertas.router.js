import Router from "express";
import OfertasController from "../controllers/ofertas.controller.js";
import { verifyToken } from "../auth.middleware.js";

// Propuestas de precio para los problemas publicados (montado en /api/ofertas)
const router = Router();

router.post("/nueva", verifyToken, OfertasController.nueva);                 // el trabajador propone día, hora y precio
router.get("/mias", verifyToken, OfertasController.mias);                    // las que mandó el trabajador
router.get("/recibidas", verifyToken, OfertasController.recibidas);          // las que recibió el cliente en sus problemas
router.post("/aceptar", verifyToken, OfertasController.aceptar);             // acepta el precio vigente → cita agendada
router.post("/contraofertar", verifyToken, OfertasController.contraofertar); // otro precio: le toca responder al otro
router.post("/rechazar", verifyToken, OfertasController.rechazar);           // { eliminarPublicacion } solo para el cliente

export default router;
