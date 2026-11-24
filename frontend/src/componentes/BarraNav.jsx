import { nombreCorto } from "../nombres";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerSesionUsuario,
  cerrarSesionCompleta,
  obtenerNotificaciones,
  obtenerNotificacionesLeidas,
  marcarNotificacionesLeidas,
  claveNotificacion,
  actualizarFotoSesion,
  guardarNotificaciones,
} from "../sesion";
import { subirFotoPerfil, TIPOS_FOTO_PERFIL, obtenerMisNotificaciones } from "../api";
import { contarNoLeidos, EVENTO_MENSAJES } from "../mensajesApi";
import { presentarNotificacion, tiempoRelativo, marcarLeidasEnServidor, abrirResena } from "../notificacionesDatos";
import Avatar from "./Avatar";
import AvisoConfirmarEmail from "./AvisoConfirmarEmail";
import logoIcono from "../assets/logo-icono.svg";
import logoTexto from "../assets/logo-texto.svg";

const estilos = `
  .barra-nav {
    position: sticky;
    top: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 2rem;
    height: 60px;
    background: #a8a8a8;
    box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .logotipo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
  }
  .logo-icono-nav { width: 30px; height: auto; display: block; }
  .logo-texto-nav { width: 92px; height: auto; display: block; }

  .nav-centro { flex: 1; display: flex; justify-content: center; min-width: 0; }

  .nav-derecha { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
  .enlace-nav {
    background: none;
    border: none;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #222;
    cursor: pointer;
    border-radius: 999px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .enlace-nav:hover { background: rgba(255,255,255,0.35); }
  .boton-ofrecer {
    background: #3b1e0d;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 0.45rem 0.95rem;
    font-size: 0.76rem;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .boton-ofrecer:hover { background: #570101; }
  /* "Ver problemas": misma forma que "Ofrecer mi servicio", pero con borde para diferenciarlo */
  .boton-ver-problemas {
    background: rgba(255,255,255,0.55);
    color: #3b1e0d;
    border: 1px solid #3b1e0d;
    padding: 0.45rem 0.95rem;
    font-size: 0.76rem;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .boton-ver-problemas:hover { background: #fff; color: #570101; }
  .boton-ver-problemas .texto-corto, .boton-ofrecer .texto-corto { display: none; }

  .contenedor-desplegable { position: relative; }

  /* --- campana y mensajes: en negro; en bordó cuando hay algo sin leer --- */
  .boton-campana {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: none;
    border: none;
    cursor: pointer;
    color: #1a1a1a;
    transition: background 0.15s, color 0.15s;
  }
  .boton-campana:hover { background: rgba(255,255,255,0.35); }
  .boton-campana.con-pendientes { color: #8a0f0f; }
  .boton-campana.abierta { background: rgba(255,255,255,0.45); }
  .boton-campana svg { width: 24px; height: 24px; }
  .boton-mensajes-nav svg { width: 22px; height: 22px; }
  .insignia-campana {
    position: absolute;
    top: 3px;
    right: 3px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #8a0f0f;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #a8a8a8;
  }

  .panel-desplegable {
    position: absolute;
    top: 46px;
    right: 0;
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.14);
    z-index: 70;
    animation: aparecer-desplegable 0.12s ease-out;
  }
  @keyframes aparecer-desplegable {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- panel de notificaciones --- */
  .panel-notificaciones { width: 370px; max-width: calc(100vw - 16px); overflow: hidden; border-radius: 14px; }
  .encabezado-notificaciones {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #f0eeee;
  }
  .titulo-notificaciones { font-size: 0.95rem; font-weight: 800; color: #1a1a1a; }
  .cantidad-nuevas { font-size: 0.7rem; font-weight: 700; color: #8a0f0f; }
  .lista-notificaciones { max-height: min(460px, 70vh); overflow-y: auto; padding: 4px 0; }
  .item-notificacion {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.12s;
  }
  .item-notificacion:hover, .item-notificacion:focus-visible { background: #f7f3f3; outline: none; }
  .item-notificacion.no-leida { background: #fbf4f4; }
  .item-notificacion.no-leida:hover { background: #f6ecec; }
  .item-notificacion.sin-enlace { cursor: default; }
  .item-notificacion.sin-enlace:hover { background: none; }
  .item-notificacion.no-leida.sin-enlace:hover { background: #fbf4f4; }

  .icono-notificacion {
    position: relative;
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1eded;
    color: #6b5a5a;
  }
  .icono-notificacion svg { width: 18px; height: 18px; }
  .icono-notificacion.nuevo { background: #f6e6e6; color: #8a0f0f; }
  .icono-notificacion.bien { background: #e6f4ea; color: #1e6b2d; }
  .icono-notificacion.mal { background: #fbeceb; color: #a1261e; }
  .icono-notificacion.con-foto { background: none; }
  .mini-icono {
    position: absolute;
    right: -3px;
    bottom: -3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    background: #8f7f7f;
    color: #fff;
  }
  .mini-icono svg { width: 10px; height: 10px; }
  .mini-icono.nuevo { background: #8a0f0f; }
  .mini-icono.bien { background: #2e7d32; }
  .mini-icono.mal { background: #b3261e; }

  .cuerpo-notificacion { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .titulo-item-notificacion {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .detalle-item-notificacion {
    font-size: 0.73rem;
    color: #6b6b6b;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tiempo-item-notificacion { font-size: 0.66rem; color: #9a9a9a; margin-top: 1px; }
  .item-notificacion.no-leida .tiempo-item-notificacion { color: #8a0f0f; font-weight: 600; }
  .punto-notificacion {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #8a0f0f;
    margin-top: 6px;
    flex-shrink: 0;
  }
  .vacio-notificaciones { padding: 30px 24px 32px; text-align: center; }
  .vacio-notificaciones svg { width: 34px; height: 34px; color: #c9bcbc; margin-bottom: 8px; }
  .vacio-notificaciones strong { display: block; font-size: 0.86rem; color: #333; margin-bottom: 4px; }
  .vacio-notificaciones p { font-size: 0.74rem; color: #888; line-height: 1.45; }

  /* --- usuario --- */
  .boton-usuario {
    display: flex;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px 4px 4px;
    border-radius: 999px;
    transition: background 0.15s;
  }
  .boton-usuario:hover { background: rgba(255,255,255,0.35); }
  .avatar-usuario { box-shadow: 0 0 0 1.5px rgba(255,255,255,0.75); }
  .nombre-boton-usuario {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1a1a1a;
    text-transform: uppercase;
    max-width: 160px; /* entra el nombre de una empresa ("El Taller del Sur") */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flecha-usuario { width: 10px; height: 10px; color: #1a1a1a; transition: transform 0.15s; }
  .flecha-usuario.abierta { transform: rotate(180deg); }

  .menu-avatar { min-width: 230px; padding: 6px; }
  .menu-avatar-cabecera { display: flex; align-items: center; gap: 10px; padding: 8px 10px 6px; }
  .menu-avatar-datos { min-width: 0; }
  .menu-avatar-nombre {
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a1a1a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .menu-avatar-correo { font-size: 0.72rem; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .boton-cambiar-foto {
    background: none;
    border: none;
    padding: 0;
    margin-top: 3px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #570101;
    cursor: pointer;
  }
  .boton-cambiar-foto:hover { text-decoration: underline; }
  .boton-cambiar-foto:disabled { color: #999; cursor: wait; text-decoration: none; }
  .error-foto-menu { font-size: 0.7rem; color: #b3261e; padding: 0 10px 6px; }
  .menu-avatar-separador { height: 1px; background: #efefed; margin: 4px 0; }
  .menu-avatar-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 8px 10px;
    font-size: 0.8rem;
    color: #333;
    cursor: pointer;
    border-radius: 6px;
  }
  .menu-avatar-item:hover { background: #f4eeee; }
  .menu-avatar-item.salir { color: #b3261e; }
  .menu-avatar-item.destacado { color: #570101; font-weight: 700; }

  .boton-iniciar-sesion-nav {
    background: #570101;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .boton-iniciar-sesion-nav:hover { background: #3b1e0d; }

  /* Con el buscador en el medio, en pantallas medianas el nombre no entra: queda solo la foto */
  @media (max-width: 1060px) {
    .barra-nav.con-buscador .nombre-boton-usuario { display: none; }
  }
  @media (max-width: 860px) {
    .barra-nav { padding: 0 1rem; flex-wrap: wrap; height: auto; min-height: 60px; row-gap: 8px; padding-top: 8px; padding-bottom: 8px; }
    .nav-centro { order: 3; flex-basis: 100%; }
    .nombre-boton-usuario { display: none; }
  }
  @media (max-width: 640px) {
    /* En el celular el panel ocupa el ancho de la pantalla, justo debajo de la barra */
    .panel-notificaciones {
      position: fixed;
      top: var(--arriba-panel, 64px);
      left: 8px;
      right: 8px;
      width: auto;
      max-width: none;
    }
    .lista-notificaciones { max-height: calc(100vh - var(--arriba-panel, 64px) - 70px); }
  }
  @media (max-width: 520px) {
    .logo-texto-nav { display: none; }
    .boton-ofrecer { padding: 0.4rem 0.7rem; font-size: 0.7rem; }
    .boton-ver-problemas { padding: 0.4rem 0.7rem; font-size: 0.7rem; }
    .boton-ver-problemas .texto-largo { display: none; }
    .boton-ver-problemas .texto-corto { display: inline; }
    .barra-nav { gap: 0.5rem; padding-left: 0.75rem; padding-right: 0.75rem; }
    .nav-derecha { gap: 0.3rem; }
    .boton-campana { width: 34px; height: 34px; }
    .boton-usuario { padding: 2px; }
  }
  @media (max-width: 370px) {
    .boton-ofrecer, .boton-ver-problemas { padding: 0.35rem 0.55rem; font-size: 0.66rem; }
    .boton-campana { width: 30px; height: 30px; }
    .boton-campana svg { width: 21px; height: 21px; }
    .boton-ofrecer .texto-largo { display: none; }
    .boton-ofrecer .texto-corto { display: inline; }
  }
`;

