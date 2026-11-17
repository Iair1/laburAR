import Router from "express";
import MensajesController from "../controllers/mensajes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/mandarMensaje", verifyToken, MensajesController.mandarMensaje)
router.delete("/borrarMensaje", verifyToken, MensajesController.borrarMensaje)
router.post("/conseguirChat", verifyToken, MensajesController.conseguirChat)
router.get("/misChats", verifyToken, MensajesController.misChats)
router.get("/contactos", verifyToken, MensajesController.contactos)
router.get("/noLeidos", verifyToken, MensajesController.noLeidos)

export default router