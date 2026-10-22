// "Modo local" de problemas y presupuestos: guarda todo en el navegador
// (localStorage) con las MISMAS reglas que va a tener el backend, para que la
// funcionalidad se pueda usar y probar completa mientras el backend no está.
// Cuando el backend esté listo, problemasApi.js deja de usar este archivo
// (ver frontend/CONTRATO_PROBLEMAS.md).

import { obtenerSesionUsuario, agregarNotificacionLocal } from "./sesion";
import {
  fechasPosibles,
  horasDeFranja,
  hoyStr,
  normalizarDiasSemana,
  normalizarPeriodo,
  fechaLarga,
  formatearPesos,
  FRANJAS,
  URGENCIAS,
  DURACIONES,
  MATERIALES,
  MAXIMO_FOTOS_PROBLEMA,
} from "./problemasDatos";
import { ZONAS, CATEGORIAS } from "./constantes";

const CLAVE = "laburar_problemas_v1";

function error(mensaje, status = 400) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (datos && Array.isArray(datos.problemas) && Array.isArray(datos.presupuestos)) return datos;
  } catch {
    // datos corruptos: arrancamos de cero
  }
  return { problemas: [], presupuestos: [], secuencia: 1 };
}

function guardar(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    throw error("No queda espacio en este navegador para guardar más fotos. Probá con menos fotos o más chicas.", 507);
  }
  window.dispatchEvent(new Event("laburar-problemas-cambio"));
}

function nuevoId(datos, prefijo) {
  const id = `${prefijo}${datos.secuencia}`;
  datos.secuencia += 1;
  return id;
}

function usuarioActual() {
  const usuario = obtenerSesionUsuario();
  if (!usuario || usuario.id === undefined || usuario.id === null) {
    throw error("Iniciá sesión para continuar.", 401);
  }
  return { id: String(usuario.id), nombre: usuario.nombre || "Usuario", foto: usuario.fotoPerfilURL || null };
}

const ahora = () => new Date().toISOString();

// Igual que el cron revisarTerminadas: lo agendado cuyo día ya pasó queda terminado
function actualizarTerminados(datos) {
  const hoy = hoyStr();
  let cambio = false;
  for (const p of datos.problemas) {
    if (p.estado === "pendiente" && p.agendado?.dia && p.agendado.dia < hoy) {
      p.estado = "terminada";
      p.actualizado = ahora();
      cambio = true;
    }
  }
  return cambio;
}

function leerActualizado() {
  const datos = leer();
  if (actualizarTerminados(datos)) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      // no pasa nada si no se pudo persistir
    }
  }
  return datos;
}

/* ---------------- validaciones ---------------- */

export function validarProblema(d) {
  const titulo = String(d.titulo || "").trim();
  const descripcion = String(d.descripcion || "").trim();
  if (!CATEGORIAS.includes(d.categoria)) throw error("Elegí una categoría.");
  if (titulo.length < 5) throw error("Poné un título de al menos 5 letras.");
  if (titulo.length > 80) throw error("El título puede tener hasta 80 letras.");
  if (descripcion.length < 20) throw error("Contá el problema con un poco más de detalle (mínimo 20 letras).");
  if (!ZONAS.includes(d.localidad)) throw error("Elegí tu zona.");
  const [inicio, fin] = normalizarPeriodo(d.periodo);
  if (!inicio || !fin) throw error("Elegí entre qué fechas pueden ir.");
  if (fin < inicio) throw error("La fecha de fin no puede ser antes que la de inicio.");
  if (fin < hoyStr()) throw error("Las fechas elegidas ya pasaron.");
  const diassemana = normalizarDiasSemana(d.diassemana);
  if (!diassemana.some(Boolean)) throw error("Elegí al menos un día de la semana.");
  if (fechasPosibles({ periodo: [inicio, fin], diassemana }).length === 0) {
    throw error("En esas fechas no cae ninguno de los días de la semana que elegiste.");
  }
  if (!FRANJAS[d.franja]) throw error("Elegí en qué horario pueden ir.");
  if (!URGENCIAS[d.urgencia]) throw error("Contanos qué tan urgente es.");
  const fotos = Array.isArray(d.fotos) ? d.fotos.filter(Boolean) : [];
  if (fotos.length > MAXIMO_FOTOS_PROBLEMA) throw error(`Podés subir hasta ${MAXIMO_FOTOS_PROBLEMA} fotos.`);
  const presupuesto = d.presupuesto_estimado === "" || d.presupuesto_estimado == null ? null : Number(d.presupuesto_estimado);
  if (presupuesto !== null && (!Number.isFinite(presupuesto) || presupuesto <= 0)) {
    throw error("El presupuesto estimado tiene que ser un número mayor a 0.");
  }
  return {
    titulo,
    solicitud: descripcion,
    categoria: d.categoria,
    localidad: d.localidad,
    barrio: String(d.barrio || "").trim().slice(0, 60),
    direccion: String(d.direccion || "").trim().slice(0, 120),
    periodo: [inicio, fin],
    diassemana,
    franja: d.franja,
    urgencia: d.urgencia,
    presupuesto_estimado: presupuesto,
    fotos,
  };
}

