// notificaciones.js
// Una sola forma de avisarle algo a alguien (la campanita del sitio).
import { asegurarNotificaciones } from "./esquema.js";

/**
 * Guarda una notificación para `userid`.
 *  - titulo: frase corta que se ve en la campanita ("Juan aceptó tu solicitud")
 *  - contenido: una línea de detalle (el trabajo, el día, el precio...)
 *  - enlace: a dónde lleva al tocarla: una ruta del sitio ("/mis-problemas?problema=3")
 *    o "resena:ID" para abrir la ventana de reseña de ese trabajo
 *  - otroid: la otra persona (para mostrar su foto) · solicitudid: el trabajo
 * Nunca hace fallar lo que se estaba haciendo: si no se puede guardar, queda en el log.
 * Dentro de una transacción, pasar { transaccion: true } (usa un SAVEPOINT para no arruinarla).
 */
export async function notificar(client, datos, { transaccion = false } = {}) {
    const { userid, tipo, titulo, contenido = "", enlace = null, otroid = null, solicitudid = null } = datos;
    if (!userid || !titulo) return null;
    const completas = await asegurarNotificaciones();
    // Si la base todavía no tiene las columnas nuevas, el título va en la primera línea del texto
    const [sql, valores] = completas
        ? [`INSERT INTO notificaciones (tipo, userid, contenido, otroid, titulo, enlace, solicitudid)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
           [tipo, userid, contenido, otroid, titulo, enlace, solicitudid]]
        : ["INSERT INTO notificaciones (tipo, userid, contenido, otroid) VALUES ($1, $2, $3, $4) RETURNING *",
           [tipo, userid, contenido ? `${titulo}\n${contenido}` : titulo, otroid]];
    if (transaccion) await client.query("SAVEPOINT notificar");
    try {
        const result = await client.query(sql, valores);
        if (transaccion) await client.query("RELEASE SAVEPOINT notificar");
        return result.rows[0];
    } catch (error) {
        if (transaccion) await client.query("ROLLBACK TO SAVEPOINT notificar").catch(() => {});
        console.error(`Aviso (no grave): no se pudo guardar la notificación "${tipo}":`, error.message);
        return null;
    }
}

/** Nombre de un usuario (o el texto de reemplazo si no se encuentra). */
export async function nombreDe(client, id, reemplazo = "Alguien") {
    if (!id) return reemplazo;
    const result = await client.query("SELECT nombre_completo FROM usuarios WHERE id = $1", [id]).catch(() => null);
    return result?.rows[0]?.nombre_completo || reemplazo;
}

/** Solo el nombre de pila ("Juan Pérez" → "Juan"), para títulos cortos. */
export const primerNombre = (nombre) => String(nombre || "").trim().split(/\s+/)[0] || "Alguien";

/**
 * Título corto de una solicitud o problema, sacado de su texto:
 *  - problemas: la primera línea es el título
 *  - pedidos desde "Agendar": "Horario preferido: 17:00 hrs. Barrio: Palermo. Descripción..."
 */
export function tituloDeSolicitud(texto) {
    const limpio = String(texto || "")
        .replace(/^\s*Horario preferido:[^.\n]*\.\s*/i, "")
        .replace(/^\s*Barrio:[^.\n]*\.\s*/i, "");
    const primera = limpio.split("\n")[0].trim();
    if (!primera) return "tu pedido";
    return primera.length > 60 ? `${primera.slice(0, 57).trim()}…` : primera;
}

/** "sáb 22 nov · 17:00 hs" a partir de una fecha (Date o "YYYY-MM-DD") y una hora opcional. */
export function textoDia(dia, hora = null) {
    if (!dia) return "";
    let y, m, d;
    if (dia instanceof Date) {
        [y, m, d] = [dia.getFullYear(), dia.getMonth() + 1, dia.getDate()];
    } else {
        [y, m, d] = String(dia).slice(0, 10).split("-").map(Number);
    }
    if (!y || !m || !d) return "";
    const fecha = new Date(y, m - 1, d, 12).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    return hora ? `${fecha} · ${hora} hs` : fecha;
}

const formatoPesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
/** 15000 → "$ 15.000" */
export const pesos = (monto) => formatoPesos.format(Number(monto) || 0).replace(/\u00a0/g, " ");
