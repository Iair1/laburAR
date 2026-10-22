// Datos y utilidades compartidas de "problemas" (lo que publica un cliente)
// y "presupuestos" (lo que le mandan los trabajadores).
//
// Los campos siguen el modelo del backend:
//  - un problema es una fila de `solicitudes` con dirigida = false
//    · periodo: [fechaInicio, fechaFin]  ("YYYY-MM-DD")
//    · diassemana: 7 booleanos, de Lunes (0) a Domingo (6) — igual que en aceptarSolicitud
//  - un presupuesto es una fila de `aplicaciones` (trabajador + solicitud + periodo [dia, dia])

export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const FRANJAS = {
  manana: { etiqueta: "Mañana", detalle: "8 a 12 hs", desde: "08:00", hasta: "12:00" },
  tarde: { etiqueta: "Tarde", detalle: "13 a 17 hs", desde: "13:00", hasta: "17:00" },
  noche: { etiqueta: "Tarde/Noche", detalle: "17 a 21 hs", desde: "17:00", hasta: "21:00" },
  todo: { etiqueta: "Cualquier horario", detalle: "8 a 21 hs", desde: "08:00", hasta: "21:00" },
};

export const URGENCIAS = {
  urgente: { etiqueta: "Urgente", detalle: "Lo necesito cuanto antes" },
  semana: { etiqueta: "Esta semana", detalle: "En los próximos días" },
  flexible: { etiqueta: "Sin apuro", detalle: "Tengo flexibilidad" },
};

// Estados que guarda el backend en solicitudes.estado (+ dos que se calculan acá)
export const ESTADOS_PROBLEMA = {
  "por revisar": { etiqueta: "Recibiendo presupuestos", tono: "abierto" },
  pendiente: { etiqueta: "Agendado", tono: "agendado" },
  terminada: { etiqueta: "Terminado", tono: "terminado" },
  cancelado: { etiqueta: "Cancelado", tono: "cancelado" },
  vencido: { etiqueta: "Sin fechas disponibles", tono: "vencido" },
};

export const ESTADOS_PRESUPUESTO = {
  enviado: { etiqueta: "Esperando respuesta", tono: "abierto" },
  aceptado: { etiqueta: "¡Te eligieron!", tono: "agendado" },
  rechazado: { etiqueta: "No fue elegido", tono: "cancelado" },
  retirado: { etiqueta: "Retirado", tono: "vencido" },
  cancelado: { etiqueta: "Cancelado", tono: "cancelado" },
};

export const DURACIONES = [
  "Menos de 1 hora",
  "1 a 2 horas",
  "2 a 4 horas",
  "Medio día",
  "1 día",
  "Más de 1 día",
];

export const MATERIALES = {
  incluidos: "Materiales incluidos",
  no_incluidos: "Materiales aparte",
  a_convenir: "Materiales a convenir",
};

export const MAXIMO_FOTOS_PROBLEMA = 4;

/* ---------------- fechas ---------------- */

