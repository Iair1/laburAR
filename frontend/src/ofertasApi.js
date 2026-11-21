// ofertasApi.js
// Propuestas de precio para los problemas publicados (router /api/ofertas).
//
//  · el trabajador propone ......... POST /ofertas/nueva          { solicitudid, dia, hora, precio, mensaje }
//  · sus propuestas ................ GET  /ofertas/mias
//  · las que recibe el cliente ..... GET  /ofertas/recibidas
//  · aceptar el precio vigente ..... POST /ofertas/aceptar        { ofertaid }   → la cita queda agendada
//  · contraoferta .................. POST /ofertas/contraofertar  { ofertaid, precio, mensaje }
//  · rechazar / retirar ............ POST /ofertas/rechazar       { ofertaid, eliminarPublicacion }
//
// La propuesta va y viene: `turno` dice a quién le toca responder ("cliente" o "trabajador").
// El pago lo arreglan entre ellos: LaburAR no cobra ni intermedia.
import { pedirAlServidor, avisarCambio } from "./servidor";
import { normalizarPeriodo, normalizarDiasSemana, leerTextoProblema, fechaLarga } from "./problemasDatos";

export const EVENTO_OFERTAS = "laburar-ofertas-cambio";
export const PRECIO_MINIMO = 100;
export const PRECIO_MAXIMO = 100000000;

const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
/** 25000 → "$ 25.000" */
export function formatearPesos(monto) {
  return formato.format(Number(monto) || 0).replace(/\u00a0/g, " ");
}

/** "Sábado 22 de noviembre · 10:00 hs" */
export const textoCuando = (dia, hora) => `${fechaLarga(dia)}${hora ? ` · ${hora} hs` : ""}`;

/** Lee lo que escribe la persona ("25.000", "$25000", "25000") y devuelve el número, o null. */
export function leerPesos(texto) {
  const limpio = String(texto ?? "").replace(/[$\s.]/g, "").replace(/,\d*$/, "");
  if (!/^\d+$/.test(limpio)) return null;
  return Number(limpio);
}

/** Mientras escribe: "25000" → "25.000" (sin decimales) */
export function mostrarPesosEscritos(texto) {
  const numero = leerPesos(texto);
  return numero === null ? String(texto ?? "").replace(/[^\d]/g, "") : numero.toLocaleString("es-AR");
}

/** Revisa un precio antes de mandarlo. Devuelve el mensaje de error o "". */
export function errorDePrecio(precio) {
  if (precio === null || precio === undefined || precio === "") return "Poné el precio en pesos.";
  if (!Number.isInteger(precio)) return "El precio tiene que ser un número entero de pesos.";
  if (precio < PRECIO_MINIMO) return `El precio mínimo es ${formatearPesos(PRECIO_MINIMO)}.`;
  if (precio > PRECIO_MAXIMO) return "Ese precio es demasiado alto. Revisalo.";
  return "";
}

