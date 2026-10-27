// Datos y utilidades de "problemas": lo que publica un cliente para que un
// trabajador agende una cita y lo vaya a arreglar.
//
// En el backend un problema es una fila de `solicitudes` con dirigida = false:
//  · solicitud: el texto (acá le damos formato, ver armarTextoProblema)
//  · periodo: [fechaInicio, fechaFin]  ("YYYY-MM-DD")
//  · diassemana: 7 booleanos, de Lunes (0) a Domingo (6)
//  · localidad: la zona · aptitudid: la categoría
// Cuando un trabajador agenda, el backend lo pone en estado "pendiente",
// con su trabajadorid y periodo = [día, día].

export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const FRANJAS = {
  manana: { etiqueta: "Mañana", detalle: "8 a 12 hs" },
  tarde: { etiqueta: "Tarde", detalle: "13 a 17 hs" },
  noche: { etiqueta: "Tarde/Noche", detalle: "17 a 21 hs" },
  todo: { etiqueta: "Cualquier horario", detalle: "8 a 21 hs" },
};

export const URGENCIAS = {
  urgente: { etiqueta: "Urgente", detalle: "Lo necesito cuanto antes" },
  semana: { etiqueta: "Esta semana", detalle: "En los próximos días" },
  flexible: { etiqueta: "Sin apuro", detalle: "Tengo flexibilidad" },
};

// solicitudes.estado (+ "vencido", que se calcula acá)
export const ESTADOS_PROBLEMA = {
  "por revisar": { etiqueta: "Esperando un trabajador", tono: "abierto" },
  pendiente: { etiqueta: "Cita agendada", tono: "agendado" },
  terminada: { etiqueta: "Terminado", tono: "terminado" },
  cancelado: { etiqueta: "Cancelado", tono: "cancelado" },
  vencido: { etiqueta: "Sin fechas disponibles", tono: "vencido" },
};

/* ---------------- texto del problema ---------------- */

const ETIQUETAS_TEXTO = { Horario: "franja", Barrio: "barrio", Urgencia: "urgencia" };

/**
 * Arma el texto que se guarda en solicitudes.solicitud:
 *   Título
 *   Horario: Mañana (8 a 12 hs)
 *   Barrio: Palermo            (opcional)
 *   Urgencia: Esta semana      (opcional)
 *   Detalle...
 * Así se lee bien también en las pantallas que muestran la solicitud tal cual.
 */
export function armarTextoProblema({ titulo, franja, barrio, urgencia, descripcion }) {
  const lineas = [String(titulo).trim()];
  if (FRANJAS[franja]) lineas.push(`Horario: ${FRANJAS[franja].etiqueta} (${FRANJAS[franja].detalle})`);
  if (barrio && barrio.trim()) lineas.push(`Barrio: ${barrio.trim()}`);
  if (URGENCIAS[urgencia]) lineas.push(`Urgencia: ${URGENCIAS[urgencia].etiqueta}`);
  lineas.push(String(descripcion || "").trim());
  return lineas.join("\n");
}

/** Lee un texto armado con armarTextoProblema (o cualquier texto libre). */
export function leerTextoProblema(texto) {
  const lineas = String(texto || "").split("\n").map((l) => l.trim());
  const datos = { titulo: "", franja: "", barrio: "", urgencia: "", descripcion: "" };
  if (lineas.length < 2) {
    // Texto libre (ej: solicitudes viejas): el título es el comienzo
    const solo = lineas[0] || "";
    datos.titulo = solo.length > 70 ? `${solo.slice(0, 67).trim()}…` : solo;
    datos.descripcion = solo;
    return datos;
  }
  datos.titulo = lineas[0];
  const resto = [];
  for (const linea of lineas.slice(1)) {
    const m = linea.match(/^(Horario|Barrio|Urgencia):\s*(.*)$/);
    if (m && !datos[ETIQUETAS_TEXTO[m[1]]]) {
      const campo = ETIQUETAS_TEXTO[m[1]];
      if (campo === "franja") datos.franja = Object.keys(FRANJAS).find((k) => m[2].startsWith(FRANJAS[k].etiqueta + " (")) || "";
      else if (campo === "urgencia") datos.urgencia = Object.keys(URGENCIAS).find((k) => URGENCIAS[k].etiqueta === m[2]) || "";
      else datos.barrio = m[2];
    } else {
      resto.push(linea);
    }
  }
  datos.descripcion = resto.join("\n").trim();
  return datos;
}

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

// Saca las fechas de lo que venga del backend: array, "{2026-10-01,2026-10-05}", ISO, etc.
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

/** Fechas en las que se puede agendar: dentro del período, en los días elegidos y de hoy en adelante. */
export function fechasPosibles({ periodo, diassemana }, { desdeHoy = true } = {}) {
  const [inicio, fin] = normalizarPeriodo(periodo);
  if (!inicio || !fin) return [];
  const dias = normalizarDiasSemana(diassemana);
  const hoy = hoyStr();
  const resultado = [];
  let actual = inicio;
  for (let i = 0; i <= 120 && actual <= fin; i++) {
    if (dias[indiceDiaSemana(actual)] && (!desdeHoy || actual >= hoy)) resultado.push(actual);
    actual = sumarDias(actual, 1);
  }
  return resultado;
}

/* ---------------- textos ---------------- */

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

/**
 * Estado a mostrar: un problema abierto sin fechas futuras queda "vencido" y uno
 * agendado cuyo día ya pasó, "terminada" (el cron revisarTerminadas hace lo mismo en la base).
 */
export function estadoVisible(problema) {
  if (problema.estado === "por revisar" && fechasPosibles(problema).length === 0) return "vencido";
  if (problema.estado === "pendiente") {
    const dia = normalizarPeriodo(problema.periodo)[1];
    if (dia && dia < hoyStr()) return "terminada";
  }
  return problema.estado;
}
