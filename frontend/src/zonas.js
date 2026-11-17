// zonas.js
// Sistema único de zonas de LaburAR: lo usan el registro, "Ofrecer servicios",
// "Mis servicios", "Subir un problema", "Agendar" y todos los filtros.
//
// Cómo se guarda (no cambia nada en la base):
//  · usuarios.localidad y solicitudes.localidad guardan el id de la ZONA ("CABA", "GBA Norte"...)
//  · el BARRIO (opcional) va aparte: en los problemas, en el texto ("Barrio: Palermo")
// Así los filtros comparan siempre los mismos valores.

export const REGIONES = [
  {
    id: "CABA",
    provincia: "Ciudad de Buenos Aires",
    barrios: [
      "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita",
      "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers",
      "Mataderos", "Monte Castro", "Montserrat", "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda",
      "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro",
      "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sarsfield", "Versalles",
      "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano",
      "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo",
      "Villa Santa Rita", "Villa Soldati", "Villa Urquiza",
    ],
  },
  {
    id: "GBA Norte",
    provincia: "Buenos Aires",
    barrios: [
      "Vicente López", "Olivos", "Florida", "Munro", "La Lucila", "San Isidro", "Martínez", "Acassuso",
      "Béccar", "Boulogne", "San Fernando", "Victoria", "Tigre", "Don Torcuato", "General Pacheco",
      "Nordelta", "Escobar", "Pilar", "Del Viso", "Malvinas Argentinas", "Grand Bourg", "José C. Paz",
      "San Miguel", "Bella Vista", "General San Martín", "Villa Ballester", "San Andrés",
    ],
  },
  {
    id: "GBA Oeste",
    provincia: "Buenos Aires",
    barrios: [
      "Tres de Febrero", "Caseros", "Ciudadela", "Morón", "Castelar", "Haedo", "Hurlingham", "Ituzaingó",
      "La Matanza", "San Justo", "Ramos Mejía", "Isidro Casanova", "González Catán", "Merlo", "Padua",
      "Moreno", "General Rodríguez", "Luján",
    ],
  },
  {
    id: "GBA Sur",
    provincia: "Buenos Aires",
    barrios: [
      "Avellaneda", "Wilde", "Lanús", "Remedios de Escalada", "Lomas de Zamora", "Banfield", "Temperley",
      "Quilmes", "Bernal", "Berazategui", "Florencio Varela", "Almirante Brown", "Adrogué", "Burzaco",
      "Esteban Echeverría", "Monte Grande", "Ezeiza", "Presidente Perón", "San Vicente", "Cañuelas",
    ],
  },
  {
    id: "La Plata",
    provincia: "Buenos Aires",
    barrios: ["La Plata Centro", "City Bell", "Gonnet", "Tolosa", "Los Hornos", "Villa Elisa", "Gorina", "Berisso", "Ensenada"],
  },
  {
    id: "Mar del Plata",
    provincia: "Buenos Aires",
    barrios: ["Mar del Plata Centro", "La Perla", "Playa Grande", "Los Troncos", "Punta Mogotes", "Chauvín", "San Carlos", "Batán", "Sierra de los Padres"],
  },
  {
    id: "Bahía Blanca",
    provincia: "Buenos Aires",
    barrios: ["Bahía Blanca Centro", "Villa Mitre", "Palihue", "Universitario", "Villa Rosas", "Ingeniero White", "Punta Alta"],
  },
  {
    id: "Córdoba Capital",
    provincia: "Córdoba",
    barrios: [
      "Córdoba Centro", "Nueva Córdoba", "General Paz", "Alberdi", "Güemes", "Alta Córdoba", "Cerro de las Rosas",
      "Argüello", "Villa Belgrano", "Jardín", "Cofico", "Villa Allende", "Villa Carlos Paz",
    ],
  },
  {
    id: "Rosario",
    provincia: "Santa Fe",
    barrios: ["Rosario Centro", "Pichincha", "Echesortu", "Fisherton", "Alberdi (Rosario)", "Abasto", "República de la Sexta", "Arroyito", "Funes", "Granadero Baigorria"],
  },
  {
    id: "Santa Fe Capital",
    provincia: "Santa Fe",
    barrios: ["Santa Fe Centro", "Candioti", "Guadalupe", "Barrio Sur (Santa Fe)", "Barranquitas", "Santo Tomé", "Recreo"],
  },
  {
    id: "Mendoza Capital",
    provincia: "Mendoza",
    barrios: ["Mendoza Centro", "Godoy Cruz", "Guaymallén", "Las Heras", "Luján de Cuyo", "Maipú", "Chacras de Coria"],
  },
  {
    id: "Tucumán",
    provincia: "Tucumán",
    barrios: ["San Miguel de Tucumán Centro", "Barrio Norte (Tucumán)", "Barrio Sur (Tucumán)", "Yerba Buena", "Tafí Viejo", "Banda del Río Salí"],
  },
  {
    id: "Salta Capital",
    provincia: "Salta",
    barrios: ["Salta Centro", "Tres Cerritos", "Castañares", "Limache", "San Lorenzo (Salta)", "Vaqueros"],
  },
  {
    id: "Neuquén Capital",
    provincia: "Neuquén",
    barrios: ["Neuquén Centro", "Santa Genoveva", "Plottier", "Centenario", "Cipolletti"],
  },
];

