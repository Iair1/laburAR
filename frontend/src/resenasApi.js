// resenasApi.js
// Reseñas entre cliente y trabajador cuando termina un trabajo (router /api/resenas).
//  · GET  /resenas/pendientes        → trabajos terminados que todavía no reseñé
//  · POST /resenas/nuevaResena       → { reseña, puntuacion (1 a 5), trabajo (id de la solicitud) }
//  · GET  /resenas/de/:userid        → reseñas que recibió alguien (como trabajador y como cliente)
//  · PUT  /solicitudes/terminarTrabajo → marcar un trabajo como terminado (desde el día de la cita)
import { pedirAlServidor, avisarCambio } from "./servidor";
import { normalizarPeriodo } from "./problemasDatos";

export const EVENTO_RESENAS = "laburar-resenas-cambio";

// Lo que se ve del trabajo: el título de un problema o el comienzo de una solicitud
function tituloDelTrabajo(texto) {
  const primera = String(texto || "").split("\n")[0].replace(/^Horario preferido:[^.]*\.\s*/i, "").replace(/^Barrio:[^.]*\.\s*/i, "").trim();
  return primera.length > 60 ? `${primera.slice(0, 57).trim()}…` : primera;
}

function aPendiente(fila) {
  const [, dia] = normalizarPeriodo(fila.periodo);
  return {
    trabajo: fila.trabajo,
    titulo: tituloDelTrabajo(fila.solicitud),
    aptitud: fila.aptitud || "",
    dia,
    miRol: fila.mi_rol, // "trabajador" | "contratador"
    otro: { id: fila.otroid, nombre: fila.otro_nombre, foto: fila.otro_foto || null },
  };
}

export async function obtenerResenasPendientes() {
  const resultado = await pedirAlServidor("/resenas/pendientes");
  return (resultado.result || []).map(aPendiente);
}

export async function dejarResena({ trabajo, puntuacion, texto }) {
  const resultado = await pedirAlServidor("/resenas/nuevaResena", "POST", {
    reseña: texto.trim(),
    puntuacion,
    trabajo,
  });
  avisarCambio(EVENTO_RESENAS);
  return resultado.result;
}

function aResena(fila) {
  return {
    id: fila.id,
    puntuacion: Number(fila.puntuacion),
    texto: fila.texto || "",
    fecha: fila.fecha || null,
    aptitud: fila.aptitud || "",
    autor: { id: fila.autorid, nombre: fila.autor_nombre || "Usuario", foto: fila.autor_foto || null },
  };
}

/** { usuario, comoTrabajador: { promedio, cantidad, resenas }, comoCliente: {...} } */
export async function obtenerResenasDe(userid) {
  const resultado = await pedirAlServidor(`/resenas/de/${encodeURIComponent(userid)}`);
  const r = resultado.result || {};
  const resumen = (x) => ({
    promedio: x?.promedio ?? null,
    cantidad: x?.cantidad ?? 0,
    resenas: (x?.["reseñas"] || []).map(aResena),
  });
  return {
    usuario: r.usuario || null,
    comoTrabajador: resumen(r.como_trabajador),
    comoCliente: resumen(r.como_cliente),
  };
}

export async function terminarTrabajo(solicitudid) {
  const resultado = await pedirAlServidor("/solicitudes/terminarTrabajo", "PUT", { solicitudid });
  avisarCambio(EVENTO_RESENAS);
  return resultado.result;
}
