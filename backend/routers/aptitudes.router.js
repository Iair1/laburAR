import Router from "express";
import AptitudesController from "../controllers/aptitudes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.get("/buscarAptitudes", AptitudesController.buscarAptitudes);

export default router