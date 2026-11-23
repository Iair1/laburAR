import Router from "express";
import jwt from "jsonwebtoken";
import { Client } from "../db.js";
import { registrarError } from "../errores.js";
import { controlarLimite, ipDe } from "../limites.js";
import { JWT_SECRET } from "../auth.middleware.js";

// Errores que reporta el navegador (montado en /api/errores). No hace falta estar logueado.
const router = Router();

router.post("/navegador", async (req, res) => {
    const { mensaje, ruta, detalle } = req.body || {};
    if (!mensaje || typeof mensaje !== "string") return res.status(400).json({ message: "Falta el mensaje" });
    let userid = null;
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) userid = jwt.verify(token, JWT_SECRET).userid ?? null;
    } catch {
        userid = null;
    }
    const client = new Client();
    try {
        await client.connect();
        await controlarLimite(client, `errores:${ipDe(req) || userid || "local"}`, [{ maximo: 20, intervalo: "1 hour" }]);
    } catch (error) {
        if (error.status === 429) return res.status(429).json({ message: "Demasiados reportes" });
    } finally {
        await client.end();
    }
    await registrarError({
        origen: "navegador",
        ruta: typeof ruta === "string" ? ruta : null,
        mensaje,
        detalle: typeof detalle === "string" ? detalle : null,
        userid,
    });
    res.status(201).json({ message: "Gracias" });
});

export default router;
