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
  window.dispatchEvent(new Event("laburar-sesion-cambio"));
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
