// avisosEmail.js
// Los emails que manda el sitio (avisos, confirmar el email) con un mismo diseño.
import { escaparHTML } from "./email.js";

/** Dirección del sitio para los links de los emails (variable SITIO_URL en Vercel). */
export const SITIO_URL = (process.env.SITIO_URL || "https://laburar-three.vercel.app").replace(/\/+$/, "");

/** Convierte un enlace interno ("/mis-problemas?problema=3" o "resena:12") en un link completo. */
export function urlDelSitio(enlace) {
    if (!enlace) return SITIO_URL;
    if (enlace.startsWith("resena:")) return `${SITIO_URL}/?resena=${encodeURIComponent(enlace.slice(7))}`;
    if (/^https?:\/\//.test(enlace)) return enlace;
    return `${SITIO_URL}${enlace.startsWith("/") ? "" : "/"}${enlace}`;
}

/**
 * Arma un email: { texto, html }.
 *  - saludo: "Hola, Clara" (opcional) · titulo · detalle (una o varias líneas)
 *  - boton + enlace: el botón principal · pie: texto chico al final
 */
export function armarEmail({ saludo = "", titulo, detalle = "", boton = "Abrir LaburAR", enlace = "/", pie = "" }) {
    const url = urlDelSitio(enlace);
    const pieFinal = pie || `Recibís este email porque tenés una cuenta en LaburAR. Podés desactivar los avisos por email en Mi cuenta: ${SITIO_URL}/mi-cuenta`;
    const texto = [saludo, titulo, detalle, `${boton}: ${url}`, "", pieFinal].filter((l) => l !== null && l !== undefined).join("\n\n").replace(/\n{3,}/g, "\n\n");
    const parrafos = String(detalle || "").split("\n").filter(Boolean)
        .map((l) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#333">${escaparHTML(l)}</p>`).join("");
    const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f4efef;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efef;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6dada">
<tr><td style="background:#570101;padding:16px 24px;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px">LABURAR</td></tr>
<tr><td style="padding:24px">
${saludo ? `<p style="margin:0 0 6px;font-size:14px;color:#666">${escaparHTML(saludo)}</p>` : ""}
<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1a1a1a">${escaparHTML(titulo)}</h1>
${parrafos}
<p style="margin:22px 0 4px"><a href="${escaparHTML(url)}" style="display:inline-block;background:#570101;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:999px">${escaparHTML(boton)}</a></p>
</td></tr>
<tr><td style="padding:14px 24px 20px;border-top:1px solid #f0e6e6;font-size:12px;line-height:1.5;color:#888">${escaparHTML(pieFinal)}</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
    return { texto, html };
}
