// servidor.js
// Pedidos autenticados al backend (con el token de la sesión).
// En desarrollo se usa el backend publicado; en el sitio, el mismo dominio (/api).

export const API_BASE = import.meta.env.DEV ? "https://laburar-three.vercel.app/api" : "/api";

/**
 * Si el backend avisa que la cuenta está suspendida, se cierra la sesión y se manda al login
 * con el aviso. (Se borra todo lo de la sesión guardado en el navegador.)
 */
export function revisarCuentaSuspendida(status, resultado) {
  if (status !== 403 || !resultado?.suspendida) return;
  ["laburar_sesion", "token", "laburar_notificaciones", "laburar_notificaciones_leidas"].forEach((clave) => {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* sin acceso al almacenamiento */
    }
  });
  window.dispatchEvent(new Event("laburar-sesion-cambio"));
  if (!window.location.pathname.startsWith("/login")) window.location.assign("/login?suspendida=1");
}

/**
 * Hace un pedido al backend y devuelve el JSON.
 * Si falla, tira un Error con el mensaje del servidor y `status` (401 = sesión vencida).
 */
export async function pedirAlServidor(ruta, method = "GET", body) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.");
  }
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    revisarCuentaSuspendida(respuesta.status, resultado);
    const error = new Error(resultado.message || "Error en el servidor");
    error.status = respuesta.status;
    throw error;
  }
  return resultado;
}

/** Avisa a toda la app que algo cambió (ej: "laburar-resenas-cambio", "laburar-mensajes-cambio"). */
export function avisarCambio(nombre) {
  window.dispatchEvent(new Event(nombre));
}
