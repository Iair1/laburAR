// Listados compartidos entre páginas.

// Debe coincidir con las localidades que se guardan en la tabla "usuarios"
// (mismo listado que usan OfrecerServicios.jsx y Paso1.jsx).
export const ZONAS = [
  "CABA", "GBA Norte", "GBA Sur", "GBA Oeste", "Córdoba Capital",
  "Rosario", "Mendoza Capital", "La Plata", "Mar del Plata", "Tucumán",
  "Salta Capital", "Santa Fe Capital", "Neuquén Capital", "Bahía Blanca",
];

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
