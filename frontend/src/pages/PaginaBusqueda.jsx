import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import AgendarModal from "../componentes/AgendarModal";
import PerfilTrabajadorModal from "../componentes/PerfilTrabajadorModal";
import { obtenerSesionUsuario, cerrarSesionCompleta, agregarAlHistorial } from "../sesion";
import {
  buscarTrabajadores,
  obtenerSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
} from "../api";
import { ZONAS, normalizarTexto } from "../constantes";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-busqueda {
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    margin: 0;
  }

  /* --- buscador dentro de la barra de navegación --- */
  .buscador-nav {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 999px;
    height: 38px;
    width: 100%;
    max-width: 440px;
    padding-left: 14px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
  }
  .buscador-nav svg.lupa { width: 16px; height: 16px; color: #222; flex-shrink: 0; }
  .buscador-nav input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.85rem;
    color: #222;
    min-width: 0;
    padding: 0 10px;
    font-family: inherit;
  }
  .buscador-nav input::placeholder { color: #555; }
  .select-barrio-nav {
    height: 38px;
    max-width: 150px;
    padding: 0 30px 0 16px;
    border-radius: 999px;
    border: none;
    background: #570101 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='white' d='M0 2.5h10L5 8.5z'/%3E%3C/svg%3E") no-repeat right 12px center / 9px;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    font-family: inherit;
  }
  .select-barrio-nav option { color: #222; background: #fff; }

  .aviso-login-busqueda {
    max-width: 1180px;
    margin: 1.5rem auto 0;
    padding: 0 2rem;
  }
  .tarjeta-aviso-login {
    background: #fff3cd;
    border: 1px solid #ffe08a;
    border-radius: 10px;
    padding: 0.9rem 1.1rem;
    font-size: 0.85rem;
    color: #6b5300;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .boton-login-aviso {
    background: #570101;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .layout-resultados {
    display: flex;
    align-items: flex-start;
    gap: 1.75rem;
    padding: 1.5rem 2rem 3rem;
    max-width: 1220px;
    margin: 0 auto;
  }

  /* --- panel de filtros --- */
  .panel-filtros {
    width: 260px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 18px;
    padding: 1.1rem;
    position: sticky;
    top: 76px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: calc(100vh - 92px);
    overflow-y: auto;
  }
  .panel-filtros > * { flex-shrink: 0; }
  .caja-filtro {
    border: 1px solid #b9b9b9;
    border-radius: 8px;
    padding: 0.8rem 0.85rem;
  }
  .titulo-caja-filtro {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 0.65rem;
  }
  .caja-resumen { text-align: left; padding: 1rem 1rem 0.85rem; }
  .categoria-resumen { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; }
  .precio-resumen { font-size: 1.15rem; font-weight: 700; color: #1a1a1a; margin: 6px 0 2px; }
  .detalle-resumen { font-size: 0.66rem; color: #666; }
  .separador-resumen { height: 1px; background: #cfcfcf; margin: 10px 0 8px; }
  .ayuda-resumen { font-size: 0.64rem; color: #777; text-align: center; line-height: 1.35; }
  .contador-solicitudes {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #570101;
    color: #fff;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
  }

  .etiqueta-filtro {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 0.4rem;
  }
  .fila-precio { display: flex; align-items: center; gap: 8px; }
  .fila-precio input[type="number"] {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    outline: none;
    font-family: inherit;
  }
  .fila-precio input[type="number"]:focus { border-color: #570101; }
  .guion-precio { color: #999; font-size: 0.8rem; }
  .select-filtro {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    color: #222;
    background: #fff;
    outline: none;
    margin-bottom: 0.65rem;
    font-family: inherit;
  }
  .select-filtro:focus { border-color: #570101; }

  .grilla-fecha-filtro {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .chip-fecha-filtro {
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    color: #1a1a1a;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 7px 6px;
    border-radius: 999px;
    cursor: pointer;
    text-align: center;
    line-height: 1.15;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .chip-fecha-filtro:hover { background: #bdbdbd; }
  .chip-fecha-filtro.activo { background: #7a2a2a; border-color: #570101; color: #fff; }
  .campo-fecha-manual { margin-top: 8px; }
  .campo-fecha-manual input[type="date"] {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    outline: none;
    font-family: inherit;
  }

  .opciones-radio-filtro { display: flex; flex-direction: column; gap: 6px; }
  .opcion-radio-filtro {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.76rem;
    color: #222;
    cursor: pointer;
    user-select: none;
  }
  .opcion-radio-filtro input { position: absolute; opacity: 0; pointer-events: none; }
  .marca-radio {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #b9b9b9;
    border: 1px solid #8f8f8f;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .opcion-radio-filtro input:checked + .marca-radio { background: #7a2a2a; border-color: #570101; }
  .opcion-radio-filtro input:focus-visible + .marca-radio { outline: 2px solid #570101; outline-offset: 2px; }

  .boton-limpiar-filtros {
    width: 100%;
    height: 32px;
    border-radius: 999px;
    border: 1px solid #ccc;
    background: #f5f5f3;
    color: #444;
    font-size: 0.76rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .boton-limpiar-filtros:hover { background: #eaeae8; }

  /* --- columna de resultados --- */
  .columna-resultados { flex: 1; min-width: 0; }
  .pestanas-busqueda { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
  .pestana-busqueda {
    padding: 6px 18px;
    border-radius: 999px;
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    color: #1a1a1a;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .pestana-busqueda:hover { background: #bdbdbd; }
  .pestana-busqueda.activa { background: #7a2a2a; border-color: #570101; color: #fff; }

  .resumen-resultados {
    font-size: 0.82rem;
    color: #444;
    margin-bottom: 1rem;
  }
  .resumen-resultados strong { color: #1a1a1a; }

  .lista-tarjetas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 18px;
  }

  .tarjeta-trabajador {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #9e7d7d;
    border-radius: 12px;
    padding: 16px 16px 14px;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }
  .tarjeta-trabajador:hover {
    border-color: #570101;
    box-shadow: 0 8px 22px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .cabecera-tarjeta { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .imagen-trabajador {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px solid #555;
    overflow: hidden;
    flex-shrink: 0;
    background: #eef0ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  .imagen-trabajador img { width: 100%; height: 100%; object-fit: cover; font-size: 0; color: transparent; }
  .imagen-trabajador .avatar-laburar { font-size: 1.5rem; }
  .identidad-trabajador { min-width: 0; }
  .nombre-trabajador {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fila-calificacion { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
  .numero-calificacion { font-size: 0.95rem; font-weight: 500; color: #1a1a1a; }
  .estrellas { display: inline-flex; gap: 1px; }
  .estrellas svg { width: 11px; height: 11px; }
  .subtexto-calificacion { font-size: 0.7rem; color: #666; margin-top: 1px; }

  .lista-meta-tarjeta { list-style: none; display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .item-meta-tarjeta {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    font-size: 0.74rem;
    color: #333;
    line-height: 1.3;
  }
  .item-meta-tarjeta svg { width: 13px; height: 13px; flex-shrink: 0; color: #570101; margin-top: 1px; }
  .item-meta-tarjeta .texto-recortado {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .acciones-tarjeta { display: flex; gap: 10px; margin-top: auto; }
  .boton-ver-perfil, .boton-agendar {
    flex: 1;
    font-size: 0.74rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 7px 10px;
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
    font-family: inherit;
  }
  .boton-ver-perfil { background: #fff; border: 1px solid #570101; color: #1a1a1a; }
  .boton-ver-perfil:hover { background: #f6eeee; }
  .boton-agendar { background: #7a2a2a; border: 1px solid #570101; color: #fff; }
  .boton-agendar:hover { background: #570101; }
  .boton-ver-perfil:disabled, .boton-agendar:disabled { opacity: 0.6; cursor: not-allowed; }

  .sin-resultados, .estado-carga, .estado-error {
    text-align: center;
    padding: 3rem 1rem;
    color: #555;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.75);
    border-radius: 12px;
  }
  .estado-error { color: #b23a1c; }

  .esqueleto-tarjeta {
    height: 230px;
    border-radius: 12px;
    background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%);
    background-size: 400% 100%;
    animation: brillo-esqueleto 1.3s ease infinite;
  }
  @keyframes brillo-esqueleto {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }

  .toast-agendar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #570101;
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    z-index: 300;
  }

  .boton-mostrar-filtros {
    display: none;
    margin-left: auto;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid #570101;
    background: #fff;
    color: #570101;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  @media (max-width: 860px) {
    .layout-resultados { flex-direction: column; padding: 1.25rem 1rem 3rem; }
    .panel-filtros { width: 100%; position: static; max-height: none; display: none; order: 2; }
    .panel-filtros.abierto { display: flex; }
    .columna-resultados { order: 1; width: 100%; }
    .layout-resultados.filtros-abiertos .columna-resultados { order: 3; }
    .boton-mostrar-filtros { display: inline-block; }
    .aviso-login-busqueda { padding: 0 1rem; }
    .select-barrio-nav { max-width: 120px; }
  }
`;

const ESTRELLA_PATH = "M12 2l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.1l7.1-.6L12 2z";

function Estrellas({ valor }) {
  const llenas = Math.round(Number(valor) || 0);
  return (
    <span className="estrellas" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= llenas ? "#e0a100" : "#cfcfcf"}>
          <path d={ESTRELLA_PATH} />
        </svg>
      ))}
    </span>
  );
}

const Iconos = {
  herramienta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
    </svg>
  ),
  calendario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),
  reloj: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  ubicacion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  verificado: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2L12 2zm-1.2 13.6l5.6-5.6-1.4-1.4-4.2 4.2-2-2-1.4 1.4 3.4 3.4z" />
    </svg>
  ),
  precio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7.5 9.5 10.5 12 11s5 1.5 5 4-2.2 3.5-5 3.5-5-.9-5-2.5" />
    </svg>
  ),
  lupa: (
    <svg className="lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  ),
};

// Traduce lo que devuelve /usuarios/buscarTrabajadores al formato que usa la tarjeta
function mapearTrabajador(u) {
  const aptitudes = u.aptitudes || [];
  return {
    id: u.id,
    nombre: u.nombre_completo,
    zona: u.localidad,
    precio: u.cobro_por_hora != null ? Number(u.cobro_por_hora) : null,
    calificacion: u.puntuacion_trabajador != null ? Number(u.puntuacion_trabajador) : 0,
    fotoPerfilURL: u.foto_perfil || null,
    descripcion: u.sobre_mi || "",
    disponibilidad: Array.isArray(u.disponibilidad) && typeof u.disponibilidad[0] === "boolean"
    ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].filter((_, i) => u.disponibilidad[i])
    : u.disponibilidad,
    aptitudes,
    aptitudesEspecificas: u.aptitudes_especificas || [],
    trabajos: u.trabajos || [],
    etiquetaCategoria: aptitudes[0] || "Servicios generales",
    verificado: Boolean(u.verificado),
  };
}

function textoDisponibilidad(disponibilidad) {
  if (Array.isArray(disponibilidad)) {
    const n = disponibilidad.length;
    if (n === 0) return "";
    if (n >= 5) return "Mucha disponibilidad";
    if (n >= 3) return "Media disponibilidad";
    return "Poca disponibilidad";
  }
  return typeof disponibilidad === "string" ? disponibilidad : "";
}

// Palabras que no sirven para buscar ("necesito arreglar la canilla de la cocina")
const PALABRAS_VACIAS = new Set([
  "que", "con", "para", "por", "una", "uno", "unos", "unas", "los", "las", "del", "de", "la", "el",
  "en", "mi", "mis", "me", "se", "es", "un", "al", "lo", "le", "les", "y", "o", "a", "hay", "tengo",
  "necesito", "quiero", "busco", "hola", "casa", "algo", "como", "muy", "mas", "pero", "sin",
]);

// "periodo" puede venir como array, como texto de Postgres ("{2026-10-01,2026-10-05}")
// o como daterange ("[2026-10-01,2026-10-06)"). Sacamos las fechas que aparezcan.
function fechasDelPeriodo(periodo) {
  const texto = Array.isArray(periodo) ? periodo.join(",") : String(periodo || "");
  return texto.match(/\d{4}-\d{2}-\d{2}/g) || [];
}

function fechaCorta(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function textoPeriodo(periodo) {
  const fechas = fechasDelPeriodo(periodo);
  if (fechas.length === 0) return periodo ? String(periodo) : "";
  if (fechas.length === 1 || fechas[0] === fechas[fechas.length - 1]) return fechaCorta(fechas[0]);
  return `${fechaCorta(fechas[0])} – ${fechaCorta(fechas[fechas.length - 1])}`;
}

// AgendarModal guarda el horario dentro del texto: "Horario preferido: 17:00 hrs. ..."
function separarHorario(texto) {
  const coincidencia = String(texto || "").match(/^Horario preferido:\s*(\d{1,2}):(\d{2})\s*hrs\.\s*/i);
  if (!coincidencia) return { hora: null, horario: "", descripcion: texto || "" };
  return {
    hora: Number(coincidencia[1]) + Number(coincidencia[2]) / 60,
    horario: `${coincidencia[1]}:${coincidencia[2]} hrs`,
    descripcion: String(texto).slice(coincidencia[0].length),
  };
}

const RANGOS_HORARIO = {
  manana: [8, 12],
  tarde: [13, 17],
  noche: [16, 21.5],
};

const OPCIONES_FECHA = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Esta Semana" },
  { id: "3dias", etiqueta: "En 3 días" },
  { id: "manual", etiqueta: "Seleccionar fecha" },
];

const OPCIONES_HORARIO = [
  { id: "manana", etiqueta: "Mañana (8:00 - 12:00)" },
  { id: "tarde", etiqueta: "Tarde (13:00 - 17:00)" },
  { id: "noche", etiqueta: "Tarde/Noche (16:00 - 21:30)" },
];

function aFechaStr(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function PaginaBusqueda() {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const vista = parametros.get("vista") === "solicitudes" ? "solicitudes" : "solicitar";

  // Ojo: obtenerSesionUsuario() devuelve un objeto NUEVO (JSON.parse) en cada
  // llamada. Si lo usáramos directo como `const usuario = obtenerSesionUsuario()`
  // y lo pusiéramos en dependencias de un efecto, React lo vería "distinto" en
  // cada render (misma data, otra referencia) y el efecto se dispararía sin
  // parar. Por eso lo guardamos en estado: se recalcula solo cuando de verdad
  // cambia la sesión (login/logout), no en cada render.
  const [usuario, setUsuario] = useState(() => obtenerSesionUsuario());
  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    return () => window.removeEventListener("laburar-sesion-cambio", actualizar);
  }, []);

  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  const zonaInicial = ZONAS.includes(parametros.get("zona")) ? parametros.get("zona") : "";

  const [filtroCategoria, setFiltroCategoria] = useState(parametros.get("categoria") || "");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [filtroZona, setFiltroZona] = useState(zonaInicial);
  const [ordenCalificacion, setOrdenCalificacion] = useState(""); // "" | "mayor" | "menor"
  const [filtroFecha, setFiltroFecha] = useState(""); // "" | "hoy" | "semana" | "3dias" | "manual"
  const [fechaManual, setFechaManual] = useState("");
  // En "Solicitar" es solo visual (el backend no devuelve horarios de los
  // trabajadores). En "Mis solicitudes" filtra por el horario pedido.
  const [filtroHorario, setFiltroHorario] = useState([]);
  const [toast, setToast] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false); // solo en celular

  const [trabajadoresCrudos, setTrabajadoresCrudos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState("");
  const [idsEnProceso, setIdsEnProceso] = useState([]);

  const [trabajadorParaAgendar, setTrabajadorParaAgendar] = useState(null);
  const [trabajadorParaVer, setTrabajadorParaVer] = useState(null);

  const mostrarToast = (texto) => {
    setToast(texto);
    setTimeout(() => setToast(""), 3000);
  };

  const manejarSesionVencida = (setErr) => {
    // El token no está, es inválido o expiró (dura 3hs). Limpiamos la
    // sesión vieja para no quedar reintentando con un token muerto.
    cerrarSesionCompleta();
    setUsuario(null);
    setErr("Tu sesión expiró. Volvé a iniciar sesión para continuar.");
  };

  const buscar = useCallback(async (zona) => {
    if (!usuario) return;
    setCargando(true);
    setError("");
    try {
      const zonas = zona ? [zona] : ZONAS;
      const resultado = await buscarTrabajadores(zonas);
      setTrabajadoresCrudos(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      if (err.status === 401) {
        manejarSesionVencida(setError);
      } else {
        setError(err.message || "No se pudo cargar la búsqueda. Probá de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  // Búsqueda inicial y cada vez que cambia la zona seleccionada
  useEffect(() => {
    buscar(filtroZona);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroZona, usuario]);

  const cargarSolicitudes = useCallback(async () => {
    if (!usuario) return;
    setCargandoSolicitudes(true);
    setErrorSolicitudes("");
    try {
      const resultado = await obtenerSolicitudesRecibidas();
      setSolicitudes(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      if (err.status === 401) {
        manejarSesionVencida(setErrorSolicitudes);
      } else {
        setErrorSolicitudes(err.message || "No se pudieron cargar las solicitudes.");
      }
    } finally {
      setCargandoSolicitudes(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (vista === "solicitudes") cargarSolicitudes();
  }, [vista, cargarSolicitudes]);

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "solicitudes") siguientes.set("vista", "solicitudes");
    else siguientes.delete("vista");
    setParametros(siguientes);
  };

  const trabajadores = useMemo(
    () => trabajadoresCrudos.map(mapearTrabajador),
    [trabajadoresCrudos]
  );

  const categoriasDisponibles = useMemo(() => {
    const set = new Set(trabajadores.flatMap((t) => t.aptitudes));
    if (filtroCategoria) set.add(filtroCategoria);
    return [...set].sort();
  }, [trabajadores, filtroCategoria]);

  const manejarTecla = (e) => {
    if (e.key === "Enter") e.target.blur();
  };

  const limpiarFiltros = () => {
    setFiltroCategoria("");
    setPrecioMin("");
    setPrecioMax("");
    setFiltroZona("");
    setOrdenCalificacion("");
    setFiltroFecha("");
    setFechaManual("");
    setFiltroHorario([]);
    setConsulta("");
  };

  const manejarAgendarClick = (t) => {
    if (!usuario) {
      navegar("/login");
      return;
    }
    setTrabajadorParaAgendar(t);
  };

  const manejarVerPerfilClick = (t) => {
    setTrabajadorParaVer(t);
  };

  const manejarAgendarDesdePerfil = (t) => {
    setTrabajadorParaVer(null);
    manejarAgendarClick(t);
  };

  const manejarSolicitudEnviada = (t) => {
    setTrabajadorParaAgendar(null);
    agregarAlHistorial({
      tipo: "solicitud",
      titulo: `${t.etiquetaCategoria} · ${t.nombre}`,
      categoria: t.aptitudes?.[0] || "",
      zona: t.zona || "",
    });
    mostrarToast(`Le mandaste una solicitud a ${t.nombre} 🙌`);
  };

  const marcarEnProceso = (id, enProceso) => {
    setIdsEnProceso((prev) =>
      enProceso ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const manejarAceptar = async (s) => {
    marcarEnProceso(s.id, true);
    try {
      await aceptarSolicitud(s.id);
      setSolicitudes((prev) => prev.filter((x) => x.id !== s.id));
      mostrarToast(`Aceptaste la solicitud de ${s.nombre_completo}`);
    } catch (err) {
      setErrorSolicitudes(err.message || "No se pudo aceptar la solicitud.");
    } finally {
      marcarEnProceso(s.id, false);
    }
  };

  const manejarRechazar = async (s) => {
    marcarEnProceso(s.id, true);
    try {
      await rechazarSolicitud(s.id);
      setSolicitudes((prev) => prev.filter((x) => x.id !== s.id));
      mostrarToast(`Rechazaste la solicitud de ${s.nombre_completo}`);
    } catch (err) {
      setErrorSolicitudes(err.message || "No se pudo rechazar la solicitud.");
    } finally {
      marcarEnProceso(s.id, false);
    }
  };

  // "disponibilidad" viene tal cual de la API (los mismos días que el
  // trabajador eligió en "Ofrecer servicios"). Si no tiene ese dato, no
  // filtramos por fecha para no ocultar trabajadores por error.
  const ABREV_DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fechaDesdeInput = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fechaObjetivo = () => {
    if (filtroFecha === "hoy") return new Date();
    if (filtroFecha === "3dias") {
      const objetivo = new Date();
      objetivo.setDate(objetivo.getDate() + 3);
      return objetivo;
    }
    if (filtroFecha === "manual" && fechaManual) return fechaDesdeInput(fechaManual);
    return null;
  };
  const fechaCoincide = (t) => {
    if (!filtroFecha) return true;
    if (!Array.isArray(t.disponibilidad) || t.disponibilidad.length === 0) return true;
    if (filtroFecha === "semana") return t.disponibilidad.length > 0;
    const objetivo = fechaObjetivo();
    if (!objetivo) return true;
    return t.disponibilidad.includes(ABREV_DIAS_SEMANA[objetivo.getDay()]);
  };

  const resultados = useMemo(() => {
    const textoBusqueda = normalizarTexto(consulta.trim());
    // Si el texto es largo ("se me rompió la canilla de la cocina") buscamos
    // por palabras sueltas; con que una coincida alcanza.
    const palabras = textoBusqueda
      .split(/[^a-z0-9ñ]+/)
      .filter((p) => p.length >= 3 && !PALABRAS_VACIAS.has(p));

    const filtrados = trabajadores.filter((t) => {
      const textoTrabajador = normalizarTexto(
        [t.nombre, ...t.aptitudes, ...t.aptitudesEspecificas, ...t.trabajos, t.descripcion].join(" ")
      );
      const textoCoincide =
        !textoBusqueda ||
        textoTrabajador.includes(textoBusqueda) ||
        palabras.some((p) => textoTrabajador.includes(p));

      const categoriaCoincide = !filtroCategoria || t.aptitudes.includes(filtroCategoria);
      const minCoincide = !precioMin || t.precio == null || t.precio >= Number(precioMin);
      const maxCoincide = !precioMax || t.precio == null || t.precio <= Number(precioMax);

      return textoCoincide && categoriaCoincide && minCoincide && maxCoincide && fechaCoincide(t);
    });

    if (ordenCalificacion === "mayor") {
      return [...filtrados].sort((a, b) => b.calificacion - a.calificacion);
    }
    if (ordenCalificacion === "menor") {
      return [...filtrados].sort((a, b) => a.calificacion - b.calificacion);
    }
    return filtrados;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadores, consulta, filtroCategoria, precioMin, precioMax, ordenCalificacion, filtroFecha, fechaManual]);

  const precioPromedio = useMemo(() => {
    const precios = resultados.map((t) => t.precio).filter((p) => p != null && !Number.isNaN(p) && p > 0);
    if (precios.length === 0) return null;
    return Math.round(precios.reduce((a, b) => a + b, 0) / precios.length);
  }, [resultados]);

  const solicitudesFiltradas = useMemo(() => {
    const textoBusqueda = normalizarTexto(consulta.trim());
    const objetivo = fechaObjetivo();
    const hoy = new Date();
    const enUnaSemana = new Date();
    enUnaSemana.setDate(hoy.getDate() + 7);

    const filtradas = solicitudes.filter((s) => {
      if (textoBusqueda) {
        const texto = normalizarTexto(
          [s.nombre_completo, s.solicitud, s.aptitud, s.aptitud_especifica, s.trabajo].join(" ")
        );
        if (!texto.includes(textoBusqueda)) return false;
      }

      const fechas = fechasDelPeriodo(s.periodo);
      if (filtroFecha && fechas.length > 0) {
        const inicio = fechas[0];
        const fin = fechas[fechas.length - 1];
        if (filtroFecha === "semana") {
          if (inicio > aFechaStr(enUnaSemana) || fin < aFechaStr(hoy)) return false;
        } else if (objetivo) {
          const dia = aFechaStr(objetivo);
          if (dia < inicio || dia > fin) return false;
        }
      }

      if (filtroHorario.length > 0) {
        const { hora } = separarHorario(s.solicitud);
        if (hora != null) {
          const coincide = filtroHorario.some((id) => {
            const [desde, hasta] = RANGOS_HORARIO[id];
            return hora >= desde && hora <= hasta;
          });
          if (!coincide) return false;
        }
      }
      return true;
    });

    const puntaje = (s) => Number(s.puntuacion_contratador) || 0;
    if (ordenCalificacion === "mayor") return [...filtradas].sort((a, b) => puntaje(b) - puntaje(a));
    if (ordenCalificacion === "menor") return [...filtradas].sort((a, b) => puntaje(a) - puntaje(b));
    return filtradas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudes, consulta, filtroFecha, fechaManual, filtroHorario, ordenCalificacion]);

  const buscador = (
    <div className="buscador-nav">
      {Iconos.lupa}
      <input
        type="text"
        placeholder={vista === "solicitudes" ? "Buscar en mis solicitudes..." : "Buscador"}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={manejarTecla}
      />
      <select
        className="select-barrio-nav"
        value={filtroZona}
        onChange={(e) => setFiltroZona(e.target.value)}
        aria-label="Barrio o zona"
      >
        <option value="">BARRIO</option>
        {ZONAS.map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
    </div>
  );

  const renderFiltrosComunes = () => (
    <>
      <div className="caja-filtro">
        <p className="titulo-caja-filtro">Fecha:</p>
        <div className="grilla-fecha-filtro">
          {OPCIONES_FECHA.map((op) => (
            <button
              type="button"
              key={op.id}
              className={`chip-fecha-filtro ${filtroFecha === op.id ? "activo" : ""}`}
              onClick={() => setFiltroFecha(filtroFecha === op.id ? "" : op.id)}
            >
              {op.etiqueta}
            </button>
          ))}
        </div>
        {filtroFecha === "manual" && (
          <div className="campo-fecha-manual">
            <input
              type="date"
              value={fechaManual}
              onChange={(e) => setFechaManual(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="caja-filtro">
        <p className="titulo-caja-filtro">Calificación:</p>
        <div className="opciones-radio-filtro">
          {[
            { id: "mayor", etiqueta: "De mayor a menor" },
            { id: "menor", etiqueta: "De menor a mayor" },
          ].map((op) => (
            <label className="opcion-radio-filtro" key={op.id}>
              <input
                type="checkbox"
                checked={ordenCalificacion === op.id}
                onChange={() => setOrdenCalificacion(ordenCalificacion === op.id ? "" : op.id)}
              />
              <span className="marca-radio" />
              {op.etiqueta}
            </label>
          ))}
        </div>
      </div>

      <div className="caja-filtro">
        <p className="titulo-caja-filtro">Horario de atención</p>
        <div className="opciones-radio-filtro">
          {OPCIONES_HORARIO.map((op) => (
            <label className="opcion-radio-filtro" key={op.id}>
              <input
                type="checkbox"
                checked={filtroHorario.includes(op.id)}
                onChange={() =>
                  setFiltroHorario((prev) =>
                    prev.includes(op.id) ? prev.filter((h) => h !== op.id) : [...prev, op.id]
                  )
                }
              />
              <span className="marca-radio" />
              {op.etiqueta}
            </label>
          ))}
        </div>
      </div>

      <button className="boton-limpiar-filtros" onClick={limpiarFiltros}>
        Limpiar filtros
      </button>
    </>
  );

  const renderEsqueletos = () => (
    <div className="lista-tarjetas">
      {[0, 1, 2, 3, 4, 5].map((i) => <div className="esqueleto-tarjeta" key={i} />)}
    </div>
  );

  const renderTrabajadores = () => {
    if (cargando) return renderEsqueletos();
    if (error) return <div className="estado-error">{error}</div>;
    return (
      <>
        <p className="resumen-resultados">
          <strong>{resultados.length}</strong> trabajador{resultados.length === 1 ? "" : "es"} encontrado{resultados.length === 1 ? "" : "s"}
          {filtroZona ? <> en <strong>{filtroZona}</strong></> : ""}
        </p>

        {resultados.length === 0 ? (
          <div className="sin-resultados">
            {usuario
              ? "No encontramos trabajadores con esos filtros. Probá ajustarlos."
              : "Iniciá sesión para buscar trabajadores."}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {resultados.map((t) => {
              const disponibilidad = textoDisponibilidad(t.disponibilidad);
              return (
                <div className="tarjeta-trabajador" key={t.id}>
                  <div className="cabecera-tarjeta">
                    <div className="imagen-trabajador">
                      <Avatar src={t.fotoPerfilURL} nombre={t.nombre} />
                    </div>
                    <div className="identidad-trabajador">
                      <span className="nombre-trabajador" title={t.nombre}>{t.nombre}</span>
                      <div className="fila-calificacion">
                        <span className="numero-calificacion">
                          {t.calificacion > 0 ? t.calificacion.toFixed(1) : "Nuevo"}
                        </span>
                        <Estrellas valor={t.calificacion} />
                      </div>
                      <div className="subtexto-calificacion">{t.etiquetaCategoria}</div>
                    </div>
                  </div>

                  <ul className="lista-meta-tarjeta">
                    <li className="item-meta-tarjeta">
                      {Iconos.precio}
                      {t.precio != null ? `$${t.precio.toLocaleString("es-AR")} / hora` : "Consultar precio"}
                    </li>
                    {disponibilidad && (
                      <li className="item-meta-tarjeta">{Iconos.calendario}{disponibilidad}</li>
                    )}
                    <li className="item-meta-tarjeta">{Iconos.ubicacion}{t.zona}, Arg.</li>
                    {t.verificado && (
                      <li className="item-meta-tarjeta">{Iconos.verificado}Trabajador verificado</li>
                    )}
                  </ul>

                  <div className="acciones-tarjeta">
                    <button className="boton-ver-perfil" onClick={() => manejarVerPerfilClick(t)}>
                      Ver perfil
                    </button>
                    <button className="boton-agendar" onClick={() => manejarAgendarClick(t)}>
                      Agendar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderSolicitudes = () => {
    if (!usuario) {
      return <div className="sin-resultados">Iniciá sesión para ver tus solicitudes.</div>;
    }
    if (cargandoSolicitudes) return renderEsqueletos();
    return (
      <>
        {errorSolicitudes && <div className="estado-error" style={{ marginBottom: 16, padding: "1rem" }}>{errorSolicitudes}</div>}
        <p className="resumen-resultados">
          <strong>{solicitudesFiltradas.length}</strong> solicitud{solicitudesFiltradas.length === 1 ? "" : "es"} por revisar
        </p>
        {solicitudesFiltradas.length === 0 ? (
          <div className="sin-resultados">
            {solicitudes.length === 0
              ? "Todavía no te llegó ninguna solicitud."
              : "No hay solicitudes con esos filtros."}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {solicitudesFiltradas.map((s) => {
              const { horario, descripcion } = separarHorario(s.solicitud);
              const periodo = textoPeriodo(s.periodo);
              const puntaje = s.puntuacion_contratador != null ? Number(s.puntuacion_contratador) : 0;
              const enProceso = idsEnProceso.includes(s.id);
              return (
                <div className="tarjeta-trabajador" key={s.id}>
                  <div className="cabecera-tarjeta">
                    <div className="imagen-trabajador">
                      <Avatar src={s.foto_perfil} nombre={s.nombre_completo} />
                    </div>
                    <div className="identidad-trabajador">
                      <span className="nombre-trabajador" title={s.nombre_completo}>{s.nombre_completo}</span>
                      <div className="fila-calificacion">
                        <span className="numero-calificacion">{puntaje > 0 ? puntaje.toFixed(1) : "Nuevo"}</span>
                        <Estrellas valor={puntaje} />
                      </div>
                      {(s.aptitud || s.aptitud_especifica) && (
                        <div className="subtexto-calificacion">{s.aptitud_especifica || s.aptitud}</div>
                      )}
                    </div>
                  </div>

                  <ul className="lista-meta-tarjeta">
                    <li className="item-meta-tarjeta" title={descripcion}>
                      {Iconos.herramienta}
                      <span className="texto-recortado">{descripcion}</span>
                    </li>
                    {(periodo || horario) && (
                      <li className="item-meta-tarjeta">
                        {Iconos.calendario}
                        {[periodo, horario].filter(Boolean).join(", ")}
                      </li>
                    )}
                    {s.localidad && <li className="item-meta-tarjeta">{Iconos.ubicacion}{s.localidad}</li>}
                    {s.trabajo && <li className="item-meta-tarjeta">{Iconos.reloj}{s.trabajo}</li>}
                  </ul>

                  <div className="acciones-tarjeta">
                    <button className="boton-ver-perfil" onClick={() => manejarRechazar(s)} disabled={enProceso}>
                      Rechazar
                    </button>
                    <button className="boton-agendar" onClick={() => manejarAceptar(s)} disabled={enProceso}>
                      Aceptar solicitud
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <style>{estilos}</style>

      <div className="pagina-busqueda">
        <BarraNav centro={buscador} />

        {!usuario && (
          <div className="aviso-login-busqueda">
            <div className="tarjeta-aviso-login">
              <span>Iniciá sesión para ver trabajadores y mandar solicitudes.</span>
              <button className="boton-login-aviso" onClick={() => navegar("/login")}>
                Iniciar sesión
              </button>
            </div>
          </div>
        )}

        <div className={`layout-resultados ${filtrosAbiertos ? "filtros-abiertos" : ""}`}>
          <aside className={`panel-filtros ${filtrosAbiertos ? "abierto" : ""}`}>
            {vista === "solicitar" ? (
              <>
                <div className="caja-filtro caja-resumen">
                  <div className="categoria-resumen">{filtroCategoria || "Todas las categorías"}:</div>
                  <div className="precio-resumen">
                    {precioPromedio != null ? `$${precioPromedio.toLocaleString("es-AR")}` : "—"}
                  </div>
                  <div className="detalle-resumen">
                    Precio promedio por hora {filtroZona ? `en ${filtroZona}` : "cerca de tu zona"}
                  </div>
                  <div className="separador-resumen" />
                  <p className="ayuda-resumen">Ajustá los filtros para obtener un resultado más acorde a tus necesidades</p>
                </div>

                <div className="caja-filtro">
                  <label className="etiqueta-filtro">Categoría</label>
                  <select
                    className="select-filtro"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {categoriasDisponibles.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <label className="etiqueta-filtro">Precio por hora ($)</label>
                  <div className="fila-precio">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={precioMin}
                      onChange={(e) => setPrecioMin(e.target.value)}
                      min="0"
                    />
                    <span className="guion-precio">–</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      value={precioMax}
                      onChange={(e) => setPrecioMax(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
                <p className="titulo-caja-filtro">NÚMERO DE SOLICITUDES</p>
                <div className="contador-solicitudes">{solicitudes.length}</div>
                <p className="ayuda-resumen">No tenés por qué aceptar todas las solicitudes. ¡Tomate un descanso!</p>
                <div className="separador-resumen" />
                <p className="ayuda-resumen">Ajustá los filtros para obtener un resultado más acorde a tus necesidades</p>
              </div>
            )}

            {renderFiltrosComunes()}
          </aside>

          <div className="columna-resultados">
            <div className="pestanas-busqueda" role="tablist">
              <button
                role="tab"
                aria-selected={vista === "solicitar"}
                className={`pestana-busqueda ${vista === "solicitar" ? "activa" : ""}`}
                onClick={() => cambiarVista("solicitar")}
              >
                Solicitar
              </button>
              <button
                role="tab"
                aria-selected={vista === "solicitudes"}
                className={`pestana-busqueda ${vista === "solicitudes" ? "activa" : ""}`}
                onClick={() => cambiarVista("solicitudes")}
              >
                Mis solicitudes
              </button>
              <button className="boton-mostrar-filtros" onClick={() => setFiltrosAbiertos((v) => !v)}>
                {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
              </button>
            </div>

            {vista === "solicitar" ? renderTrabajadores() : renderSolicitudes()}
          </div>
        </div>

        {trabajadorParaVer && (
          <PerfilTrabajadorModal
            trabajador={trabajadorParaVer}
            onCerrar={() => setTrabajadorParaVer(null)}
            onAgendar={manejarAgendarDesdePerfil}
          />
        )}

        {trabajadorParaAgendar && (
          <AgendarModal
            trabajador={trabajadorParaAgendar}
            onCerrar={() => setTrabajadorParaAgendar(null)}
            onEnviada={manejarSolicitudEnviada}
          />
        )}

        {toast && <div className="toast-agendar">{toast}</div>}
      </div>
    </>
  );
}

export default PaginaBusqueda;
