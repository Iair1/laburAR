// mensajesApi.js
// Mensajes entre personas que tienen (o tuvieron) una cita o solicitud (router /api/mensajes).
import { pedirAlServidor, avisarCambio } from "./servidor";
import { normalizarPeriodo } from "./problemasDatos";

export const EVENTO_MENSAJES = "laburar-mensajes-cambio";

function aMensaje(fila) {
  return {
    id: fila.id,
    de: fila.emisorid,
    para: fila.receptorid,
    texto: fila.contenido || "",
    imagen: fila.imagen || null,
    fecha: fila.fecha || null,
    leido: Boolean(fila.leido),
  };
}

function aCita(fila) {
  const [inicio, fin] = normalizarPeriodo(fila.periodo);
  return {
    id: fila.id ?? fila.solicitudid,
    texto: fila.solicitud || "",
    inicio,
    fin,
    estado: fila.estado,
    dirigida: fila.dirigida,
    aptitud: fila.aptitud || "",
    miRol: fila.mi_rol,
  };
}

/** Conversaciones, la más reciente primero. */
export async function obtenerMisChats() {
  const resultado = await pedirAlServidor("/mensajes/misChats");
  return (resultado.result || []).map((c) => ({
    id: c.id,
    nombre: c.nombre_completo,
    esEmpresa: c.es_empresa === true,
    foto: c.foto_perfil || null,
    ultimoId: c.ultimo_id,
    ultimoTexto: c.ultimo_mensaje || "",
    ultimoEsImagen: Boolean(c.ultimo_es_imagen),
    ultimaFecha: c.ultima_fecha || null,
    ultimoEsMio: c.ultimo_emisorid !== c.id,
    noLeidos: Number(c.no_leidos || 0),
  }));
}

/** Personas con las que se puede empezar a chatear (tienen una cita o solicitud en común). */
export async function obtenerContactos() {
  const resultado = await pedirAlServidor("/mensajes/contactos");
  return (resultado.result || []).map((c) => ({
    id: c.id,
    nombre: c.nombre_completo,
    esEmpresa: c.es_empresa === true,
    foto: c.foto_perfil || null,
    cita: aCita(c),
  }));
}

/**
 * Mensajes con otra persona. Con `despuesDe` trae solo los nuevos (para ir actualizando).
 * Sin `despuesDe` también trae sus datos, las citas en común y si se le puede escribir.
 */
export async function obtenerChat(otroid, despuesDe) {
  const resultado = await pedirAlServidor("/mensajes/conseguirChat", "POST", { otroid, ...(despuesDe ? { despuesDe } : {}) });
  return {
    mensajes: (resultado.result || []).map(aMensaje),
    yo: resultado.userid,
    otro: resultado.otro
      ? {
          id: resultado.otro.id,
          nombre: resultado.otro.nombre_completo,
          esEmpresa: resultado.otro.es_empresa === true,
          foto: resultado.otro.foto_perfil || null,
          zona: resultado.otro.localidad || "",
          puntuacionTrabajador: resultado.otro.puntuacion_trabajador,
          puntuacionCliente: resultado.otro.puntuacion_contratador,
        }
      : null,
    citas: (resultado.citas || []).map(aCita),
    puedeEscribir: resultado.puedeEscribir !== false,
    yoBloquee: resultado.yoBloquee === true, // yo bloqueé a esta persona
    bloqueado: resultado.bloqueado === true, // hay un bloqueo (de cualquiera de los dos)
  };
}

/** Borra un mensaje propio. */
export async function borrarMensaje(mensajeid) {
  await pedirAlServidor("/mensajes/borrarMensaje", "DELETE", { mensaje: mensajeid });
  avisarCambio(EVENTO_MENSAJES);
}

/** Manda un mensaje (texto y/o foto ya convertida a base64). */
export async function mandarMensaje(receptor, texto, imagenBase64 = null) {
  const resultado = await pedirAlServidor("/mensajes/mandarMensaje", "POST", {
    receptor,
    mensaje: texto || "",
    ...(imagenBase64 ? { imagen: imagenBase64 } : {}),
  });
  avisarCambio(EVENTO_MENSAJES);
  return resultado.result ? aMensaje(resultado.result) : null;
}

export async function contarNoLeidos() {
  const resultado = await pedirAlServidor("/mensajes/noLeidos");
  return Number(resultado.cantidad || 0);
}
