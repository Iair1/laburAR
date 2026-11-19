// cuentaApi.js
// Cuenta y seguridad: recuperar contraseña, eliminar cuenta, DNI, bloqueos, denuncias,
// historial de búsquedas y panel de administración.
import { pedirAlServidor } from "./servidor";

/* ---------- Contraseña ---------- */

// POST /usuarios/recuperarContrasena → manda un código de 6 números al email
export const pedirCodigoRecuperacion = (email) =>
  pedirAlServidor("/usuarios/recuperarContrasena", "POST", { email: email.trim() });

// POST /usuarios/restablecerContrasena → { email, codigo, contraseña }
export const restablecerContrasena = (email, codigo, contrasena) =>
  pedirAlServidor("/usuarios/restablecerContrasena", "POST", { email: email.trim(), codigo: codigo.trim(), contraseña: contrasena });

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
  denuncias: async (estado = "pendiente") =>
    (await pedirAlServidor(`/admin/denuncias?estado=${encodeURIComponent(estado)}`)).result || [],
  resolverDenuncia: (id, estado, nota) => pedirAlServidor("/admin/resolverDenuncia", "PUT", { id, estado, nota }),
  usuarios: async (busqueda = "", filtro = "") =>
    (await pedirAlServidor(`/admin/usuarios?busqueda=${encodeURIComponent(busqueda)}&filtro=${encodeURIComponent(filtro)}`)).result || [],
  usuario: async (id) => (await pedirAlServidor(`/admin/usuario/${encodeURIComponent(id)}`)).result,
  suspender: (userid, suspendido, motivo) => pedirAlServidor("/admin/suspender", "PUT", { userid, suspendido, motivo }),
  verificarDni: (userid, aprobado, nota) => pedirAlServidor("/admin/verificarDni", "PUT", { userid, aprobado, nota }),
};