/* ---------------- armado de respuestas (mismo formato que el modo backend) ---------------- */

function resumenPresupuesto(pr, datos) {
  return {
    id: pr.id,
    problemaId: pr.solicitudid,
    trabajador: { ...pr.trabajador },
    monto: pr.monto,
    mensaje: pr.mensaje,
    materiales: pr.materiales,
    duracion: pr.duracion,
    dia: pr.periodo[0],
    hora: pr.hora,
    estado: pr.estado,
    creado: pr.creado,
    fechaValida: (() => {
      const problema = datos.problemas.find((p) => p.id === pr.solicitudid);
      return problema ? fechasPosibles(problema).includes(pr.periodo[0]) : false;
    })(),
  };
}

function armarProblema(p, datos, usuario) {
  const esMio = usuario && p.contratadorid === usuario.id;
  const presupuestos = datos.presupuestos.filter((pr) => pr.solicitudid === p.id);
  const activos = presupuestos.filter((pr) => pr.estado === "enviado" || pr.estado === "aceptado");
  const mio = usuario ? presupuestos.find((pr) => pr.trabajadorid === usuario.id && pr.estado !== "retirado") : null;
  const elegido = p.agendado ? presupuestos.find((pr) => pr.id === p.agendado.presupuestoId) : null;
  const veDireccion = esMio || (elegido && usuario && elegido.trabajadorid === usuario.id);
  const montos = activos.map((pr) => pr.monto);
  return {
    id: p.id,
    titulo: p.titulo,
    descripcion: p.solicitud,
    categoria: p.categoria,
    fotos: p.fotos || [],
    localidad: p.localidad,
    barrio: p.barrio,
    direccion: veDireccion ? p.direccion : null,
    periodo: p.periodo,
    diassemana: p.diassemana,
    franja: p.franja,
    urgencia: p.urgencia,
    presupuestoEstimado: p.presupuesto_estimado,
    estado: p.estado,
    creado: p.creado,
    actualizado: p.actualizado,
    cliente: { ...p.cliente },
    esMio: Boolean(esMio),
    cantidadPresupuestos: activos.length,
    presupuestoMinimo: montos.length ? Math.min(...montos) : null,
    miPresupuesto: mio ? resumenPresupuesto(mio, datos) : null,
    presupuestos: esMio
      ? presupuestos
          .filter((pr) => pr.estado !== "retirado")
          .map((pr) => resumenPresupuesto(pr, datos))
          .sort((a, b) => a.monto - b.monto)
      : undefined,
    agendado: p.agendado
      ? {
          ...p.agendado,
          trabajador: elegido ? { ...elegido.trabajador } : null,
          monto: elegido ? elegido.monto : null,
        }
      : null,
  };
}