export function aFechaStr(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function aFechaLocal(fechaStr) {
  const [y, m, d] = String(fechaStr).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hoyStr() {
  return aFechaStr(new Date());
}

export function sumarDias(fechaStr, dias) {
  const fecha = aFechaLocal(fechaStr);
  fecha.setDate(fecha.getDate() + dias);
  return aFechaStr(fecha);
}

// Índice en diassemana (0 = Lunes ... 6 = Domingo)
export function indiceDiaSemana(fechaStr) {
  return (aFechaLocal(fechaStr).getDay() + 6) % 7;
}

// Saca las fechas de lo que venga del backend: array, "{2026-10-01,2026-10-05}", etc.
export function normalizarPeriodo(periodo) {
  const texto = Array.isArray(periodo) ? periodo.join(",") : String(periodo || "");
  const fechas = texto.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (fechas.length === 0) return [null, null];
  return [fechas[0], fechas[fechas.length - 1]];
}

export function normalizarDiasSemana(diassemana) {
  if (Array.isArray(diassemana) && diassemana.length === 7) return diassemana.map(Boolean);
  if (typeof diassemana === "string") {
    const valores = diassemana.replace(/[{}]/g, "").split(",").map((v) => v.trim());
    if (valores.length === 7) return valores.map((v) => v === "t" || v === "true");
  }
  return [true, true, true, true, true, true, true];
}

const MAXIMO_DIAS_PERIODO = 120;

/**
 * Fechas en las que el trabajador puede ir: dentro del período, en los días de
 * la semana elegidos y (por defecto) de hoy en adelante.
 */
export function fechasPosibles({ periodo, diassemana }, { desdeHoy = true } = {}) {
  const [inicio, fin] = normalizarPeriodo(periodo);
  if (!inicio || !fin) return [];
  const dias = normalizarDiasSemana(diassemana);
  const hoy = hoyStr();
  const resultado = [];
  let actual = inicio;
  for (let i = 0; i <= MAXIMO_DIAS_PERIODO && actual <= fin; i++) {
    if (dias[indiceDiaSemana(actual)] && (!desdeHoy || actual >= hoy)) resultado.push(actual);
    actual = sumarDias(actual, 1);
  }
  return resultado;
}

// Horarios de llegada posibles dentro de una franja, cada 30 minutos
export function horasDeFranja(franja) {
  const datos = FRANJAS[franja] || FRANJAS.todo;
  const aMinutos = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  const horas = [];
  for (let m = aMinutos(datos.desde); m < aMinutos(datos.hasta); m += 30) {
    horas.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return horas;
}

/* ---------------- textos ---------------- */

export function formatearPesos(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? `$${numero.toLocaleString("es-AR")}` : null;
}

export function fechaCorta(fechaStr) {
  if (!fechaStr) return "";
  return aFechaLocal(fechaStr).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

export function fechaLarga(fechaStr) {
  if (!fechaStr) return "";
  const texto = aFechaLocal(fechaStr).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function textoPeriodo(periodo) {
  const [inicio, fin] = normalizarPeriodo(periodo);
  if (!inicio) return "";
  if (inicio === fin) return fechaCorta(inicio);
  return `${fechaCorta(inicio)} al ${fechaCorta(fin)}`;
}

export function textoDiasSemana(diassemana) {
  const dias = normalizarDiasSemana(diassemana);
  const cantidad = dias.filter(Boolean).length;
  if (cantidad === 7) return "Todos los días";
  if (cantidad === 0) return "Sin días";
  if (dias.slice(0, 5).every(Boolean) && !dias[5] && !dias[6]) return "Lun a Vie";
  if (!dias.slice(0, 5).some(Boolean) && dias[5] && dias[6]) return "Fines de semana";
  return DIAS_CORTOS.filter((_, i) => dias[i]).join(", ");
}

export function textoFranja(franja) {
  const datos = FRANJAS[franja];
  return datos ? `${datos.etiqueta} (${datos.detalle})` : "";
}

export function tiempoRelativo(fechaISO) {
  if (!fechaISO) return "";
  const segundos = Math.max(0, (Date.now() - new Date(fechaISO).getTime()) / 1000);
  if (segundos < 60) return "recién";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
  return new Date(fechaISO).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/**
 * Estado a mostrar: además del que guarda el backend, marca como "vencido" un problema
 * abierto sin fechas futuras y como "terminada" uno agendado cuyo día ya pasó
 * (el backend hace lo mismo con el cron revisarTerminadas).
 */
export function estadoVisible(problema) {
  if (problema.estado === "por revisar" && fechasPosibles(problema).length === 0) return "vencido";
  if (problema.estado === "pendiente") {
    const dia = problema.agendado?.dia || normalizarPeriodo(problema.periodo)[1];
    if (dia && dia < hoyStr()) return "terminada";
  }
  return problema.estado;
}
