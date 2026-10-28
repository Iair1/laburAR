// problemasApi.js
// Todo lo de "problemas" contra el backend real (router /api/solicitudes).
//
// Un problema es una solicitud con dirigida = false (no va a un trabajador puntual):
//  · el cliente lo publica ............ POST   /subirSolicitud      { dirigida: false, aptitud, solicitud, periodo, diassemana, localidad }
//  · los trabajadores lo ven .......... GET    /busquedaAA          (abiertos, sin los propios, ordenados por coincidencia con sus servicios)
//  · un trabajador agenda la cita ..... POST   /aceptarSolicitud    { solicitudid, dia }  → queda "pendiente" ese día
//  · el cliente ve los suyos .......... GET    /misProblemas
//  · el trabajador ve sus citas ....... GET    /trabajosPendientes
//  · cancelar ......................... DELETE /borrarSolicitud (si nadie lo agendó) · PUT /cancelarTrabajo (si ya hay cita)
import { armarTextoProblema, leerTextoProblema, normalizarPeriodo, normalizarDiasSemana } from "./problemasDatos";

const API_URL_SOLICITUDES = import.meta.env.DEV
  ? "https://laburar-three.vercel.app/api/solicitudes"
  : "/api/solicitudes";

async function pedir(ruta, method = "GET", body) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL_SOLICITUDES}${ruta}`, {
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
    const error = new Error(resultado.message || "Error en el servidor");
    error.status = respuesta.status;
    throw error;
  }
  return resultado;
}

/** Convierte una fila de `solicitudes` (con los joins de cada ruta) en un problema para la UI. */
export function aProblema(fila) {
  const texto = leerTextoProblema(fila.solicitud);
  const periodo = normalizarPeriodo(fila.periodo);
  return {
    id: fila.id,
    estado: fila.estado || "por revisar",
    dirigida: fila.dirigida,
    textoOriginal: fila.solicitud || "",
    titulo: texto.titulo,
    descripcion: texto.descripcion,
    franja: texto.franja,
    barrio: texto.barrio,
    urgencia: texto.urgencia,
    hora: texto.hora || null, // la que eligió el trabajador al agendar
    categoria: fila.aptitud || "",
    aptitudid: fila.aptitudid ?? null,
    localidad: fila.localidad || "",
    periodo,
    diassemana: normalizarDiasSemana(fila.diassemana),
    // Cuando hay cita, el backend deja periodo = [día, día]
    dia: fila.estado && fila.estado !== "por revisar" ? periodo[0] : null,
    coincidencias: Number(fila.coincidencias || 0),
    // busquedaAA y trabajosPendientes traen los datos de quien lo publicó
    cliente: fila.nombre_completo
      ? {
          id: fila.contratadorid,
          nombre: fila.nombre_completo,
          foto: fila.foto_perfil || null,
          puntuacion: fila.puntuacion_contratador,
        }
      : null,
    // misProblemas trae los del trabajador que agendó
    trabajador: fila.trabajador_nombre
      ? {
          id: fila.trabajadorid,
          nombre: fila.trabajador_nombre,
          foto: fila.trabajador_foto || null,
          puntuacion: fila.puntuacion_trabajador,
        }
      : null,
  };
}

/**
 * Publica un problema.
 * @param {Object} datos - { categoria, titulo, descripcion, zona, barrio, franja, urgencia, inicio, fin, diassemana }
 */
export async function subirProblema(datos) {
  const resultado = await pedir("/subirSolicitud", "POST", {
    dirigida: false,
    aptitud: datos.categoria,
    solicitud: armarTextoProblema(datos),
    periodo: [datos.inicio, datos.fin],
    diassemana: datos.diassemana,
    localidad: datos.zona,
  });
  return resultado.result ? aProblema({ ...resultado.result, aptitud: datos.categoria }) : null;
}

/** Problemas abiertos que puede agendar el usuario logueado (los propios no vienen). */
export async function obtenerProblemasDisponibles() {
  const resultado = await pedir("/busquedaAA");
  return (resultado.result || []).map(aProblema);
}

/** Problemas que publicó el usuario logueado, en cualquier estado. */
export async function obtenerMisProblemas() {
  const resultado = await pedir("/misProblemas");
  return (resultado.result || []).map(aProblema);
}

/** Citas que agendó el trabajador logueado (solo problemas; las solicitudes dirigidas siguen en "Trabajos pendientes"). */
export async function obtenerMisCitas() {
  const resultado = await pedir("/trabajosPendientes");
  return (resultado.result || []).filter((fila) => fila.dirigida === false).map(aProblema);
}

/** El trabajador agenda una cita: elige un día (YYYY-MM-DD) dentro de los que puso el cliente y una hora ("HH:MM"). */
export async function agendarCita(problemaId, dia, hora) {
  try {
    const resultado = await pedir("/aceptarSolicitud", "POST", { solicitudid: problemaId, dia, ...(hora ? { hora } : {}) });
    return resultado.result?.solicitud ? aProblema(resultado.result.solicitud) : null;
  } catch (error) {
    if (error.status === 500 && /no existe|no coincide/i.test(error.message)) {
      error.message = "Este problema ya no está disponible: puede que otro trabajador lo haya agendado o que el cliente lo haya cancelado.";
      error.noDisponible = true;
    }
    throw error;
  }
}

/** Cancela un problema propio: si nadie lo agendó se borra; si ya tiene cita, se cancela (le avisa al trabajador). */
export async function cancelarProblema(problema) {
  if (problema.estado === "pendiente") return pedir("/cancelarTrabajo", "PUT", { solicitudid: problema.id });
  return pedir("/borrarSolicitud", "DELETE", { solicitudid: problema.id });
}

/** El trabajador cancela una cita que había agendado (le llega el aviso al cliente). */
export async function cancelarCita(problema) {
  return pedir("/cancelarTrabajo", "PUT", { solicitudid: problema.id });
}