/** Ids de las zonas (los mismos de siempre: se guardan así en la base). */
export const ZONAS = REGIONES.map((r) => r.id);

const REGION_POR_ID = Object.fromEntries(REGIONES.map((r) => [r.id, r]));

// Pasa a minúsculas y saca acentos/signos para comparar ("Núñez" == "nunez")
export function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Otras formas en que la gente escribe una zona
const ALIAS = {
  "caba": "CABA",
  "capital": "CABA",
  "capital federal": "CABA",
  "ciudad de buenos aires": "CABA",
  "ciudad autonoma de buenos aires": "CABA",
  "buenos aires": "CABA",
  "zona norte": "GBA Norte",
  "gba norte": "GBA Norte",
  "conurbano norte": "GBA Norte",
  "zona oeste": "GBA Oeste",
  "gba oeste": "GBA Oeste",
  "zona sur": "GBA Sur",
  "gba sur": "GBA Sur",
  "la plata": "La Plata",
  "mar del plata": "Mar del Plata",
  "mdp": "Mar del Plata",
  "bahia blanca": "Bahía Blanca",
  "cordoba": "Córdoba Capital",
  "cordoba capital": "Córdoba Capital",
  "rosario": "Rosario",
  "santa fe": "Santa Fe Capital",
  "santa fe capital": "Santa Fe Capital",
  "mendoza": "Mendoza Capital",
  "mendoza capital": "Mendoza Capital",
  "tucuman": "Tucumán",
  "san miguel de tucuman": "Tucumán",
  "salta": "Salta Capital",
  "salta capital": "Salta Capital",
  "neuquen": "Neuquén Capital",
  "neuquen capital": "Neuquén Capital",
};

// Cada barrio apunta a su zona ("palermo" → CABA)
const ZONA_POR_BARRIO = {};
for (const r of REGIONES) {
  for (const b of r.barrios) ZONA_POR_BARRIO[normalizar(b)] = r.id;
}
for (const r of REGIONES) ZONA_POR_BARRIO[normalizar(r.id)] = r.id;

/**
 * Devuelve el id de zona que corresponde a un texto cualquiera ("Capital Federal",
 * "CABA", "Palermo", "Palermo, CABA"...) o "" si no lo reconoce.
 */
