// cuentaApi.js
// Cuenta y seguridad: recuperar contraseña, eliminar cuenta, DNI, bloqueos, denuncias,
// historial de búsquedas y panel de administración.
import { pedirAlServidor, API_BASE } from "./servidor";

/* ---------- Contraseña ---------- */

// POST /usuarios/recuperarContrasena → manda un código de 6 números al email
export const pedirCodigoRecuperacion = (email) =>
  pedirAlServidor("/usuarios/recuperarContrasena", "POST", { email: email.trim() });

// POST /usuarios/restablecerContrasena → { email, codigo, contraseña }
export const restablecerContrasena = (email, codigo, contrasena) =>
  pedirAlServidor("/usuarios/restablecerContrasena", "POST", { email: email.trim(), codigo: codigo.trim(), contraseña: contrasena });

/* ---------- Confirmar el email y el teléfono ---------- */

// POST /usuarios/verificarEmail → { token } (el del link que llega por email; no hace falta sesión)
export const confirmarEmail = (token) => pedirAlServidor("/usuarios/verificarEmail", "POST", { token });

// POST /usuarios/reenviarVerificacion → manda otro link (hasta 3 por hora)
export const reenviarLinkEmail = () => pedirAlServidor("/usuarios/reenviarVerificacion", "POST", {});

// POST /usuarios/enviarCodigoTelefono → manda un código por SMS al teléfono de la cuenta
export const enviarCodigoTelefono = () => pedirAlServidor("/usuarios/enviarCodigoTelefono", "POST", {});

// POST /usuarios/verificarTelefono → { codigo }
export const verificarTelefono = (codigo) => pedirAlServidor("/usuarios/verificarTelefono", "POST", { codigo: String(codigo).trim() });

/** El mensaje del backend cuando falta confirmar el email (403). */
export const esFaltaConfirmarEmail = (error) => error?.status === 403 && /Confirmá tu email/.test(error?.message || "");

/* ---------- Datos para confiar en alguien ---------- */

const estadisticasGuardadas = new Map();
// GET /usuarios/estadisticas/:userid → trabajos hechos, cancelaciones, tiempo de respuesta, verificaciones
// (se guardan 2 minutos para no pedirlas de nuevo en cada tarjeta)
export async function obtenerEstadisticas(userid) {
  const guardada = estadisticasGuardadas.get(userid);
  if (guardada && guardada.hasta > Date.now()) return guardada.datos;
  const datos = (await pedirAlServidor(`/usuarios/estadisticas/${encodeURIComponent(userid)}`)).result;
  estadisticasGuardadas.set(userid, { datos, hasta: Date.now() + 2 * 60 * 1000 });
  return datos;
}

/* ---------- Errores del navegador (los ve el administrador) ---------- */

let reportados = 0;
export function reportarErrorDelNavegador({ mensaje, detalle }) {
  if (reportados >= 5 || !mensaje) return; // como mucho 5 por visita
  reportados++;
  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/errores/navegador`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ mensaje: String(mensaje).slice(0, 900), detalle: detalle ? String(detalle).slice(0, 3500) : undefined, ruta: window.location.pathname + window.location.search }),
    keepalive: true,
  }).catch(() => {});
}

/* ---------- Cuenta ---------- */

// DELETE /usuarios/eliminarCuenta → { confirmacion: "ELIMINAR" }
export const eliminarMiCuenta = (confirmacion) =>
  pedirAlServidor("/usuarios/eliminarCuenta", "DELETE", { confirmacion });

// POST /usuarios/subirDni → { imagen: base64 } (se guarda privado, lo revisa un administrador)
export const subirFotoDni = async (base64) => {
  const resultado = await pedirAlServidor("/usuarios/subirDni", "POST", { imagen: base64 });
  return resultado.result;
};

/* ---------- Bloqueos ---------- */

export const EVENTO_BLOQUEOS = "laburar-bloqueos-cambio";
const avisarBloqueos = () => window.dispatchEvent(new Event(EVENTO_BLOQUEOS));

export const bloquearUsuario = async (userid) => {
  await pedirAlServidor("/bloqueos/bloquear", "POST", { userid });
  avisarBloqueos();
};

export const desbloquearUsuario = async (userid) => {
  await pedirAlServidor("/bloqueos/desbloquear", "DELETE", { userid });
  avisarBloqueos();
};

export const obtenerMisBloqueados = async () => {
  const resultado = await pedirAlServidor("/bloqueos/misBloqueados");
  return (resultado.result || []).map((u) => ({ id: u.id, nombre: u.nombre_completo, foto: u.foto_perfil || null, fecha: u.fecha }));
};

/* ---------- Denuncias ---------- */

export const MOTIVOS_DENUNCIA = [
  "Estafa o fraude",
  "Acoso, amenazas o violencia",
  "Comportamiento inapropiado",
  "No se presentó o no cumplió",
  "Trabajo peligroso o mal hecho",
  "Perfil falso o se hace pasar por otra persona",
  "Contenido ofensivo",
  "Spam o publicidad",
  "Otro",
];

// Reclamos sobre un trabajo (después de la cita)
export const MOTIVOS_TRABAJO = [
  "No se presentó o no cumplió",
  "Trabajo peligroso o mal hecho",
  "Cobró distinto a lo acordado",
  "Causó daños o roturas",
  "Acoso, amenazas o violencia",
  "Estafa o fraude",
  "Otro",
];

// POST /denuncias/nueva → { denunciadoid, motivo, detalle?, solicitudid?, mensajeid? }
export const denunciarUsuario = ({ denunciadoid, motivo, detalle, solicitudid, mensajeid }) =>
  pedirAlServidor("/denuncias/nueva", "POST", { denunciadoid, motivo, detalle, solicitudid, mensajeid });

/* ---------- Historial de búsquedas (en la base) ---------- */

export const obtenerHistorialServidor = async () => {
  const resultado = await pedirAlServidor("/historial_busqueda/miHistorial");
  return resultado.result || [];
};

export const guardarBusquedaServidor = (busqueda) =>
  pedirAlServidor("/historial_busqueda/agregarBusqueda", "POST", { busqueda });

export const borrarHistorialServidor = () =>
  pedirAlServidor("/historial_busqueda/borrarHistorial", "DELETE");

/* ---------- Administración ---------- */

export const admin = {
  resumen: async () => (await pedirAlServidor("/admin/resumen")).result,
  errores: async (origen = "") => (await pedirAlServidor(`/admin/errores?origen=${encodeURIComponent(origen)}`)).result || [],
  denuncias: async (estado = "pendiente") =>
    (await pedirAlServidor(`/admin/denuncias?estado=${encodeURIComponent(estado)}`)).result || [],
  resolverDenuncia: (id, estado, nota) => pedirAlServidor("/admin/resolverDenuncia", "PUT", { id, estado, nota }),
  usuarios: async (busqueda = "", filtro = "") =>
    (await pedirAlServidor(`/admin/usuarios?busqueda=${encodeURIComponent(busqueda)}&filtro=${encodeURIComponent(filtro)}`)).result || [],
  usuario: async (id) => (await pedirAlServidor(`/admin/usuario/${encodeURIComponent(id)}`)).result,
  suspender: (userid, suspendido, motivo) => pedirAlServidor("/admin/suspender", "PUT", { userid, suspendido, motivo }),
  verificarDni: (userid, aprobado, nota) => pedirAlServidor("/admin/verificarDni", "PUT", { userid, aprobado, nota }),
};
