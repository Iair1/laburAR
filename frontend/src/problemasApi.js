// Única puerta de entrada a "problemas" y "presupuestos" para las pantallas.
//
// - Modo local (por defecto): todo se guarda en el navegador (problemasLocal.js).
// - Modo backend: poné VITE_PROBLEMAS_BACKEND=true (en frontend/.env o en Vercel)
//   cuando el backend tenga las rutas de frontend/CONTRATO_PROBLEMAS.md.
//
// Las dos versiones devuelven exactamente el mismo formato, así las pantallas
// no se enteran de cuál se está usando.

import * as local from "./problemasLocal";
import { pedirAPI } from "./api";
import { obtenerSesionUsuario } from "./sesion";
import { normalizarPeriodo, normalizarDiasSemana, fechasPosibles } from "./problemasDatos";

export const USA_BACKEND = import.meta.env.VITE_PROBLEMAS_BACKEND === "true";

/* ---------------- normalización de lo que devuelve el backend ---------------- */

const usuarioId = () => String(obtenerSesionUsuario()?.id ?? "");

function normalizarPresupuesto(a) {
  if (!a) return null;
  return {
    id: a.id,
    problemaId: a.solicitudid,
    trabajador: {
      id: a.trabajadorid,
      nombre: a.trabajador_nombre || a.nombre_completo || "Trabajador",
      foto: a.trabajador_foto || a.foto_perfil || null,
      calificacion: a.puntuacion_trabajador != null ? Number(a.puntuacion_trabajador) : null,
    },
    monto: Number(a.monto),
    mensaje: a.mensaje || "",
    materiales: a.materiales || "a_convenir",
    duracion: a.duracion || "",
    dia: normalizarPeriodo(a.periodo)[0],
    hora: a.hora ? String(a.hora).slice(0, 5) : "",
    estado: a.estado || "enviado",
    creado: a.creado || null,
    fechaValida: a.fecha_valida ?? true,
    problema: a.solicitud_detalle ? normalizarProblema(a.solicitud_detalle) : undefined,
  };
}

function normalizarProblema(s) {
  const periodo = normalizarPeriodo(s.periodo);
  const presupuestos = Array.isArray(s.aplicaciones) ? s.aplicaciones.map(normalizarPresupuesto) : undefined;
  const elegido = presupuestos?.find((pr) => pr.estado === "aceptado");
  return {
    id: s.id,
    titulo: s.titulo || String(s.solicitud || "").slice(0, 60),
    descripcion: s.solicitud || "",
    categoria: s.aptitud || s.categoria || "",
    fotos: Array.isArray(s.fotos) ? s.fotos : [],
    localidad: s.localidad || "",
    barrio: s.barrio || "",
    direccion: s.direccion ?? null,
    periodo,
    diassemana: normalizarDiasSemana(s.diassemana),
    franja: s.franja || "todo",
    urgencia: s.urgencia || "flexible",
    presupuestoEstimado: s.presupuesto_estimado != null ? Number(s.presupuesto_estimado) : null,
    estado: s.estado || "por revisar",
    creado: s.creado || s.fecha_creacion || null,
    actualizado: s.actualizado || null,
    cliente: {
      id: s.contratadorid,
      nombre: s.cliente_nombre || s.nombre_completo || "Cliente",
      foto: s.cliente_foto || s.foto_perfil || null,
      calificacion: s.puntuacion_contratador != null ? Number(s.puntuacion_contratador) : null,
    },
    esMio: String(s.contratadorid) === usuarioId(),
    cantidadPresupuestos: Number(s.cantidad_presupuestos ?? presupuestos?.length ?? 0),
    presupuestoMinimo: s.presupuesto_minimo != null ? Number(s.presupuesto_minimo) : null,
    miPresupuesto: s.mi_aplicacion ? normalizarPresupuesto(s.mi_aplicacion) : null,
    presupuestos,
    agendado:
      s.estado === "pendiente" || s.estado === "terminada"
        ? {
            dia: periodo[0],
            hora: s.hora ? String(s.hora).slice(0, 5) : elegido?.hora || "",
            trabajador: elegido?.trabajador || { id: s.trabajadorid, nombre: s.trabajador_nombre || "Trabajador", foto: s.trabajador_foto || null },
            monto: elegido?.monto ?? (s.monto_acordado != null ? Number(s.monto_acordado) : null),
          }
        : null,
  };
}

// El backend guarda la categoría como aptitudid: buscamos el id por nombre
let catalogoAptitudes = null;
async function idDeAptitud(nombre) {
  if (!catalogoAptitudes) {
    const respuesta = await pedirAPI("/aptitudes/buscarAptitudes", "GET").catch(() => ({ result: [] }));
    catalogoAptitudes = respuesta.result || [];
  }
  return catalogoAptitudes.find((a) => a.aptitud === nombre)?.id ?? null;
}