function IconoMensajes() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4.4 3.3A1 1 0 0 1 3 20.5V6a2 2 0 0 1 1-2zm3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
    </svg>
  );
}

function IconoCampana() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" />
    </svg>
  );
}

function IconoFlecha({ abierta }) {
  return (
    <svg className={`flecha-usuario ${abierta ? "abierta" : ""}`} viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M0 2.5h10L5 8.5z" />
    </svg>
  );
}

// Íconos chicos de cada tipo de notificación
const ICONOS_NOTIFICACION = {
  precio: <path d="M12 3v18M16.5 7.5c-.6-1.4-2.2-2.3-4.3-2.3-2.6 0-4.2 1.3-4.2 3.1 0 4.3 8.7 2.4 8.7 7 0 1.9-1.8 3.3-4.5 3.3-2.3 0-4-.9-4.7-2.5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cruz: <path d="M6 6l12 12M18 6L6 18" />,
  candado: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  pedido: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  estrella: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  escudo: <><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  campana: <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16zM10 20a2 2 0 0 0 4 0" />,
};

function IconoNotificacion({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS_NOTIFICACION[nombre] || ICONOS_NOTIFICACION.campana}
    </svg>
  );
}

// Cierra el desplegable cuando se hace click afuera.
function useClickAfuera(referencia, alClickAfuera) {
  useEffect(() => {
    const manejar = (e) => {
      if (referencia.current && !referencia.current.contains(e.target)) alClickAfuera();
    };
    document.addEventListener("mousedown", manejar);
    return () => document.removeEventListener("mousedown", manejar);
  }, [referencia, alClickAfuera]);
}

