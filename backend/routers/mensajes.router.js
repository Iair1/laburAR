import Router from "express";
import MensajesController from "../controllers/mensajes.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router();

router.post("/mandarMensaje", verifyToken, MensajesController.mandarMensaje)
router.post("conseguirChat", verifyToken, MensajesController.conseguirChat)
router.delete("borrarMensaje", verifyToken, MensajesController.borrarMensaje)
router.get("conseguirChats", verifyToken, MensajesController.conseguirChats)