export function normalizarZona(texto) {
  if (!texto) return "";
  if (REGION_POR_ID[texto]) return texto;
  const limpio = normalizar(texto);
  if (ALIAS[limpio]) return ALIAS[limpio];
  if (ZONA_POR_BARRIO[limpio]) return ZONA_POR_BARRIO[limpio];
  // "Palermo, CABA" / "Tigre - GBA Norte": probamos cada parte, empezando por la última
  const partes = String(texto).split(/[,\-–/|]/).map((x) => normalizar(x)).filter(Boolean).reverse();
  for (const parte of partes) {
    if (ALIAS[parte]) return ALIAS[parte];
    if (ZONA_POR_BARRIO[parte]) return ZONA_POR_BARRIO[parte];
  }
  return "";
}

/** Nombre del barrio tal como figura en la lista (o el texto tal cual si no está). */
export function normalizarBarrio(barrio, zona = "") {
  if (!barrio) return "";
  const limpio = normalizar(barrio);
  const regiones = zona && REGION_POR_ID[zona] ? [REGION_POR_ID[zona]] : REGIONES;
  for (const r of regiones) {
    const encontrado = r.barrios.find((b) => normalizar(b) === limpio);
    if (encontrado) return encontrado;
  }
  return String(barrio).trim();
}

export function barriosDe(zona) {
  return REGION_POR_ID[zona]?.barrios || [];
}

export function provinciaDe(zona) {
  return REGION_POR_ID[zona]?.provincia || "";
}

/** "Palermo, CABA" · "CABA" · "" */
export function textoLugar(zona, barrio) {
  return [barrio, zona].filter(Boolean).join(", ");
}

/** ¿Un lugar (zona/barrio) coincide con el filtro elegido? */
export function coincideLugar({ zona, barrio }, filtro) {
  if (!filtro?.zona) return true;
  if (normalizarZona(zona) !== filtro.zona) return false;
  if (!filtro.barrio) return true;
  return normalizar(barrio) === normalizar(filtro.barrio);
}

/**
 * Busca zonas y barrios que coincidan con lo que escribe la persona.
 * Devuelve [{ zona, barrio }] (barrio vacío = toda la zona), las zonas primero.
 */
export function buscarLugares(texto, { conBarrios = true, limite = 40 } = {}) {
  const q = normalizar(texto);
  if (!q) return REGIONES.map((r) => ({ zona: r.id, barrio: "" }));
  const zonas = [];
  const barrios = [];
  for (const r of REGIONES) {
    const nombreZona = normalizar(`${r.id} ${r.provincia}`);
    const aliasZona = Object.entries(ALIAS).some(([alias, id]) => id === r.id && alias.startsWith(q));
    const coincideZona = nombreZona.includes(q) || aliasZona;
    if (coincideZona) zonas.push({ zona: r.id, barrio: "" });
    for (const b of r.barrios) {
      const nb = normalizar(b);
      if (nb.startsWith(q) || nb.includes(` ${q}`) || (q.length >= 3 && nb.includes(q))) barrios.push({ zona: r.id, barrio: b });
    }
  }
  // Los barrios que empiezan con lo escrito, primero
  barrios.sort((a, b) => Number(!normalizar(a.barrio).startsWith(q)) - Number(!normalizar(b.barrio).startsWith(q)) || a.barrio.localeCompare(b.barrio, "es"));
  if (!conBarrios) {
    // Solo zonas: si escribió un barrio ("quilmes"), le sugerimos la zona que lo incluye (GBA Sur)
    const yaEstan = new Set(zonas.map((z) => z.zona));
    for (const b of barrios) {
      if (yaEstan.has(b.zona)) continue;
      yaEstan.add(b.zona);
      zonas.push({ zona: b.zona, barrio: "", via: b.barrio });
    }
    return zonas.slice(0, limite);
  }
  return [...zonas, ...barrios].slice(0, limite);
}

/** Lee ?zona=&barrio= de la URL y devuelve un lugar válido. */
export function lugarDesdeParametros(parametros) {
  const zona = normalizarZona(parametros.get("zona") || "") || normalizarZona(parametros.get("barrio") || "");
  const barrio = zona ? normalizarBarrio(parametros.get("barrio") || "", zona) : "";
  return { zona, barrio: barrio && barriosDe(zona).includes(barrio) ? barrio : "" };
}