/* ---------------- problemas (cliente) ---------------- */

export async function subirProblema(datosForm) {
  const usuario = usuarioActual();
  const valido = validarProblema(datosForm);
  const datos = leer();
  const problema = {
    id: nuevoId(datos, "p"),
    contratadorid: usuario.id,
    cliente: { id: usuario.id, nombre: usuario.nombre, foto: usuario.foto },
    dirigida: false,
    estado: "por revisar",
    creado: ahora(),
    actualizado: ahora(),
    agendado: null,
    ...valido,
  };
  datos.problemas.push(problema);
  guardar(datos);
  return armarProblema(problema, datos, usuario);
}

export async function editarProblema(id, datosForm) {
  const usuario = usuarioActual();
  const datos = leer();
  const problema = datos.problemas.find((p) => p.id === String(id));
  if (!problema || problema.contratadorid !== usuario.id) throw error("Ese problema no existe o no es tuyo.", 404);
  if (problema.estado !== "por revisar") throw error("Solo se puede editar un problema que todavía está recibiendo presupuestos.");
  Object.assign(problema, validarProblema(datosForm), { actualizado: ahora() });
  guardar(datos);
  return armarProblema(problema, datos, usuario);
}

export async function obtenerMisProblemas() {
  const usuario = usuarioActual();
  const datos = leerActualizado();
  return datos.problemas
    .filter((p) => p.contratadorid === usuario.id)
    .sort((a, b) => b.creado.localeCompare(a.creado))
    .map((p) => armarProblema(p, datos, usuario));
}

export async function obtenerProblema(id) {
  const usuario = usuarioActual();
  const datos = leerActualizado();
  const problema = datos.problemas.find((p) => p.id === String(id));
  if (!problema) throw error("Ese problema no existe o ya no está publicado.", 404);
  const esMio = problema.contratadorid === usuario.id;
  const participa = datos.presupuestos.some((pr) => pr.solicitudid === problema.id && pr.trabajadorid === usuario.id);
  if (!esMio && !participa && problema.estado !== "por revisar") {
    throw error("Este problema ya no está recibiendo presupuestos.", 404);
  }
  return armarProblema(problema, datos, usuario);
}

export async function cancelarProblema(id) {
  const usuario = usuarioActual();
  const datos = leer();
  const problema = datos.problemas.find((p) => p.id === String(id));
  if (!problema || problema.contratadorid !== usuario.id) throw error("Ese problema no existe o no es tuyo.", 404);
  if (problema.estado !== "por revisar" && problema.estado !== "pendiente") throw error("Este problema ya está cerrado.");
  const estabaAgendado = problema.estado === "pendiente";
  problema.estado = "cancelado";
  problema.actualizado = ahora();
  for (const pr of datos.presupuestos) {
    if (pr.solicitudid !== problema.id) continue;
    if (pr.estado === "enviado" || pr.estado === "aceptado") {
      const eraElegido = pr.estado === "aceptado";
      pr.estado = "cancelado";
      agregarNotificacionLocal(pr.trabajadorid, {
        contenido: eraElegido
          ? `${problema.cliente.nombre} canceló el trabajo "${problema.titulo}" que tenían agendado.`
          : `El problema "${problema.titulo}" fue cancelado por el cliente.`,
        enlace: "/problemas?vista=presupuestos",
      });
    }
  }
  guardar(datos);
  return { cancelado: true, estabaAgendado };
}

/* ---------------- tablero (trabajadores) ---------------- */

export async function obtenerProblemasDisponibles() {
  const usuario = usuarioActual();
  const datos = leerActualizado();
  return datos.problemas
    .filter((p) => p.estado === "por revisar" && p.contratadorid !== usuario.id && fechasPosibles(p).length > 0)
    .sort((a, b) => b.creado.localeCompare(a.creado))
    .map((p) => armarProblema(p, datos, usuario));
}

/* ---------------- presupuestos ---------------- */