/**
 * Barra de navegación superior.
 * Props:
 *  - centro (opcional): contenido que se muestra en el medio (ej: el buscador).
 */
export default function BarraNav({ centro = null }) {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(obtenerSesionUsuario());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [campanaAbierta, setCampanaAbierta] = useState(false);
  const [notificaciones, setNotificaciones] = useState(obtenerNotificaciones());
  const [leidas, setLeidas] = useState(obtenerNotificacionesLeidas());
  // Las que estaban sin leer al abrir la campana (para resaltarlas mientras está abierta)
  const [noLeidasAlAbrir, setNoLeidasAlAbrir] = useState([]);
  // Hora en que se abrió el panel (para el "Hace 5 min") y dónde ubicarlo en el celular
  const [ahora, setAhora] = useState(() => Date.now());
  const [arribaPanel, setArribaPanel] = useState(64);

  const referenciaMenu = useRef(null);
  const referenciaCampana = useRef(null);
  const referenciaInputFoto = useRef(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");

  useEffect(() => {
    const actualizarSesion = () => setUsuario(obtenerSesionUsuario());
    const actualizarNotificaciones = () => {
      setNotificaciones(obtenerNotificaciones());
      setLeidas(obtenerNotificacionesLeidas());
    };
    window.addEventListener("laburar-sesion-cambio", actualizarSesion);
    window.addEventListener("storage", actualizarSesion);
    window.addEventListener("laburar-notificaciones-cambio", actualizarNotificaciones);
    return () => {
      window.removeEventListener("laburar-sesion-cambio", actualizarSesion);
      window.removeEventListener("storage", actualizarSesion);
      window.removeEventListener("laburar-notificaciones-cambio", actualizarNotificaciones);
    };
  }, []);

  // Notificaciones y mensajes sin leer, al día (cada un rato, al volver a la pestaña y cuando cambia algo)
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const idUsuario = usuario?.id;
  useEffect(() => {
    if (!idUsuario) return undefined;
    let activo = true;
    const actualizarMensajes = () =>
      contarNoLeidos()
        .then((n) => activo && setMensajesNoLeidos(n))
        .catch(() => {});
    const actualizarNotificaciones = () =>
      obtenerMisNotificaciones()
        .then((lista) => activo && guardarNotificaciones(lista))
        .catch(() => {});
    const alVolver = () => {
      if (document.hidden) return;
      actualizarMensajes();
      actualizarNotificaciones();
    };
    alVolver();
    const intervaloMensajes = setInterval(() => !document.hidden && actualizarMensajes(), 30000);
    const intervaloNotificaciones = setInterval(() => !document.hidden && actualizarNotificaciones(), 60000);
    window.addEventListener(EVENTO_MENSAJES, actualizarMensajes);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      clearInterval(intervaloMensajes);
      clearInterval(intervaloNotificaciones);
      window.removeEventListener(EVENTO_MENSAJES, actualizarMensajes);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [idUsuario]);

  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const cerrarCampana = useCallback(() => setCampanaAbierta(false), []);
  useClickAfuera(referenciaMenu, cerrarMenu);
  useClickAfuera(referenciaCampana, cerrarCampana);

  const items = notificaciones.map((n, i) => presentarNotificacion(n, claveNotificacion(n, i)));
  // Si la base guarda si se leyó, se usa eso; si no, lo que se marcó en este navegador
  const sinLeer = (item) => (item.leida === null ? !leidas.includes(item.clave) : !item.leida);
  const cantidadNoLeidas = items.filter(sinLeer).length;

  // Al abrir la campana, todo queda como leído (la insignia se va y el ícono vuelve a negro);
  // las que eran nuevas se siguen resaltando mientras el panel está abierto.
  const alternarCampana = () => {
    if (!campanaAbierta) {
      const nuevas = items.filter(sinLeer).map((item) => item.clave);
      setNoLeidasAlAbrir(nuevas);
      setAhora(Date.now());
      const caja = referenciaCampana.current?.closest(".barra-nav")?.getBoundingClientRect();
      if (caja) setArribaPanel(Math.round(caja.bottom + 6));
      if (nuevas.length > 0) {
        marcarNotificacionesLeidas(items.map((item) => item.clave));
        guardarNotificaciones(notificaciones.map((n) => (typeof n.leida === "boolean" ? { ...n, leida: true } : n)));
        marcarLeidasEnServidor().catch(() => {});
      }
    }
    setCampanaAbierta((prev) => !prev);
    setMenuAbierto(false);
  };

  // Tocar una notificación lleva a lo que avisa (o abre la reseña de ese trabajo)
  const abrirNotificacion = (item) => {
    if (!item.enlace) return;
    setCampanaAbierta(false);
    if (item.enlace.startsWith("resena:")) {
      abrirResena(Number(item.enlace.slice(7)) || null);
      return;
    }
    navegar(item.enlace);
  };

  const ir = (ruta) => {
    setMenuAbierto(false);
    navegar(ruta);
  };

  const manejarCambioFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto
    if (!archivo) return;
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const url = await subirFotoPerfil(archivo);
      actualizarFotoSesion(url);
    } catch (err) {
      if (err.status === 401) {
        cerrarSesionCompleta();
        navegar("/login");
        return;
      }
      setErrorFoto(err.message || "No se pudo cambiar la foto. Probá de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const manejarCerrarSesion = () => {
    cerrarSesionCompleta();
    setMenuAbierto(false);
    navegar("/");
  };

  const primerNombre = nombreCorto(usuario?.nombre, usuario?.esEmpresa, "Usuario");

  return (
    <>
      <style>{estilos}</style>
      <header className={`barra-nav ${centro ? "con-buscador" : ""}`}>
        <div className="logotipo" onClick={() => navegar("/")}>
          <img src={logoIcono} alt="" className="logo-icono-nav" />
          <img src={logoTexto} alt="LABURAR" className="logo-texto-nav" />
        </div>

        {centro && <div className="nav-centro">{centro}</div>}

        <nav className="nav-derecha">
          {usuario ? (
            <>
              <button
                className="boton-ver-problemas"
                onClick={() => navegar("/problemas")}
                title="Problemas que publicó la gente para que un trabajador los arregle"
              >
                <span className="texto-largo">Ver problemas</span>
                <span className="texto-corto">Problemas</span>
              </button>
              <button className="boton-ofrecer" onClick={() => navegar("/ofrecer-servicios")} title="Ofrecer mi servicio">
                <span className="texto-largo">Ofrecer mi servicio</span>
                <span className="texto-corto">Ofrecer</span>
              </button>

              <button
                className={`boton-campana boton-mensajes-nav ${mensajesNoLeidos > 0 ? "con-pendientes" : ""}`}
                onClick={() => navegar("/mensajes")}
                aria-label={`Mensajes${mensajesNoLeidos ? ` (${mensajesNoLeidos} sin leer)` : ""}`}
                title="Mensajes"
              >
                <IconoMensajes />
                {mensajesNoLeidos > 0 && (
                  <span className="insignia-campana">{mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}</span>
                )}
              </button>

              <div className="contenedor-desplegable" ref={referenciaCampana}>
                <button
                  className={`boton-campana ${cantidadNoLeidas > 0 ? "con-pendientes" : ""} ${campanaAbierta ? "abierta" : ""}`}
                  onClick={alternarCampana}
                  aria-label={`Notificaciones${cantidadNoLeidas ? ` (${cantidadNoLeidas} sin leer)` : ""}`}
                  aria-expanded={campanaAbierta}
                  title="Notificaciones"
                >
                  <IconoCampana />
                  {cantidadNoLeidas > 0 && (
                    <span className="insignia-campana">{cantidadNoLeidas > 9 ? "9+" : cantidadNoLeidas}</span>
                  )}
                </button>
                {campanaAbierta && (
                  <div
                    className="panel-desplegable panel-notificaciones"
                    style={{ "--arriba-panel": `${arribaPanel}px` }}
                    role="dialog"
                    aria-label="Notificaciones"
                  >
                    <div className="encabezado-notificaciones">
                      <span className="titulo-notificaciones">Notificaciones</span>
                      {noLeidasAlAbrir.length > 0 && (
                        <span className="cantidad-nuevas">
                          {noLeidasAlAbrir.length === 1 ? "1 nueva" : `${noLeidasAlAbrir.length} nuevas`}
                        </span>
                      )}
                    </div>
                    {items.length === 0 ? (
                      <div className="vacio-notificaciones">
                        <IconoNotificacion nombre="campana" />
                        <strong>No tenés notificaciones</strong>
                        <p>Te avisamos acá cuando te manden una propuesta, te respondan una solicitud o te dejen una reseña.</p>
                      </div>
                    ) : (
                      <div className="lista-notificaciones">
                        {[...items].reverse().map((item) => {
                          const nueva = noLeidasAlAbrir.includes(item.clave);
                          const conFoto = Boolean(item.foto || item.nombre);
                          return (
                            <button
                              type="button"
                              key={item.clave}
                              className={`item-notificacion ${nueva ? "no-leida" : ""} ${item.enlace ? "" : "sin-enlace"}`}
                              onClick={() => abrirNotificacion(item)}
                            >
                              <span className={`icono-notificacion ${item.tono} ${conFoto ? "con-foto" : ""}`}>
                                {conFoto ? (
                                  <>
                                    <Avatar src={item.foto} nombre={item.nombre} tamano={38} />
                                    <span className={`mini-icono ${item.tono}`}><IconoNotificacion nombre={item.icono} /></span>
                                  </>
                                ) : (
                                  <IconoNotificacion nombre={item.icono} />
                                )}
                              </span>
                              <span className="cuerpo-notificacion">
                                <span className="titulo-item-notificacion">{item.titulo}</span>
                                {item.detalle && <span className="detalle-item-notificacion">{item.detalle}</span>}
                                {item.fecha && <span className="tiempo-item-notificacion">{tiempoRelativo(item.fecha, ahora)}</span>}
                              </span>
                              {nueva && <span className="punto-notificacion" aria-label="Nueva" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="contenedor-desplegable" ref={referenciaMenu}>
                <button
                  className="boton-usuario"
                  onClick={() => {
                    setMenuAbierto((prev) => !prev);
                    setCampanaAbierta(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menuAbierto}
                >
                  <Avatar
                    className="avatar-usuario"
                    src={usuario.fotoPerfilURL}
                    nombre={usuario.nombre}
                    tamano={30}
                  />
                  <span className="nombre-boton-usuario" title={usuario?.nombre || undefined}>{primerNombre}</span>
                  <IconoFlecha abierta={menuAbierto} />
                </button>
                {menuAbierto && (
                  <div className="panel-desplegable menu-avatar" role="menu">
                    <div className="menu-avatar-cabecera">
                      <Avatar src={usuario.fotoPerfilURL} nombre={usuario.nombre} tamano={44} />
                      <div className="menu-avatar-datos">
                        <div className="menu-avatar-nombre">{usuario.nombre}</div>
                        {usuario.correo && <div className="menu-avatar-correo">{usuario.correo}</div>}
                        <button
                          className="boton-cambiar-foto"
                          onClick={() => referenciaInputFoto.current?.click()}
                          disabled={subiendoFoto}
                        >
                          {subiendoFoto
                            ? "Subiendo foto..."
                            : usuario.fotoPerfilURL ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
                        </button>
                        <input
                          ref={referenciaInputFoto}
                          type="file"
                          accept={TIPOS_FOTO_PERFIL.join(",")}
                          style={{ display: "none" }}
                          onChange={manejarCambioFoto}
                        />
                      </div>
                    </div>
                    {errorFoto && <div className="error-foto-menu">{errorFoto}</div>}
                    <div className="menu-avatar-separador" />
                    <button className="menu-avatar-item destacado" onClick={() => ir("/subir-problema")}>
                      + Subir un problema
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/mis-problemas")}>
                      Mis problemas
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/problemas")}>
                      Problemas publicados
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/problemas?vista=citas")}>
                      Mis citas
                    </button>
                    <div className="menu-avatar-separador" />
                    <button className="menu-avatar-item" onClick={() => ir("/buscar")}>
                      Buscar trabajadores
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/mis-pedidos")}>
                      Mis pedidos (solicitudes que mandé)
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/buscar?vista=solicitudes")}>
                      Mis solicitudes
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/solicitudes-recibidas")}>
                      Solicitudes recibidas
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/trabajos-pendientes")}>
                      Trabajos pendientes
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/mensajes")}>
                      Mensajes{mensajesNoLeidos > 0 ? ` (${mensajesNoLeidos})` : ""}
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/mis-servicios")}>
                      Mis servicios
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/ofrecer-servicios")}>
                      Ofrecer servicios
                    </button>
                    <div className="menu-avatar-separador" />
                    <button className="menu-avatar-item" onClick={() => ir("/mi-cuenta")}>
                      Mi cuenta
                    </button>
                    {usuario?.esAdmin && (
                      <button className="menu-avatar-item" onClick={() => ir("/admin")}>
                        Panel de administración
                      </button>
                    )}
                    <button className="menu-avatar-item salir" onClick={manejarCerrarSesion}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="enlace-nav" onClick={() => navegar("/paso1")}>
                Registrarme
              </button>
              <button className="boton-iniciar-sesion-nav" onClick={() => navegar("/login")}>
                Iniciar sesión
              </button>
            </>
          )}
        </nav>
      </header>
      {usuario && <AvisoConfirmarEmail />}
    </>
  );
}
