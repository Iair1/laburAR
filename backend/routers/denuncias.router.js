import Router from "express";
import DenunciasController from "../controllers/denuncias.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/motivos", DenunciasController.motivos);
router.post("/nueva", verifyToken, DenunciasController.nuevaDenuncia);

export default router;
