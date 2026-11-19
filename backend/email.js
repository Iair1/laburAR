// email.js
// Manda emails (por ahora: el código para recuperar la contraseña) sin librerías extra,
// con la API HTTP de Brevo o de Resend. Se configura con variables de entorno en Vercel:
//
//   EMAIL_REMITENTE   el email que aparece como remitente (ej: laburar.ayuda@gmail.com)
//   EMAIL_NOMBRE      opcional, el nombre del remitente (por defecto "LaburAR")
//   y UNA de estas dos:
//   BREVO_API_KEY     Brevo (brevo.com): gratis hasta 300 emails por día. El remitente se
//                     verifica en Brevo → Senders (alcanza con un Gmail, no hace falta dominio).
//   RESEND_API_KEY    Resend (resend.com): el dominio del remitente tiene que estar verificado.
//
// Si no está configurado, enviarEmail tira un error 503 y el front avisa que la
// recuperación por email todavía no está disponible.

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

export function emailConfigurado() {
    return Boolean((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && process.env.EMAIL_REMITENTE);
}

export function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/**
 * @param {{ para: string, asunto: string, texto: string, html?: string }} email
 */
export async function enviarEmail({ para, asunto, texto, html }) {
    if (!emailConfigurado()) {
        throw errorConEstado("El envío de emails todavía no está configurado en el servidor.", 503);
    }
    const remitente = process.env.EMAIL_REMITENTE;
    const nombre = process.env.EMAIL_NOMBRE || "LaburAR";
    const cuerpoHTML = html || `<p>${escaparHTML(texto).replace(/\n/g, "<br>")}</p>`;
    let respuesta;
    try {
        if (process.env.BREVO_API_KEY) {
            respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    sender: { name: nombre, email: remitente },
                    to: [{ email: para }],
                    subject: asunto,
                    textContent: texto,
                    htmlContent: cuerpoHTML,
                }),
            });
        } else {
            respuesta = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: `${nombre} <${remitente}>`, to: [para], subject: asunto, text: texto, html: cuerpoHTML }),
            });
        }
    } catch (error) {
        console.error("No se pudo conectar con el servicio de email:", error.message);
        throw errorConEstado("No se pudo mandar el email. Probá de nuevo en un rato.", 502);
    }
    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => "");
        console.error(`El servicio de email respondió ${respuesta.status}:`, detalle.slice(0, 300));
        throw errorConEstado("No se pudo mandar el email. Probá de nuevo en un rato.", 502);
    }
}
