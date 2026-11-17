import Router from "express";
import ReseñaController from "../controllers/reseña.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

// El router se monta en /api/reseñas y también en /api/resenas (sin ñ): el navegador
// manda la ñ codificada (%C3%B1) y Express no la reconoce, así que el front usa /api/resenas.
router.post("/api/nuevaReseña", verifyToken, ReseñaController.nuevaReseña); // ruta original
router.post("/nuevaResena", verifyToken, ReseñaController.nuevaReseña);
router.get("/pendientes", verifyToken, ReseñaController.pendientes);
router.get("/de/:userid", verifyToken, ReseñaController.reseñasDe);

export default router;
