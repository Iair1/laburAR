import Router from "express";
import BloqueosController from "../controllers/bloqueos.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/bloquear", verifyToken, BloqueosController.bloquear);
router.delete("/desbloquear", verifyToken, BloqueosController.desbloquear);
router.get("/misBloqueados", verifyToken, BloqueosController.misBloqueados);

export default router;
