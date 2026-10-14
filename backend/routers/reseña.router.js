import Router from "express";
import ReseñaController from "../controllers/reseña.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/api/nuevaReseña", verifyToken, ReseñaController.nuevaReseña);

export default router;