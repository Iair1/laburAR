// notificaciones.js
// Una sola forma de avisarle algo a alguien (la campanita del sitio).
import { asegurarNotificaciones, asegurarCuentas } from "./esquema.js";
import { enviarEmail, emailConfigurado } from "./email.js";
import { armarEmail } from "./avisosEmail.js";

// Las notificaciones que además llegan por email (las demás solo se ven en la campanita)
const TIPOS_CON_EMAIL = new Set([
    "oferta-nueva", "contraoferta", "oferta-aceptada", "oferta-rechazada",
    "solicitud-nueva", "solicitud-aceptada", "solicitud-rechazada",
    "trabajo-cancelado", "trabajo-terminado", "reseña", "verificacion",
]);
const BOTONES = {
    "oferta-nueva": "Ver la propuesta",
    contraoferta: "Ver la propuesta",
    "oferta-aceptada": "Ver la cita",
    "oferta-rechazada": "Ver mis propuestas",
    "solicitud-nueva": "Ver la solicitud",
    "solicitud-aceptada": "Ver la cita",
    "solicitud-rechazada": "Buscar otro trabajador",
    "trabajo-cancelado": "Ver detalles",
    "trabajo-terminado": "Dejar una reseña",
    reseña: "Ver mis reseñas",
    verificacion: "Ir a Mi cuenta",
};

/**
 * Le manda un email de aviso a `userid` si tiene email confirmado (o de antes de que se pidiera
 * confirmarlo) y no desactivó los avisos. Se manda recién cuando lo guardado queda firme (después
 * del COMMIT, ver db.js). Nunca hace fallar lo que se estaba haciendo.
 */
export async function avisarPorEmail(client, userid, { asunto, titulo, detalle = "", enlace = "/", boton = "Abrir LaburAR" }, { transaccion = false } = {}) {
    if (!userid || !emailConfigurado() || !(await asegurarCuentas())) return;
    let usuario = null;
    if (transaccion) await client.query("SAVEPOINT aviso_email");
    try {
        const result = await client.query(
            "SELECT email, email_verificado, avisos_email, eliminado, nombre_completo FROM usuarios WHERE id = $1", [userid]);
        usuario = result.rows[0];
        if (transaccion) await client.query("RELEASE SAVEPOINT aviso_email");
    } catch (error) {
        if (transaccion) await client.query("ROLLBACK TO SAVEPOINT aviso_email").catch(() => {});
        console.error("Aviso (no grave): no se pudo preparar el email de aviso:", error.message);
        return;
    }
    if (!usuario?.email || usuario.email_verificado === false || usuario.avisos_email === false || usuario.eliminado) return;
    const { texto, html } = armarEmail({ saludo: `Hola, ${primerNombre(usuario.nombre_completo)}`, titulo, detalle, boton, enlace });
    const mandar = () => enviarEmail({ para: usuario.email, asunto: asunto || titulo, texto, html });
    if (typeof client.despuesDeGuardar === "function") {
        await client.despuesDeGuardar(mandar);
    } else {
        await mandar().catch((error) => console.error("Aviso (no grave): no se pudo mandar el email de aviso:", error.message));
    }
}

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
        if (TIPOS_CON_EMAIL.has(tipo)) {
            await avisarPorEmail(client, userid, {
                asunto: titulo, titulo, detalle: contenido, enlace: enlace || "/", boton: BOTONES[tipo] || "Abrir LaburAR",
            }, { transaccion });
        }
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