export function validarPresupuesto(d, problema) {
  const monto = Number(d.monto);
  if (!Number.isFinite(monto) || monto <= 0) throw error("Poné el monto total del presupuesto.");
  if (monto > 100000000) throw error("Revisá el monto: parece demasiado alto.");
  const mensaje = String(d.mensaje || "").trim();
  if (mensaje.length < 15) throw error("Contale al cliente qué incluye tu presupuesto (mínimo 15 letras).");
  if (!fechasPosibles(problema).includes(d.dia)) throw error("Elegí uno de los días en que el cliente puede.");
  if (!horasDeFranja(problema.franja).includes(d.hora)) throw error("Elegí un horario dentro del que pidió el cliente.");
  if (!MATERIALES[d.materiales]) throw error("Indicá si los materiales están incluidos.");
  if (!DURACIONES.includes(d.duracion)) throw error("Indicá cuánto tiempo te va a llevar.");
  return { monto, mensaje: mensaje.slice(0, 1500), periodo: [d.dia, d.dia], hora: d.hora, materiales: d.materiales, duracion: d.duracion };
}

export async function enviarPresupuesto(problemaId, datosForm) {
  const usuario = usuarioActual();
  const datos = leer();
  const problema = datos.problemas.find((p) => p.id === String(problemaId));
  if (!problema) throw error("Ese problema ya no existe.", 404);
  if (problema.contratadorid === usuario.id) throw error("No podés mandarte un presupuesto a vos mismo.", 403);
  if (problema.estado !== "por revisar") throw error("Este problema ya no está recibiendo presupuestos.");
  const yaEnviado = datos.presupuestos.find(
    (pr) => pr.solicitudid === problema.id && pr.trabajadorid === usuario.id && pr.estado === "enviado"
  );
  if (yaEnviado) throw error("Ya le mandaste un presupuesto a este problema. Si querés cambiarlo, retiralo primero.", 409);
  const valido = validarPresupuesto(datosForm, problema);
  const presupuesto = {
    id: nuevoId(datos, "a"),
    solicitudid: problema.id,
    trabajadorid: usuario.id,
    trabajador: { id: usuario.id, nombre: usuario.nombre, foto: usuario.foto },
    estado: "enviado",
    creado: ahora(),
    ...valido,
  };
  datos.presupuestos.push(presupuesto);
  guardar(datos);
  agregarNotificacionLocal(problema.contratadorid, {
    contenido: `${usuario.nombre} te mandó un presupuesto de ${formatearPesos(valido.monto)} para "${problema.titulo}".`,
    enlace: `/mis-problemas?ver=${problema.id}`,
  });
  return resumenPresupuesto(presupuesto, datos);
}

export async function retirarPresupuesto(presupuestoId) {
  const usuario = usuarioActual();
  const datos = leer();
  const pr = datos.presupuestos.find((x) => x.id === String(presupuestoId));
  if (!pr || pr.trabajadorid !== usuario.id) throw error("Ese presupuesto no existe o no es tuyo.", 404);
  if (pr.estado !== "enviado") throw error("Solo se puede retirar un presupuesto que todavía no fue respondido.");
  pr.estado = "retirado";
  guardar(datos);
  return { retirado: true };
}

export async function obtenerMisPresupuestos() {
  const usuario = usuarioActual();
  const datos = leerActualizado();
  return datos.presupuestos
    .filter((pr) => pr.trabajadorid === usuario.id && pr.estado !== "retirado")
    .sort((a, b) => b.creado.localeCompare(a.creado))
    .map((pr) => {
      const problema = datos.problemas.find((p) => p.id === pr.solicitudid);
      return {
        ...resumenPresupuesto(pr, datos),
        problema: problema ? armarProblema(problema, datos, usuario) : null,
      };
    });
}

