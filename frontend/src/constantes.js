// Listados compartidos entre páginas.

// Las zonas (y sus barrios) viven en zonas.js: es el único lugar donde se definen.
export { ZONAS } from "./zonas";

// Pasa a minúsculas y saca los acentos, para comparar textos sin importar
// cómo los escribió el usuario ("Jardineria" == "Jardinería").
export function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Mismas categorías que "Ofrecer servicios" (los trabajadores eligen de esta lista).
export const CATEGORIAS = [
  "Electricidad", "Plomería", "Jardinería", "Pintura", "Mudanza",
  "Limpieza", "Carpintería", "Albañilería", "Gasista", "Piletero",
  "Herrería", "Cerrajería", "Informática", "Aire acondicionado", "Soldadura",
];