const fechaTexto = (valor) => String(valor || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;

/** Convierte una fila de /ofertas/mias o /ofertas/recibidas en un objeto para la UI. */
export function aOferta(fila) {
  const texto = fila.solicitud ? leerTextoProblema(fila.solicitud) : null;
  return {
    id: fila.id,
    solicitudid: fila.solicitudid,
    dia: fechaTexto(fila.dia_texto || fila.dia),
    hora: fila.hora || null,
    precio: Number(fila.precio),
    mensaje: fila.mensaje || "",
    titulo: fila.titulo || texto?.titulo || "Problema",
    estado: fila.estado,
    turno: fila.turno,
    rechazadaPor: fila.rechazada_por || null,
    vencida: fila.vencida === true,
    fecha: fila.fecha,
    actualizada: fila.actualizada,
    historial: (fila.historial || []).map((h) => ({ ...h, precio: h.precio === null ? null : Number(h.precio) })),
    trabajador: fila.trabajador_nombre
      ? {
          id: fila.trabajadorid,
          nombre: fila.trabajador_nombre,
          foto: fila.trabajador_foto || null,
          puntuacion: fila.puntuacion_trabajador,
          verificado: fila.verificado === true,
        }
      : { id: fila.trabajadorid, nombre: "Trabajador", foto: null },
    cliente: fila.cliente_nombre
      ? { id: fila.contratadorid, nombre: fila.cliente_nombre, foto: fila.cliente_foto || null, puntuacion: fila.puntuacion_contratador }
      : { id: fila.contratadorid, nombre: "Cliente", foto: null },
    // Lo que se sabe del problema (solo en /mias; null si el cliente lo borró)
    problema: fila.estado_problema
      ? {
          estado: fila.estado_problema,
          categoria: fila.aptitud || "",
          localidad: fila.localidad || "",
          barrio: texto?.barrio || "",
          franja: texto?.franja || "",
          descripcion: texto?.descripcion || "",
          periodo: normalizarPeriodo(fila.periodo),
          diassemana: normalizarDiasSemana(fila.diassemana),
        }
      : null,
  };
}

/**
 * Estado de una propuesta visto por `rol` ("cliente" o "trabajador"):
 * { clave, etiqueta, tono, meToca }
 */
export function estadoDeOferta(oferta, rol) {
  if (oferta.estado === "aceptada") return { clave: "aceptada", etiqueta: "Aceptada · cita agendada", tono: "bien" };
  if (oferta.estado === "rechazada") {
    const porMi = oferta.rechazadaPor === rol;
    return { clave: "rechazada", etiqueta: porMi ? "La rechazaste" : rol === "cliente" ? "Rechazó tu contraoferta" : "El cliente la rechazó", tono: "mal" };
  }
  if (oferta.estado === "retirada") return { clave: "retirada", etiqueta: rol === "trabajador" ? "La retiraste" : "La retiró", tono: "neutro" };
  if (oferta.estado === "cerrada") {
    return { clave: "cerrada", etiqueta: rol === "trabajador" ? "Cerrada: el problema ya no está disponible" : "Cerrada", tono: "neutro" };
  }
  if (oferta.vencida) return { clave: "vencida", etiqueta: "El día propuesto ya pasó", tono: "neutro" };
  const meToca = oferta.turno === rol;
  if (rol === "cliente") {
    return meToca
      ? { clave: "responder", etiqueta: oferta.historial.length > 1 ? "Te respondió: revisala" : "Nueva propuesta", tono: "nuevo", meToca }
      : { clave: "esperando", etiqueta: "Esperando su respuesta", tono: "espera", meToca };
  }
  return meToca
    ? { clave: "responder", etiqueta: "Te hicieron una contraoferta", tono: "nuevo", meToca }
    : { clave: "esperando", etiqueta: "Esperando respuesta del cliente", tono: "espera", meToca };
}

/** Texto de cada paso del ida y vuelta, visto por `rol`. */
export function textoPaso(paso, rol, nombres = {}) {
  const yo = paso.rol === rol;
  const quien = yo ? "Vos" : paso.rol === "cliente" ? nombres.cliente || "El cliente" : nombres.trabajador || "El trabajador";
  const monto = paso.precio ? formatearPesos(paso.precio) : "";
  switch (paso.accion) {
    case "propuesta":
      return `${quien} ${yo ? "propusiste" : "propuso"} ${monto}`;
    case "contraoferta":
      return `${quien} ${yo ? "contraofertaste" : "contraofertó"} ${monto}`;
    case "aceptada":
      return `${quien} ${yo ? "aceptaste" : "aceptó"} ${monto}`;
    case "rechazada":
      return `${quien} ${yo ? "rechazaste" : "rechazó"}`;
    case "retirada":
      return `${quien} ${yo ? "retiraste" : "retiró"} la propuesta`;
    case "cerrada":
      return "Se cerró";
    default:
      return paso.accion;
  }
}

export async function mandarPropuesta({ solicitudid, dia, hora, precio, mensaje }) {
  const resultado = await pedirAlServidor("/ofertas/nueva", "POST", { solicitudid, dia, hora, precio, mensaje: mensaje || undefined });
  avisarCambio(EVENTO_OFERTAS);
  return resultado.result;
}

export async function obtenerMisPropuestas() {
  const resultado = await pedirAlServidor("/ofertas/mias");
  return (resultado.result || []).map(aOferta);
}

export async function obtenerPropuestasRecibidas() {
  const resultado = await pedirAlServidor("/ofertas/recibidas");
  return (resultado.result || []).map(aOferta);
}

export async function aceptarPropuesta(ofertaid) {
  const resultado = await pedirAlServidor("/ofertas/aceptar", "POST", { ofertaid });
  avisarCambio(EVENTO_OFERTAS);
  return resultado.result;
}

export async function contraofertar(ofertaid, precio, mensaje) {
  const resultado = await pedirAlServidor("/ofertas/contraofertar", "POST", { ofertaid, precio, mensaje: mensaje || undefined });
  avisarCambio(EVENTO_OFERTAS);
  return resultado.result;
}

export async function rechazarPropuesta(ofertaid, { eliminarPublicacion = false, mensaje } = {}) {
  const resultado = await pedirAlServidor("/ofertas/rechazar", "POST", { ofertaid, eliminarPublicacion, mensaje: mensaje || undefined });
  avisarCambio(EVENTO_OFERTAS);
  return resultado.result;
}