async function cuerpoProblema(datosForm) {
  const valido = local.validarProblema(datosForm);
  return {
    dirigida: false,
    solicitud: valido.solicitud,
    titulo: valido.titulo,
    aptitud: valido.categoria,
    aptitudid: await idDeAptitud(valido.categoria),
    localidad: valido.localidad,
    barrio: valido.barrio,
    direccion: valido.direccion,
    periodo: valido.periodo,
    diassemana: valido.diassemana,
    franja: valido.franja,
    urgencia: valido.urgencia,
    presupuesto_estimado: valido.presupuesto_estimado,
    fotos: valido.fotos,
  };
}

const lista = (r) => (Array.isArray(r?.result) ? r.result : []);

/* ---------------- API pública (misma firma en los dos modos) ---------------- */

export async function subirProblema(datosForm) {
  if (!USA_BACKEND) return local.subirProblema(datosForm);
  const r = await pedirAPI("/solicitudes/subirSolicitud", "POST", await cuerpoProblema(datosForm));
  return normalizarProblema(r.result);
}

export async function editarProblema(id, datosForm) {
  if (!USA_BACKEND) return local.editarProblema(id, datosForm);
  const r = await pedirAPI("/solicitudes/editarProblema", "PUT", { solicitudid: id, ...(await cuerpoProblema(datosForm)) });
  return normalizarProblema(r.result);
}

export async function obtenerMisProblemas() {
  if (!USA_BACKEND) return local.obtenerMisProblemas();
  return lista(await pedirAPI("/solicitudes/misProblemas", "GET")).map(normalizarProblema);
}

export async function obtenerProblema(id) {
  if (!USA_BACKEND) return local.obtenerProblema(id);
  const r = await pedirAPI(`/solicitudes/problema/${encodeURIComponent(id)}`, "GET");
  return normalizarProblema(r.result);
}

// Abierto → se borra (borrarSolicitud). Agendado → se cancela (cancelarTrabajo).
export async function cancelarProblema(problema) {
  if (!USA_BACKEND) return local.cancelarProblema(problema.id);
  if (problema.estado === "pendiente") {
    return pedirAPI("/solicitudes/cancelarTrabajo", "PUT", { solicitudid: problema.id });
  }
  return pedirAPI("/solicitudes/borrarSolicitud", "DELETE", { solicitudid: problema.id });
}

export async function obtenerProblemasDisponibles() {
  if (!USA_BACKEND) return local.obtenerProblemasDisponibles();
  return lista(await pedirAPI("/solicitudes/busquedaAA", "GET"))
    .map(normalizarProblema)
    .filter((p) => !p.esMio && fechasPosibles(p).length > 0);
}

export async function enviarPresupuesto(problema, datosForm) {
  if (!USA_BACKEND) return local.enviarPresupuesto(problema.id, datosForm);
  const valido = local.validarPresupuesto(datosForm, problema);
  const r = await pedirAPI("/aplicaciones/subirAplicacion", "POST", { solicitudid: problema.id, ...valido });
  return normalizarPresupuesto(r.result);
}

export async function retirarPresupuesto(presupuesto) {
  if (!USA_BACKEND) return local.retirarPresupuesto(presupuesto.id);
  return pedirAPI("/aplicaciones/borrarAplicacion", "DELETE", { solicitudid: presupuesto.problemaId });
}

export async function obtenerMisPresupuestos() {
  if (!USA_BACKEND) return local.obtenerMisPresupuestos();
  return lista(await pedirAPI("/aplicaciones/misAplicaciones", "GET")).map(normalizarPresupuesto);
}

export async function aceptarPresupuesto(presupuesto) {
  if (!USA_BACKEND) return local.aceptarPresupuesto(presupuesto.id);
  return pedirAPI("/aplicaciones/aceptarAplicacion", "POST", { aplicacionid: presupuesto.id });
}

export async function rechazarPresupuesto(presupuesto) {
  if (!USA_BACKEND) return local.rechazarPresupuesto(presupuesto.id);
  return pedirAPI("/aplicaciones/rechazarAplicacion", "POST", { aplicacionid: presupuesto.id });
}

export async function cancelarTrabajoAgendado(presupuesto) {
  if (!USA_BACKEND) return local.cancelarTrabajoAgendado(presupuesto.id);
  return pedirAPI("/solicitudes/cancelarTrabajo", "PUT", { solicitudid: presupuesto.problemaId });
}