export async function aceptarPresupuesto(presupuestoId) {
  const usuario = usuarioActual();
  const datos = leer();
  const pr = datos.presupuestos.find((x) => x.id === String(presupuestoId));
  const problema = pr && datos.problemas.find((p) => p.id === pr.solicitudid);
  if (!pr || !problema || problema.contratadorid !== usuario.id) throw error("Ese presupuesto no existe.", 404);
  if (problema.estado !== "por revisar") throw error("Este problema ya tiene un trabajador agendado o está cerrado.");
  if (pr.estado !== "enviado") throw error("Ese presupuesto ya no está disponible.");
  if (!fechasPosibles(problema).includes(pr.periodo[0])) {
    throw error("La fecha que propuso este trabajador ya no está dentro de tus días disponibles.");
  }
  // Igual que aceptarSolicitud: queda "pendiente", con el trabajador y el día elegido
  problema.estado = "pendiente";
  problema.actualizado = ahora();
  problema.agendado = { presupuestoId: pr.id, trabajadorid: pr.trabajadorid, dia: pr.periodo[0], hora: pr.hora };
  pr.estado = "aceptado";
  agregarNotificacionLocal(pr.trabajadorid, {
    contenido: `¡${problema.cliente.nombre} aceptó tu presupuesto para "${problema.titulo}"! Quedó agendado el ${fechaLarga(pr.periodo[0])} a las ${pr.hora}.`,
    enlace: "/problemas?vista=presupuestos",
  });
  for (const otro of datos.presupuestos) {
    if (otro.solicitudid === problema.id && otro.id !== pr.id && otro.estado === "enviado") {
      otro.estado = "rechazado";
      agregarNotificacionLocal(otro.trabajadorid, {
        contenido: `El cliente eligió otro presupuesto para "${problema.titulo}".`,
        enlace: "/problemas?vista=presupuestos",
      });
    }
  }
  agregarNotificacionLocal(usuario.id, {
    contenido: `Agendaste "${problema.titulo}" con ${pr.trabajador.nombre} el ${fechaLarga(pr.periodo[0])} a las ${pr.hora}.`,
    enlace: `/mis-problemas?ver=${problema.id}`,
  });
  guardar(datos);
  return armarProblema(problema, datos, usuario);
}

export async function rechazarPresupuesto(presupuestoId) {
  const usuario = usuarioActual();
  const datos = leer();
  const pr = datos.presupuestos.find((x) => x.id === String(presupuestoId));
  const problema = pr && datos.problemas.find((p) => p.id === pr.solicitudid);
  if (!pr || !problema || problema.contratadorid !== usuario.id) throw error("Ese presupuesto no existe.", 404);
  if (pr.estado !== "enviado") throw error("Ese presupuesto ya fue respondido.");
  pr.estado = "rechazado";
  agregarNotificacionLocal(pr.trabajadorid, {
    contenido: `El cliente no eligió tu presupuesto para "${problema.titulo}".`,
    enlace: "/problemas?vista=presupuestos",
  });
  guardar(datos);
  return armarProblema(problema, datos, usuario);
}

// Igual que cancelarTrabajo del backend: el trabajador elegido puede cancelar
export async function cancelarTrabajoAgendado(presupuestoId) {
  const usuario = usuarioActual();
  const datos = leer();
  const pr = datos.presupuestos.find((x) => x.id === String(presupuestoId));
  const problema = pr && datos.problemas.find((p) => p.id === pr.solicitudid);
  if (!pr || !problema || pr.trabajadorid !== usuario.id) throw error("Ese presupuesto no existe o no es tuyo.", 404);
  if (pr.estado !== "aceptado" || problema.estado !== "pendiente") throw error("Ese trabajo no está agendado.");
  pr.estado = "cancelado";
  problema.estado = "cancelado";
  problema.actualizado = ahora();
  agregarNotificacionLocal(problema.contratadorid, {
    contenido: `${pr.trabajador.nombre} canceló el trabajo "${problema.titulo}". Podés volver a publicarlo.`,
    enlace: `/mis-problemas?ver=${problema.id}`,
  });
  guardar(datos);
  return { cancelado: true };
}
