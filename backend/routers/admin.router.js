import Router from "express";
import AdminController from "../controllers/admin.controller.js";
import {verifyToken} from "../auth.middleware.js";

// Panel de administración: todo pide sesión y que el usuario sea administrador
const router = Router();
router.use(verifyToken, AdminController.soloAdmin);

router.get("/resumen", AdminController.resumen);
router.get("/denuncias", AdminController.denuncias);
router.put("/resolverDenuncia", AdminController.resolverDenuncia);
router.get("/usuarios", AdminController.usuarios);
router.get("/usuario/:userid", AdminController.usuario);
router.put("/suspender", AdminController.suspender);
router.put("/verificarDni", AdminController.verificarDni);

export default router;
