import Router from "express";
import  ImagenesTrabajosController from "../controllers/imagenes_trabajos.controller.js";
import {verifyToken} from "../auth.middleware.js";

const router = Router()

router.post("/subirImagen", verifyToken,  ImagenesTrabajosController.subirImagenTrabajo)
router.delete("/eliminarImagen", verifyToken, ImagenesTrabajosController.eliminarImagen)
router.get("/misImagenes", verifyToken, ImagenesTrabajosController.misImagenes)
router.put("/cambiarDescripcion", verifyToken, ImagenesTrabajosController.cambiarDescripcion)

export default router;