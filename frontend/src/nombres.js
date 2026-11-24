// nombres.js
// Cómo se nombra a alguien en textos cortos ("¿Cómo te fue con Juan?", "Mandale un mensaje a…"):
// a una persona por su nombre de pila y a una empresa por su nombre entero
// ("El Taller del Sur", no "El").

/**
 * @param {string} nombre nombre completo
 * @param {boolean} [esEmpresa] true si es la cuenta de una empresa
 * @param {string} [reemplazo] lo que se muestra si no hay nombre
 */
export function nombreCorto(nombre, esEmpresa = false, reemplazo = "") {
  const limpio = String(nombre || "").trim();
  if (!limpio) return reemplazo;
  return esEmpresa === true ? limpio : limpio.split(/\s+/)[0];
}

/** Lo mismo, a partir de un objeto { nombre, esEmpresa } (el otro usuario, el cliente, el trabajador…). */
export const nombreCortoDe = (persona, reemplazo = "") => nombreCorto(persona?.nombre, persona?.esEmpresa, reemplazo);

/** true si una fila del backend dice que es empresa (columna es_empresa o la que se indique). */
export const filaEsEmpresa = (fila, columna = "es_empresa") => fila?.[columna] === true;
