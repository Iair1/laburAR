// notificacionesDatos.js
// Cómo se muestra cada notificación en la campanita: un título corto, una línea de detalle,
// un ícono (o la foto de la otra persona), cuándo llegó y a dónde lleva al tocarla.
//
// Las notificaciones nuevas ya vienen del backend con `titulo` y `enlace`. Las viejas solo
// tienen un texto largo (`contenido`): de ahí se saca un título y un detalle.
import { pedirAlServidor } from "./servidor";

export const EVENTO_ABRIR_RESENA = "laburar-abrir-resena";

// tono: color del ícono (nuevo = bordó, bien = verde, mal = rojo, neutro = gris)
const TIPOS = {
  "oferta-nueva": { icono: "precio", tono: "nuevo" },
  contraoferta: { icono: "precio", tono: "nuevo" },
  "oferta-aceptada": { icono: "check", tono: "bien" },
  "oferta-rechazada": { icono: "cruz", tono: "mal" },
  "oferta-retirada": { icono: "cruz", tono: "neutro" },
  "oferta-cerrada": { icono: "candado", tono: "neutro" },
  "solicitud-nueva": { icono: "pedido", tono: "nuevo" },
  "solicitud-aceptada": { icono: "calendario", tono: "bien" },
  "solicitud-rechazada": { icono: "cruz", tono: "mal" },
  "trabajo-cancelado": { icono: "cruz", tono: "mal" },
  "trabajo-terminado": { icono: "estrella", tono: "nuevo" },
  solicitudes: { icono: "estrella", tono: "nuevo" }, // las viejas que mandaba el sistema al terminar un trabajo
  reseña: { icono: "estrella", tono: "bien" },
  verificacion: { icono: "escudo", tono: "bien" },
};

const recortar = (texto, largo) => {
  const t = String(texto || "").trim();
  return t.length > largo ? `${t.slice(0, largo - 1).trim()}…` : t;
};

// El título de una solicitud a partir de su texto (sin "Horario preferido: ..." ni "Barrio: ...")
function tituloDeTexto(texto) {
  const limpio = String(texto || "")
    .replace(/^\s*Horario preferido:[^.\n]*\.\s*/i, "")
    .replace(/^\s*Barrio:[^.\n]*\.\s*/i, "");
  return recortar(limpio.split("\n")[0], 50);
}

/** Saca título y detalle del texto largo de una notificación vieja. */
function leerVieja(n) {
  const lineas = String(n.contenido || "").split("\n").map((l) => l.trim()).filter(Boolean);
  let titulo = lineas[0] || "Tenés una novedad";
  let detalle = "";
  const trabajo = lineas.map((l) => l.match(/^(?:Solicitud|Problema):\s*(.*)$/)?.[1]).find(Boolean);
  const dia = lineas.map((l) => l.match(/^Día:\s*(.*)$/)?.[1]).find(Boolean);

  const reemplazos = [
    [/^Su solicitud ha sido aceptada por el trabajador/i, "Aceptaron tu solicitud"],
    [/^Su solicitud ha sido rechazada por el trabajador/i, "Rechazaron tu solicitud"],
    [/^El trabajo ha sido cancelado por el usuario/i, "Se canceló una cita"],
    [/^Su tabajo con (.+?) sido marcada como terminada por el sistema/i, "Terminó tu trabajo con $1"],
    [/^(.+?) marcó el trabajo como terminado\..*$/i, "$1 marcó el trabajo como terminado"],
    [/^¡Listo! Verificamos tu identidad\..*$/i, "Verificamos tu identidad"],
  ];
  for (const [patron, nuevo] of reemplazos) {
    if (patron.test(titulo)) {
      titulo = titulo.replace(patron, nuevo);
      break;
    }
  }
  // "Juan te dejó una reseña: ★★★★☆" + la reseña entre comillas
  const resena = titulo.match(/^(.+? te dejó una reseña):\s*(.*)$/);
  if (resena) {
    titulo = resena[1];
    detalle = [resena[2], lineas[1]].filter(Boolean).join(" ");
  } else {
    detalle = [trabajo ? `«${tituloDeTexto(trabajo)}»` : "", dia || ""].filter(Boolean).join(" · ");
  }
  return { titulo: recortar(titulo, 90), detalle };
}

// A dónde llevaban las notificaciones viejas (no tenían enlace guardado)
function enlaceViejo(n) {
  const texto = String(n.contenido || "");
  switch (n.tipo) {
    case "solicitud-aceptada":
      return /problema/i.test(texto) ? "/mis-problemas" : "/mis-pedidos?vista=aceptados";
    case "solicitud-rechazada":
      return "/mis-pedidos";
    case "trabajo-terminado":
    case "solicitudes":
      return "resena:";
    case "reseña":
      return "/mi-cuenta#resenas";
    case "verificacion":
      return "/mi-cuenta#identidad";
    default:
      return null;
  }
}

/** "Ahora", "Hace 5 min", "Hace 3 h", "Ayer", "Hace 4 días" o la fecha. */
export function tiempoRelativo(valor, ahora = Date.now()) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const minutos = Math.floor((ahora - fecha.getTime()) / 60000);
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/**
 * Lo que muestra la campanita de una notificación:
 * { clave, id, titulo, detalle, enlace, icono, tono, foto, nombre, fecha, leida }
 * `leida` es null si la base todavía no guarda las leídas (entonces se usan las del navegador).
 */
export function presentarNotificacion(n, clave) {
  const tipo = TIPOS[n.tipo] || { icono: "campana", tono: "neutro" };
  const vieja = !n.titulo;
  const { titulo, detalle } = vieja ? leerVieja(n) : { titulo: n.titulo, detalle: n.contenido || "" };
  return {
    clave,
    id: n.id ?? null,
    titulo,
    detalle: recortar(String(detalle).replace(/\s*\n\s*/g, " · "), 110),
    enlace: n.enlace || (vieja ? enlaceViejo(n) : null),
    icono: tipo.icono,
    tono: tipo.tono,
    foto: n.otro_foto || null,
    nombre: n.otro_nombre || null,
    fecha: n.fecha || n.created_at || null,
    leida: typeof n.leida === "boolean" ? n.leida : null,
  };
}

/** Marca como leídas en la base todas las notificaciones (o solo las de `ids`). */
export async function marcarLeidasEnServidor(ids) {
  return pedirAlServidor("/usuarios/leerNotificaciones", "PUT", ids ? { ids } : {});
}

/** Abre la ventana para dejar la reseña de un trabajo (la escucha AvisoResenasPendientes). */
export function abrirResena(trabajo) {
  window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_RESENA, { detail: { trabajo: trabajo || null } }));
}
