// google.js
// Verifica el "credential" (id_token) que devuelve el botón "Continuar con Google".
// Sin librerías extra: se lo pregunta a Google (tokeninfo) y se controla que sea para
// esta app (GOOGLE_CLIENT_ID, el mismo valor que VITE_GOOGLE_CLIENT_ID del front).

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

export function googleConfigurado() {
    return Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID);
}

/**
 * @param {string} credential - el id_token de Google
 * @returns {Promise<{ email: string, nombre: string, foto: string|null }>}
 */
export async function verificarCredencialGoogle(credential) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw errorConEstado("El inicio de sesión con Google no está configurado en el servidor.", 503);
    }
    if (typeof credential !== "string" || credential.length < 20 || credential.length > 5000) {
        throw errorConEstado("No se pudo verificar la cuenta de Google.", 400);
    }
    let datos;
    try {
        const respuesta = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!respuesta.ok) {
            throw errorConEstado("No se pudo verificar la cuenta de Google. Probá de nuevo.", 401);
        }
        datos = await respuesta.json();
    } catch (error) {
        if (error.status) throw error;
        throw errorConEstado("No se pudo conectar con Google. Probá de nuevo en un rato.", 502);
    }
    const emisorValido = ["accounts.google.com", "https://accounts.google.com"].includes(datos.iss);
    const emailVerificado = datos.email_verified === true || datos.email_verified === "true";
    const vigente = Number(datos.exp) * 1000 > Date.now();
    if (datos.aud !== clientId || !emisorValido || !emailVerificado || !vigente || !datos.email) {
        throw errorConEstado("No se pudo verificar la cuenta de Google. Probá de nuevo.", 401);
    }
    return { email: String(datos.email).toLowerCase(), nombre: datos.name || "", foto: datos.picture || null };
}
