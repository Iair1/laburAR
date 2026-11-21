// limites.js
// Límites para frenar el spam: cuántas veces se puede hacer algo en un rato
// (mandar mensajes, solicitudes, publicar problemas, crear cuentas...).
import { errorConEstado } from "./moderacion.js";
import { asegurarCuentas } from "./esquema.js";

/**
 * Revisa que `clave` (ej: "mensajes:12") no haya superado ninguna de las reglas y anota esta vez.
 * reglas: [{ maximo: 30, intervalo: "10 minutes" }, { maximo: 300, intervalo: "1 day" }]
 * Tira un error 429 con `mensaje` si se pasó. Si la tabla todavía no existe, no frena nada.
 */
export async function controlarLimite(client, clave, reglas, mensaje = "Hiciste esto demasiadas veces seguidas. Probá de nuevo en un rato.") {
    if (!(await asegurarCuentas())) return;
    let cantidades;
    try {
        const consultas = reglas.map((r) => client.query(
            "SELECT count(*)::int AS n FROM acciones_limitadas WHERE clave = $1 AND fecha > now() - $2::interval",
            [clave, r.intervalo]));
        cantidades = (await Promise.all(consultas)).map((r) => r.rows[0].n);
    } catch (error) {
        if (error.code === "42P01") return; // la tabla no existe: no se limita
        throw error;
    }
    if (reglas.some((r, i) => cantidades[i] >= r.maximo)) {
        throw errorConEstado(mensaje, 429);
    }
    await client.query("INSERT INTO acciones_limitadas (clave) VALUES ($1)", [clave]);
    // De vez en cuando se borra lo viejo para que la tabla no crezca
    if (Math.random() < 0.02) {
        await client.query("DELETE FROM acciones_limitadas WHERE fecha < now() - interval '2 days'").catch(() => {});
    }
}

/** IP de quien hace el pedido (detrás de Vercel viene en x-forwarded-for). null si es local. */
export function ipDe(req) {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") return null;
    return ip;
}
