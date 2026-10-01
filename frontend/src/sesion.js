// sesion.js
// Maneja: (1) la sesión del usuario logueado y (2) las publicaciones de
// servicio ("tarjetas") que se muestran en PaginaBusqueda.
// Todo vive en localStorage porque hoy no hay endpoints de backend para
// perfil-de-usuario-logueado ni para publicaciones. Cuando los haya, esta es
// la única capa que hay que tocar: se cambia el body de cada función por un
// fetch/axios y el resto de la app sigue funcionando igual, porque todos los
// componentes importan estas funciones y no localStorage directamente.

const CLAVE_SESION = "laburar_sesion";
const CLAVE_PUBLICACIONES = "laburar_publicaciones";

// --- Sesión (usuario logueado actualmente) ---

export function guardarSesionUsuario(usuario) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
  window.dispatchEvent(new Event("laburar-sesion-cambio"));
}

export function obtenerSesionUsuario() {
  const datos = localStorage.getItem(CLAVE_SESION);
  return datos ? JSON.parse(datos) : null;
}

export function cerrarSesionCompleta() {
  localStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem("token");
  localStorage.removeItem("laburar_notificaciones");
  localStorage.removeItem("laburar_notificaciones_leidas");
  window.dispatchEvent(new Event("laburar-sesion-cambio"));
  window.dispatchEvent(new Event("laburar-notificaciones-cambio"));
}

// --- Publicaciones (tarjetas de "Ofrecer servicios" que aparecen en PaginaBusqueda) ---

export function obtenerPublicaciones() {
  const datos = localStorage.getItem(CLAVE_PUBLICACIONES);
  return datos ? JSON.parse(datos) : [];
}

export function guardarPublicacion(publicacion) {
  const publicaciones = obtenerPublicaciones();
  publicaciones.push(publicacion);
  localStorage.setItem(CLAVE_PUBLICACIONES, JSON.stringify(publicaciones));
  window.dispatchEvent(new Event("laburar-publicaciones-cambio"));
}

// --- Utilidad: convierte un File a data URL para poder guardarlo/mostrarlo ---
export function archivoADataURL(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo) return resolve(null);
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

// --- Google (simulado) ---
// STUB para que "Continuar con Google" funcione de punta a punta en la demo.
// Para producción hay que cambiarlo por una integración real (ver
// INSTRUCCIONES.md): @react-oauth/google en el front + verificación del
// id_token en el backend, que devuelva un usuario real.
export function iniciarSesionConGoogleSimulado() {
  return Promise.resolve({
    nombre: "Usuario de Google",
    correo: `usuario.google.${Date.now()}@gmail.com`,
    fotoPerfilURL: "https://cdn-icons-png.flaticon.com/128/281/281764.png",
    proveedor: "google",
  });
}

// --- Notificaciones ---
// El backend hoy solo devuelve las notificaciones en la respuesta de
// /usuarios/iniciarSesion (no hay un endpoint para pedirlas después), así que
// las guardamos acá al loguearse. "Leídas" es solo un estado local del navegador.
const CLAVE_NOTIFICACIONES = "laburar_notificaciones";
const CLAVE_NOTIFICACIONES_LEIDAS = "laburar_notificaciones_leidas";

function leerJSON(clave, porDefecto) {
  try {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardarNotificaciones(notificaciones) {
  localStorage.setItem(
    CLAVE_NOTIFICACIONES,
    JSON.stringify(Array.isArray(notificaciones) ? notificaciones : [])
  );
  window.dispatchEvent(new Event("laburar-notificaciones-cambio"));
}

export function obtenerNotificaciones() {
  return leerJSON(CLAVE_NOTIFICACIONES, []);
}

// Clave estable de una notificación (usa el id de la base si viene).
export function claveNotificacion(n, indice) {
  return String(n?.id ?? `${indice}-${n?.contenido ?? ""}`);
}

export function obtenerNotificacionesLeidas() {
  return leerJSON(CLAVE_NOTIFICACIONES_LEIDAS, []);
}

export function marcarNotificacionesLeidas(claves) {
  const leidas = new Set([...obtenerNotificacionesLeidas(), ...claves]);
  localStorage.setItem(CLAVE_NOTIFICACIONES_LEIDAS, JSON.stringify([...leidas]));
  window.dispatchEvent(new Event("laburar-notificaciones-cambio"));
}

// --- Historial ("Retomá donde lo dejaste" en la página de inicio) ---
// Guarda las últimas búsquedas y solicitudes del usuario en este navegador.
const CLAVE_HISTORIAL = "laburar_historial";
const MAXIMO_HISTORIAL = 6;

export function obtenerHistorial() {
  return leerJSON(CLAVE_HISTORIAL, []);
}

/**
 * @param {Object} entrada - { tipo: "busqueda" | "solicitud", titulo, zona?, consulta?, categoria? }
 */
export function agregarAlHistorial(entrada) {
  if (!entrada?.titulo) return;
  const titulo = entrada.titulo.trim();
  const previo = obtenerHistorial().filter(
    (h) => !(h.titulo === titulo && (h.zona || "") === (entrada.zona || ""))
  );
  const nuevo = [{ ...entrada, titulo, fecha: Date.now() }, ...previo].slice(0, MAXIMO_HISTORIAL);
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(nuevo));
  window.dispatchEvent(new Event("laburar-historial-cambio"));
}

export function borrarHistorial() {
  localStorage.removeItem(CLAVE_HISTORIAL);
  window.dispatchEvent(new Event("laburar-historial-cambio"));
}

// --- Utilidad: lee el payload de un JWT (sin verificarlo, solo para mostrar datos) ---
export function leerPayloadJWT(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
