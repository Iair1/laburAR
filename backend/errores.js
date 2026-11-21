// errores.js
// Guarda los errores del servidor (y los que reporta el navegador) para que el administrador
// los vea en el panel, y le manda un email avisando (como mucho uno por hora).
import { Client } from "./db.js";
import { asegurarCuentas } from "./esquema.js";
import { enviarEmail, emailConfigurado } from "./email.js";
import { armarEmail } from "./avisosEmail.js";

const recortar = (texto, largo) => (texto === null || texto === undefined ? null : String(texto).slice(0, largo));

/**
 * Anota un error. Nunca tira error. { origen: "servidor" | "navegador", ruta, metodo, mensaje, detalle, userid }
 */
export async function registrarError({ origen = "servidor", ruta = null, metodo = null, mensaje = "", detalle = null, userid = null }) {
    try {
        if (!(await asegurarCuentas())) return;
        const client = new Client();
        await client.connect();
        try {
            const result = await client.query(`
                INSERT INTO errores_servidor (origen, ruta, metodo, mensaje, detalle, userid)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [origen, recortar(ruta, 300), recortar(metodo, 10), recortar(mensaje, 1000), recortar(detalle, 4000),
                 Number.isInteger(Number(userid)) ? Number(userid) : null]);
            if (!emailConfigurado()) return;
            // Aviso a los administradores: como mucho uno por hora
            const reciente = await client.query(
                "SELECT 1 FROM errores_servidor WHERE avisado = true AND fecha > now() - interval '1 hour' LIMIT 1");
            if (reciente.rowCount > 0) return;
            await client.query("UPDATE errores_servidor SET avisado = true WHERE id = $1", [result.rows[0].id]);
            const admins = await client.query(
                "SELECT email, nombre_completo FROM usuarios WHERE es_admin = true AND email IS NOT NULL AND eliminado IS NOT TRUE");
            const lugar = origen === "navegador" ? "En el navegador de alguien" : "En el servidor";
            const { texto, html } = armarEmail({
                titulo: "Hubo un error en LaburAR",
                detalle: `${lugar}${ruta ? ` (${metodo ? `${metodo} ` : ""}${ruta})` : ""}:\n${recortar(mensaje, 300)}\nEn el panel de administración ves todos los errores.`,
                boton: "Ver los errores",
                enlace: "/admin?pestana=errores",
                pie: "Te llega porque sos administrador de LaburAR. Como mucho, un aviso por hora.",
            });
            for (const admin of admins.rows) {
                await enviarEmail({ para: admin.email, asunto: "Hubo un error en LaburAR", texto, html })
                    .catch((error) => console.error("No se pudo avisar del error por email:", error.message));
            }
        } finally {
            await client.end();
        }
    } catch (error) {
        console.error("No se pudo guardar el error:", error.message);
    }
}

/** Como registrarError, pero sin esperar más de `ms` (para no demorar la respuesta). */
export function registrarErrorRapido(datos, ms = 1500) {
    return Promise.race([registrarError(datos), new Promise((listo) => setTimeout(listo, ms))]);
}
