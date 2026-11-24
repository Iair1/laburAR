import { nombreCorto, nombreCortoDe } from "../nombres";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import { ResenasModal, DejarResenaModal } from "../componentes/Resenas";
import { usePendientesResenas } from "../usePendientesResenas";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { comprimirFoto, TIPOS_FOTO_PERFIL } from "../api";
import { obtenerMisChats, obtenerContactos, obtenerChat, mandarMensaje, borrarMensaje, EVENTO_MENSAJES } from "../mensajesApi";
import { MenuModeracion, DenunciarModal } from "../componentes/Moderacion";
import { desbloquearUsuario } from "../cuentaApi";
import { ConfirmarModal } from "../componentes/ProblemaModales";
import { estilosProblemas } from "../estilosProblemas";
import { avisarCambio } from "../servidor";
import { normalizarTexto } from "../constantes";
import { fechaLarga, fechaCorta } from "../problemasDatos";
import logoIcono from "../assets/logo-icono.svg";

const estilos = `
  .pagina-mensajes {
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f3f1ef;
  }
  .contenedor-mensajes {
    max-width: 1220px; margin: 0 auto; padding: 1.25rem 1.5rem 1.5rem;
    height: calc(100vh - 60px); box-sizing: border-box;
  }
  .caja-mensajes {
    display: grid; grid-template-columns: 340px minmax(0, 1fr); height: 100%;
    background: #fff; border: 1px solid #ddd3d3; border-radius: 18px; overflow: hidden;
    box-shadow: 0 10px 30px rgba(59,30,13,0.08);
  }

  /* --- columna de conversaciones --- */
  .columna-chats { display: flex; flex-direction: column; border-right: 1px solid #eee5e5; min-height: 0; min-width: 0; background: #fcfafa; }
  .cabecera-chats { padding: 16px 16px 10px; }
  .titulo-chats { font-size: 1.25rem; font-weight: 900; color: #111; text-transform: uppercase; letter-spacing: 0.01em; }
  .buscar-chats {
    display: flex; align-items: center; gap: 8px; margin-top: 10px; background: #fff; border: 1px solid #e2d6d6;
    border-radius: 999px; padding: 0 12px; height: 36px;
  }
  .buscar-chats svg { width: 14px; height: 14px; color: #777; }
  .buscar-chats input { flex: 1; border: none; outline: none; font-size: 0.82rem; background: none; font-family: inherit; min-width: 0; }
  .lista-chats { flex: 1; overflow-y: auto; padding: 4px 10px 14px; }
  .titulo-grupo-chats { font-size: 0.66rem; font-weight: 800; color: #9b8a8a; text-transform: uppercase; letter-spacing: 0.07em; padding: 12px 8px 6px; }
  .item-chat {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border-radius: 14px; border: 1px solid transparent;
    background: none; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.12s;
  }
  .item-chat + .item-chat { margin-top: 4px; }
  .item-chat:hover { background: #f4eeee; }
  .item-chat.activo { background: #fff; border-color: #e1cccc; box-shadow: 0 4px 12px rgba(87,1,1,0.07); }
  .datos-item-chat { flex: 1; min-width: 0; }
  .fila-item-chat { display: flex; align-items: baseline; gap: 6px; }
  .nombre-item-chat { flex: 1; min-width: 0; font-size: 0.86rem; font-weight: 700; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hora-item-chat { font-size: 0.66rem; color: #999; white-space: nowrap; }
  .hora-item-chat.nuevo { color: #570101; font-weight: 700; }
  .vista-item-chat { flex: 1; min-width: 0; font-size: 0.74rem; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
  .vista-item-chat.nuevo { color: #1a1a1a; font-weight: 600; }
  .globo-no-leidos {
    min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #570101; color: #fff; font-size: 0.66rem;
    font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .avatar-soporte {
    width: 42px; height: 42px; border-radius: 50%; background: #fff; border: 1.5px solid #570101; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .avatar-soporte img { width: 26px; height: 26px; }
  .vacio-chats { font-size: 0.8rem; color: #777; text-align: center; padding: 1.5rem 1rem; line-height: 1.5; }

  /* --- panel del chat --- */
  .panel-chat { display: flex; flex-direction: column; min-height: 0; min-width: 0; background: #fff; }
  .cabecera-chat { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #eee5e5; }
  .volver-chat {
    display: none; width: 34px; height: 34px; border-radius: 50%; border: none; background: #f4eeee; color: #570101;
    font-size: 1.1rem; cursor: pointer; flex-shrink: 0;
  }
  .datos-cabecera-chat { flex: 1; min-width: 0; }
  .nombre-cabecera-chat { font-size: 1rem; font-weight: 800; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub-cabecera-chat { font-size: 0.72rem; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .boton-cabecera-chat {
    border: 1px solid #d9c8c8; background: #fff; color: #3b1e0d; border-radius: 999px; padding: 6px 12px; font-size: 0.72rem;
    font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .boton-cabecera-chat:hover { background: #f4eeee; }
  .boton-cabecera-chat.calificar { background: #570101; border-color: #570101; color: #fff; }
  .boton-cabecera-chat.calificar:hover { background: #3b1e0d; }
  .citas-chat { display: flex; gap: 8px; padding: 8px 18px; border-bottom: 1px solid #f1eaea; background: #fcf8f8; overflow-x: auto; }
  .cita-chat {
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 0.72rem; color: #3b1e0d;
    background: #fff; border: 1px solid #ecdede; border-radius: 999px; padding: 4px 10px;
  }
  .cita-chat .punto-cita { width: 7px; height: 7px; border-radius: 50%; background: #1e6b2d; }
  .cita-chat.terminada .punto-cita { background: #8a7a5b; }
  .cita-chat.por-revisar .punto-cita { background: #1d4f8c; }
  .cita-chat.cancelado .punto-cita { background: #a1261e; }

  .mensajes-chat {
    flex: 1; overflow-y: auto; padding: 16px 18px 8px; min-height: 0;
    background: #fbf9f8 radial-gradient(circle at 1px 1px, rgba(87,1,1,0.05) 1px, transparent 0) 0 0 / 22px 22px;
  }
  .separador-dia { display: flex; justify-content: center; margin: 12px 0 10px; }
  .separador-dia span {
    font-size: 0.68rem; font-weight: 700; color: #6b5a5a; background: #efe7e7; border-radius: 999px; padding: 4px 12px; text-transform: capitalize;
  }
  .fila-mensaje { display: flex; margin-top: 2px; }
  .fila-mensaje.mio { justify-content: flex-end; }
  .fila-mensaje.nuevo-grupo { margin-top: 10px; }
  .burbuja {
    max-width: min(560px, 78%); padding: 8px 11px 6px; border-radius: 16px; font-size: 0.86rem; line-height: 1.42;
    color: #1a1a1a; background: #fff; border: 1px solid #ebe1e1; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .fila-mensaje:not(.mio) .burbuja { border-top-left-radius: 6px; }
  .fila-mensaje.mio .burbuja { background: #6b0d0d; color: #fff; border-color: #6b0d0d; border-top-right-radius: 6px; }
  .burbuja.enviando { opacity: 0.65; }
  .burbuja.con-error { background: #fbeceb; color: #8f1d17; border-color: #f0c2bf; }
  .burbuja img { display: block; max-width: 100%; max-height: 280px; border-radius: 10px; margin: 2px 0 6px; cursor: zoom-in; }
  .pie-burbuja { display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 0.62rem; opacity: 0.75; margin-top: 3px; }
  .fila-mensaje { position: relative; }
  .boton-opciones-mensaje {
    align-self: center; width: 26px; height: 26px; border-radius: 50%; border: none; background: none; color: #8a7a7a;
    cursor: pointer; font-size: 1rem; line-height: 1; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; font-family: inherit;
  }
  .fila-mensaje:hover .boton-opciones-mensaje, .boton-opciones-mensaje:focus-visible, .boton-opciones-mensaje.abierto { opacity: 1; }
  .boton-opciones-mensaje:hover { background: #f4eeee; color: #570101; }
  @media (hover: none) { .boton-opciones-mensaje { opacity: 0.55; } }
  .menu-opciones-mensaje {
    position: absolute; top: calc(100% - 2px); z-index: 20; background: #fff; border: 1px solid #e3d3d3; border-radius: 10px;
    box-shadow: 0 8px 22px rgba(0,0,0,0.14); padding: 4px; min-width: 150px;
  }
  .fila-mensaje.mio .menu-opciones-mensaje { right: 0; }
  .fila-mensaje:not(.mio) .menu-opciones-mensaje { left: 0; }
  .menu-opciones-mensaje button {
    display: block; width: 100%; text-align: left; border: none; background: none; border-radius: 7px; padding: 8px 10px;
    font-size: 0.8rem; font-weight: 600; color: #b3261e; cursor: pointer; font-family: inherit;
  }
  .menu-opciones-mensaje button:hover { background: #fbeceb; }
  .aviso-redactar .enlace-desbloquear { background: none; border: none; color: #570101; font-weight: 800; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; text-decoration: underline; }
  .pie-burbuja .leido { color: #9fd3ff; opacity: 1; font-weight: 800; }
  .fila-mensaje:not(.mio) .pie-burbuja { color: #888; }
  .reintentar-mensaje { background: none; border: none; color: #8f1d17; font-weight: 700; text-decoration: underline; cursor: pointer; font-size: 0.66rem; }
  .bienvenida-chat { text-align: center; color: #777; font-size: 0.82rem; padding: 2.5rem 1rem; line-height: 1.5; }
  .bienvenida-chat strong { color: #1a1a1a; }

  .preguntas-rapidas { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 18px 0; }
  .pregunta-rapida {
    border: 1px solid #d9c8c8; background: #fff; color: #570101; border-radius: 999px; padding: 6px 12px; font-size: 0.74rem;
    font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .pregunta-rapida:hover { background: #f4eeee; }

  .redactar { padding: 10px 14px 14px; border-top: 1px solid #eee5e5; background: #fff; }
  .foto-a-mandar { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 8px 4px; font-size: 0.74rem; color: #555; }
  .foto-a-mandar img { width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
  .foto-a-mandar button { border: none; background: #f4eeee; color: #570101; border-radius: 999px; padding: 3px 9px; cursor: pointer; font-size: 0.7rem; font-weight: 700; }
  .fila-redactar {
    display: flex; align-items: flex-end; gap: 8px; background: #f6f3f2; border: 1px solid #e6dcdc; border-radius: 22px; padding: 6px 6px 6px 8px;
  }
  .fila-redactar:focus-within { border-color: #a37a7a; background: #fff; }
  .boton-foto-chat, .boton-mandar {
    width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .boton-foto-chat { background: none; color: #6b5a5a; }
  .boton-foto-chat:hover { background: #ece4e4; color: #570101; }
  .boton-mandar { background: #6b0d0d; color: #fff; }
  .boton-mandar:hover { background: #570101; }
  .boton-mandar:disabled { background: #c9b8b8; cursor: not-allowed; }
  .boton-foto-chat svg, .boton-mandar svg { width: 19px; height: 19px; }
  .campo-mensaje {
    flex: 1; min-width: 0; border: none; outline: none; resize: none; background: none; font-family: inherit; font-size: 0.88rem;
    line-height: 1.4; padding: 9px 4px; max-height: 120px; color: #1a1a1a;
  }
  .aviso-redactar { font-size: 0.74rem; color: #6b5300; background: #fff8e1; border: 1px solid #ffe08a; border-radius: 12px; padding: 9px 12px; text-align: center; }
  .error-redactar { font-size: 0.74rem; color: #b3261e; font-weight: 600; margin: 0 0 6px 6px; }

  .sin-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; color: #666; }
  .sin-chat .icono-sin-chat { width: 72px; height: 72px; border-radius: 50%; background: #f4eeee; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .sin-chat svg { width: 34px; height: 34px; color: #570101; }
  .sin-chat strong { font-size: 1rem; color: #1a1a1a; }
  .sin-chat p { font-size: 0.82rem; margin-top: 6px; max-width: 360px; line-height: 1.5; }
  .esqueleto-chat { height: 58px; border-radius: 14px; margin-top: 6px; background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%); background-size: 400% 100%; animation: brillo-chat 1.3s ease infinite; }
  @keyframes brillo-chat { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  .visor-foto-chat {
    position: fixed; inset: 0; z-index: 400; background: rgba(10,10,10,0.9); display: flex; align-items: center; justify-content: center;
    padding: 2rem; cursor: zoom-out;
  }
  .visor-foto-chat img { max-width: 100%; max-height: 100%; border-radius: 8px; }

  @media (max-width: 760px) {
    .contenedor-mensajes { padding: 0; height: calc(100vh - 60px); }
    .caja-mensajes { grid-template-columns: minmax(0, 1fr); border-radius: 0; border: none; }
    .caja-mensajes.con-chat .columna-chats { display: none; }
    .caja-mensajes:not(.con-chat) .panel-chat { display: none; }
    .volver-chat { display: flex; align-items: center; justify-content: center; }
    .burbuja { max-width: 86%; }
    .cabecera-chat { padding: 10px 12px; }
    .mensajes-chat { padding: 12px 10px 6px; }
    .boton-cabecera-chat { padding: 6px 9px; }
    .texto-boton-cabecera { display: none; }
    .cabecera-chat { gap: 8px; }
  }
`;

const ID_SOPORTE = "soporte";

function IconoLupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function IconoCamara() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function IconoMandar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.4 20.6l17.8-8a.7.7 0 0 0 0-1.2l-17.8-8a.7.7 0 0 0-1 .8L4.6 11 13 12l-8.4 1-2.2 6.8a.7.7 0 0 0 1 .8z" />
    </svg>
  );
}
function IconoChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8 11h8M8 14.5h5" />
    </svg>
  );
}

/* ---------------- fechas ---------------- */

function aFecha(valor) {
  const d = valor ? new Date(valor) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}
function claveDia(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function etiquetaDia(d) {
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (claveDia(d) === claveDia(hoy)) return "Hoy";
  if (claveDia(d) === claveDia(ayer)) return "Ayer";
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}
function horaCorta(d) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fechaEnLista(valor) {
  const d = aFecha(valor);
  if (!d) return "";
  const etiqueta = etiquetaDia(d);
  if (etiqueta === "Hoy") return horaCorta(d);
  if (etiqueta === "Ayer") return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const ESTADOS_CITA = {
  pendiente: { texto: "Cita agendada", clase: "" },
  terminada: { texto: "Terminado", clase: "terminada" },
  "por revisar": { texto: "Solicitud por responder", clase: "por-revisar" },
  cancelado: { texto: "Cancelado", clase: "cancelado" },
};

function resumenCita(c) {
  const titulo = String(c.texto || "").split("\n")[0].replace(/^Horario preferido:[^.]*\.\s*/i, "").replace(/^Barrio:[^.]*\.\s*/i, "");
  const corto = titulo.length > 40 ? `${titulo.slice(0, 38).trim()}…` : titulo;
  const dia = c.estado === "pendiente" || c.estado === "terminada" ? c.inicio : null;
  return [corto || c.aptitud || "Trabajo", dia ? (c.inicio === c.fin ? fechaCorta(dia) : `${fechaCorta(c.inicio)} al ${fechaCorta(c.fin)}`) : ""].filter(Boolean).join(" · ");
}

/* ---------------- atención al usuario (respuestas automáticas) ---------------- */

const PREGUNTAS_FRECUENTES = [
  {
    pregunta: "¿Cómo subo un problema?",
    claves: ["subo", "subir", "publicar", "problema", "arreglar"],
    respuesta: "Tocá \"Subir un problema\" en el inicio o en el menú de tu foto. Contá qué pasa, elegí tu zona y barrio, entre qué fechas y en qué horario pueden ir. Los trabajadores te mandan propuestas con día, hora y precio: las ves en \"Mis problemas\" y te llega el aviso en la campanita.",
  },
  {
    pregunta: "¿Cómo ofrezco mis servicios?",
    claves: ["ofrezco", "ofrecer", "servicio", "trabajador", "publicar mi"],
    respuesta: "Tocá \"Ofrecer mi servicio\" arriba. Elegí la categoría, tu zona, cuánto cobrás por hora y contá tu experiencia. Después podés editar todo en \"Mis servicios\", y subir fotos de trabajos que hiciste.",
  },
  {
    pregunta: "¿Cómo agendo una cita para arreglar un problema?",
    claves: ["agendo", "agendar", "cita", "trabajar", "ver problemas", "propuesta", "precio"],
    respuesta: "Entrá a \"Ver problemas\" (arriba, al lado de \"Ofrecer mi servicio\"). Elegí uno, tocá \"Enviar propuesta\" y poné el día, la hora y cuánto cobrarías. Si el cliente acepta, queda la cita agendada; también te puede hacer una contraoferta. Lo seguís en \"Mis propuestas\".",
  },
  {
    pregunta: "¿Cómo se acuerda el precio?",
    claves: ["precio", "cobrar", "cobra", "pago", "pagar", "contraoferta", "oferta", "presupuesto", "cuanto"],
    respuesta: "En los problemas publicados, cada trabajador propone día, hora y precio. El cliente puede aceptar, mandarle una contraoferta con otro precio o rechazarla (y elegir si mantiene o elimina la publicación). Cuando alguien acepta, queda la cita con ese precio. El pago lo arreglan entre ustedes: LaburAR no cobra comisión.",
  },
  {
    pregunta: "¿Con quién puedo chatear?",
    claves: ["chatear", "chat", "mensaje", "escribir", "hablar"],
    respuesta: "Con las personas con las que tenés una cita, una solicitud o una propuesta de precio abierta. Las encontrás acá, en \"Personas con citas\", o con el botón \"Escribirle\" en cada cita.",
  },
  {
    pregunta: "¿Cómo dejo una reseña?",
    claves: ["reseña", "resena", "calificar", "estrellas", "opinion"],
    respuesta: "Cuando termina un trabajo te aparece un aviso para dejar la reseña (a los dos: cliente y trabajador). Si el trabajo ya se hizo, en la cita tocá \"Ya está hecho\" y listo.",
  },
  {
    pregunta: "¿Cómo cancelo una cita?",
    claves: ["cancelo", "cancelar", "no puedo ir", "suspender"],
    respuesta: "Si publicaste el problema, entrá a \"Mis problemas\" y tocá \"Cancelar cita\". Si sos el trabajador, en \"Ver problemas\" → \"Mis citas\". A la otra persona le llega el aviso.",
  },
  {
    pregunta: "¿Cómo cambio mi zona o mi contraseña?",
    claves: ["zona", "barrio", "contraseña", "contrasena", "cuenta", "perfil", "foto"],
    respuesta: "En \"Mi cuenta\" (en el menú de tu foto) podés cambiar tu zona, tu dirección, contar algo sobre vos y cambiar la contraseña.",
  },
];

function responderSoporte(texto) {
  const q = normalizarTexto(texto);
  let mejor = null;
  let puntos = 0;
  for (const f of PREGUNTAS_FRECUENTES) {
    const p = f.claves.filter((c) => q.includes(normalizarTexto(c))).length;
    if (p > puntos) {
      mejor = f;
      puntos = p;
    }
  }
  return mejor
    ? mejor.respuesta
    : "No estoy seguro de haber entendido 🤔. Probá con alguna de las preguntas de abajo, o contame con otras palabras qué necesitás.";
}

function PanelSoporte({ nombre, onVolver }) {
  const [charla, setCharla] = useState(() => [
    { id: 1, mio: false, texto: `¡Hola${nombre ? `, ${nombre}` : ""}! 👋 Soy el asistente de LaburAR. Elegí una pregunta o escribime qué necesitás.` },
  ]);
  const [texto, setTexto] = useState("");
  const fin = useRef(null);
  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [charla]);

  const preguntar = (pregunta, respuesta) => {
    setCharla((c) => [...c, { id: c.length + 1, mio: true, texto: pregunta }, { id: c.length + 2, mio: false, texto: respuesta }]);
  };
  const mandar = () => {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    preguntar(t, responderSoporte(t));
  };

  return (
    <section className="panel-chat" aria-label="Atención al usuario">
      <header className="cabecera-chat">
        <button className="volver-chat" onClick={onVolver} aria-label="Volver a las conversaciones">‹</button>
        <div className="avatar-soporte"><img src={logoIcono} alt="" /></div>
        <div className="datos-cabecera-chat">
          <div className="nombre-cabecera-chat">Atención al usuario</div>
          <div className="sub-cabecera-chat">Respuestas automáticas · Preguntas frecuentes</div>
        </div>
      </header>
      <div className="mensajes-chat">
        {charla.map((m, i) => (
          <div key={m.id} className={`fila-mensaje ${m.mio ? "mio" : ""} ${i === 0 || charla[i - 1].mio !== m.mio ? "nuevo-grupo" : ""}`}>
            <div className="burbuja">{m.texto}</div>
          </div>
        ))}
        <div ref={fin} />
      </div>
      <div className="preguntas-rapidas">
        {PREGUNTAS_FRECUENTES.map((f) => (
          <button key={f.pregunta} type="button" className="pregunta-rapida" onClick={() => preguntar(f.pregunta, f.respuesta)}>
            {f.pregunta}
          </button>
        ))}
      </div>
      <div className="redactar">
        <div className="fila-redactar">
          <textarea
            className="campo-mensaje"
            rows={1}
            placeholder="Escribí tu pregunta..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                mandar();
              }
            }}
            aria-label="Pregunta para atención al usuario"
          />
          <button className="boton-mandar" onClick={mandar} disabled={!texto.trim()} aria-label="Enviar">
            <IconoMandar />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- chat con otra persona ---------------- */

const CADA_CUANTO_CHAT = 3000; // ms
const CADA_CUANTO_LISTA = 12000;

// "Desbloquear" dentro del aviso del chat
function MenuDesbloquear({ otro, onListo }) {
  const [procesando, setProcesando] = useState(false);
  if (!otro) return null;
  return (
    <button
      type="button"
      className="enlace-desbloquear"
      disabled={procesando}
      onClick={async () => {
        setProcesando(true);
        try {
          await desbloquearUsuario(otro.id);
          await onListo?.();
        } catch {
          /* se puede reintentar */
        } finally {
          setProcesando(false);
        }
      }}
    >
      {procesando ? "Desbloqueando..." : "Desbloquear"}
    </button>
  );
}

function PanelChat({ otroId, onVolver, onSesionVencida, onActividad }) {
  const [datos, setDatos] = useState(null); // { otro, citas, puedeEscribir, yo }
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState(null); // { archivo, previa }
  const [errorRedactar, setErrorRedactar] = useState("");
  const [fotoAbierta, setFotoAbierta] = useState(null);
  const [viendoResenas, setViendoResenas] = useState(false);
  const [calificando, setCalificando] = useState(null);
  const [menuMensaje, setMenuMensaje] = useState(null); // id del mensaje con el menú abierto
  const [borrando, setBorrando] = useState(null); // mensaje a borrar (confirmación)
  const [procesandoBorrar, setProcesandoBorrar] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState("");
  const [denunciandoMensaje, setDenunciandoMensaje] = useState(null);
  const pendientesResena = usePendientesResenas();
  const ultimoId = useRef(0);
  const mensajesRef = useRef([]);
  const zonaMensajes = useRef(null);
  const campo = useRef(null);
  const elegirFoto = useRef(null);
  const pegadoAbajo = useRef(true);

  const bajar = useCallback((suave = false) => {
    const zona = zonaMensajes.current;
    if (zona) zona.scrollTo({ top: zona.scrollHeight, behavior: suave ? "smooth" : "auto" });
  }, []);

  // Carga inicial de la conversación
  useEffect(() => {
    let activo = true;
    ultimoId.current = 0;
    obtenerChat(otroId)
      .then((d) => {
        if (!activo) return;
        setDatos({ otro: d.otro, citas: d.citas, puedeEscribir: d.puedeEscribir, yo: d.yo, yoBloquee: d.yoBloquee, bloqueado: d.bloqueado });
        setMensajes(d.mensajes);
        ultimoId.current = d.mensajes.length ? d.mensajes[d.mensajes.length - 1].id : 0;
        avisarCambio(EVENTO_MENSAJES); // se marcaron como leídos
        requestAnimationFrame(() => bajar());
      })
      .catch((err) => {
        if (!activo) return;
        if (err.status === 401) onSesionVencida();
        else setError(err.message || "No se pudo abrir la conversación.");
      })
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [otroId, bajar, onSesionVencida]);

  useEffect(() => {
    mensajesRef.current = mensajes;
  }, [mensajes]);

  // Cada pocos segundos (solo si la pestaña está a la vista): mensajes nuevos y,
  // si hay mensajes míos sin leer, también esos (para que aparezcan las dos tildes).
  useEffect(() => {
    if (!datos) return undefined;
    const intervalo = setInterval(async () => {
      if (document.hidden) return;
      const misSinLeer = mensajesRef.current.filter((m) => m.de === datos.yo && !m.leido && typeof m.id === "number");
      const desde = misSinLeer.length ? Math.min(ultimoId.current, misSinLeer[0].id - 1) : ultimoId.current;
      try {
        const d = await obtenerChat(otroId, desde);
        if (!d.mensajes.length) return;
        const nuevos = d.mensajes.filter((m) => m.id > ultimoId.current);
        setMensajes((lista) => {
          const porId = new Map(d.mensajes.map((m) => [m.id, m]));
          const actualizada = lista.map((m) => porId.get(m.id) || m);
          const ids = new Set(actualizada.map((m) => m.id));
          return [...actualizada, ...d.mensajes.filter((m) => !ids.has(m.id))];
        });
        ultimoId.current = Math.max(ultimoId.current, d.mensajes[d.mensajes.length - 1].id);
        if (nuevos.some((m) => m.de === otroId)) {
          avisarCambio(EVENTO_MENSAJES);
          onActividad?.();
        }
        if (nuevos.length && pegadoAbajo.current) requestAnimationFrame(() => bajar(true));
      } catch {
        /* se reintenta en la próxima vuelta */
      }
    }, CADA_CUANTO_CHAT);
    return () => clearInterval(intervalo);
  }, [datos, otroId, bajar, onActividad]);

  useEffect(() => {
    if (!foto?.previa) return undefined;
    return () => URL.revokeObjectURL(foto.previa);
  }, [foto?.previa]);

  // Después de bloquear/desbloquear: se vuelve a preguntar si se puede escribir
  const recargarPermisos = async () => {
    try {
      const d = await obtenerChat(otroId);
      setDatos((previo) => ({ ...(previo || {}), puedeEscribir: d.puedeEscribir, yoBloquee: d.yoBloquee, bloqueado: d.bloqueado }));
    } catch {
      /* queda como estaba */
    }
  };

  // Cerrar el menú de un mensaje al tocar afuera
  useEffect(() => {
    if (menuMensaje == null) return undefined;
    const cerrar = () => setMenuMensaje(null);
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, [menuMensaje]);

  const confirmarBorrar = async () => {
    setProcesandoBorrar(true);
    setErrorBorrar("");
    try {
      await borrarMensaje(borrando.id);
      setMensajes((lista) => lista.filter((m) => m.id !== borrando.id));
      setBorrando(null);
      onActividad?.(); // actualiza la lista de conversaciones (el último mensaje)
    } catch (err) {
      setErrorBorrar(err.message || "No se pudo borrar el mensaje.");
    } finally {
      setProcesandoBorrar(false);
    }
  };

  const enviar = async (reintento = null) => {
    const contenido = reintento ? reintento.texto : texto.trim();
    const archivo = reintento ? reintento.archivo : foto?.archivo;
    if (!contenido && !archivo) return;
    setErrorRedactar("");
    const temporal = {
      id: `tmp-${Date.now()}`,
      de: datos?.yo,
      texto: contenido,
      imagen: reintento?.previa || foto?.previa || null,
      fecha: new Date().toISOString(),
      enviando: true,
      archivo,
      previa: reintento?.previa || foto?.previa || null,
    };
    setMensajes((lista) => [...lista.filter((m) => m.id !== reintento?.id), temporal]);
    if (!reintento) {
      setTexto("");
      setFoto(null);
    }
    requestAnimationFrame(() => bajar(true));
    try {
      const imagen = archivo ? await comprimirFoto(archivo, 1200) : null;
      const guardado = await mandarMensaje(otroId, contenido, imagen);
      setMensajes((lista) => {
        const sinTemporal = lista.filter((m) => m.id !== temporal.id);
        return sinTemporal.some((m) => m.id === guardado.id) ? sinTemporal : [...sinTemporal, guardado];
      });
      ultimoId.current = Math.max(ultimoId.current, guardado.id);
      onActividad?.();
    } catch (err) {
      if (err.status === 401) {
        onSesionVencida();
        return;
      }
      setMensajes((lista) => lista.map((m) => (m.id === temporal.id ? { ...m, enviando: false, error: true } : m)));
      setErrorRedactar(err.message || "No se pudo mandar el mensaje.");
    }
  };

  const manejarFoto = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!TIPOS_FOTO_PERFIL.includes(archivo.type)) {
      setErrorRedactar("La foto tiene que ser JPG, PNG o WEBP.");
      return;
    }
    setErrorRedactar("");
    setFoto({ archivo, previa: URL.createObjectURL(archivo) });
    campo.current?.focus();
  };

  const otro = datos?.otro;
  const resenaPendiente = otro ? pendientesResena.find((p) => p.otro.id === otro.id) : null;
  const citaActiva = datos?.citas?.find((c) => c.estado === "pendiente") || datos?.citas?.[0];
  const subtitulo = citaActiva
    ? `${citaActiva.miRol === "trabajador" ? "Cliente" : "Trabajador"}${citaActiva.aptitud ? ` · ${citaActiva.aptitud}` : ""}${citaActiva.estado === "pendiente" && citaActiva.inicio ? ` · Cita el ${fechaLarga(citaActiva.inicio).toLowerCase()}` : ""}`
    : otro?.zona || "";

  return (
    <section className="panel-chat" aria-label={otro ? `Chat con ${otro.nombre}` : "Chat"}>
      <header className="cabecera-chat">
        <button className="volver-chat" onClick={onVolver} aria-label="Volver a las conversaciones">‹</button>
        <Avatar src={otro?.foto} nombre={otro?.nombre || "?"} tamano={42} />
        <div className="datos-cabecera-chat">
          <div className="nombre-cabecera-chat">{otro?.nombre || (cargando ? "Cargando..." : "Conversación")}</div>
          <div className="sub-cabecera-chat">{subtitulo}</div>
        </div>
        {resenaPendiente && (
          <button className="boton-cabecera-chat calificar" onClick={() => setCalificando(resenaPendiente)}>
            ⭐ Calificar
          </button>
        )}
        {otro && (
          <button className="boton-cabecera-chat" onClick={() => setViendoResenas(true)} aria-label={`Reseñas de ${otro.nombre}`} title="Reseñas">
            ★<span className="texto-boton-cabecera"> Reseñas</span>
          </button>
        )}
        {otro && (
          <MenuModeracion
            usuario={{ id: otro.id, nombre: otro.nombre, esEmpresa: otro.esEmpresa }}
            bloqueado={datos?.yoBloquee}
            solicitudid={citaActiva?.id}
            onCambioBloqueo={recargarPermisos}
          />
        )}
      </header>

      {datos?.citas?.length > 0 && (
        <div className="citas-chat" aria-label="Citas y solicitudes entre ustedes">
          {datos.citas.map((c) => (
            <span key={c.id} className={`cita-chat ${ESTADOS_CITA[c.estado]?.clase || ""}`} title={c.texto}>
              <span className="punto-cita" />
              <strong>{ESTADOS_CITA[c.estado]?.texto || c.estado}</strong> {resumenCita(c)}
            </span>
          ))}
        </div>
      )}

      <div
        className="mensajes-chat"
        ref={zonaMensajes}
        onScroll={(e) => {
          const z = e.currentTarget;
          pegadoAbajo.current = z.scrollHeight - z.scrollTop - z.clientHeight < 80;
        }}
        aria-live="polite"
      >
        {cargando ? (
          [0, 1, 2].map((i) => <div className="esqueleto-chat" key={i} style={{ width: `${60 - i * 12}%`, marginLeft: i === 1 ? "auto" : 0 }} />)
        ) : error ? (
          <p className="bienvenida-chat">{error}</p>
        ) : mensajes.length === 0 ? (
          <p className="bienvenida-chat">
            Todavía no se escribieron. <strong>Mandale un mensaje a {nombreCortoDe(otro)}</strong> para coordinar
            la dirección, el horario o pedirle una foto del problema.
          </p>
        ) : (
          mensajes.map((m, i) => {
            const fecha = aFecha(m.fecha);
            const anterior = mensajes[i - 1];
            const fechaAnterior = anterior ? aFecha(anterior.fecha) : null;
            const nuevoDia = Boolean(fecha) && (!fechaAnterior || claveDia(fechaAnterior) !== claveDia(fecha));
            const mio = m.de === datos?.yo;
            const nuevoGrupo = nuevoDia || !anterior || anterior.de !== m.de;
            return (
              <div key={m.id}>
                {nuevoDia && <div className="separador-dia"><span>{etiquetaDia(fecha)}</span></div>}
                <div className={`fila-mensaje ${mio ? "mio" : ""} ${nuevoGrupo ? "nuevo-grupo" : ""}`}>
                  {mio && typeof m.id === "number" && !m.enviando && (
                    <button
                      type="button"
                      className={`boton-opciones-mensaje ${menuMensaje === m.id ? "abierto" : ""}`}
                      aria-label="Opciones del mensaje"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuMensaje(menuMensaje === m.id ? null : m.id);
                      }}
                    >
                      ⋮
                    </button>
                  )}
                  {menuMensaje === m.id && (
                    <div className="menu-opciones-mensaje" role="menu" onClick={(e) => e.stopPropagation()}>
                      {mio ? (
                        <button role="menuitem" onClick={() => { setMenuMensaje(null); setErrorBorrar(""); setBorrando(m); }}>Eliminar mensaje</button>
                      ) : (
                        <button role="menuitem" onClick={() => { setMenuMensaje(null); setDenunciandoMensaje(m); }}>Denunciar mensaje</button>
                      )}
                    </div>
                  )}
                  <div className={`burbuja ${m.enviando ? "enviando" : ""} ${m.error ? "con-error" : ""}`}>
                    {m.imagen && (
                      <img src={m.imagen} alt="Foto del chat" onClick={() => setFotoAbierta(m.imagen)} />
                    )}
                    {m.texto}
                    <div className="pie-burbuja">
                      {m.error ? (
                        <>No se mandó · <button className="reintentar-mensaje" onClick={() => enviar(m)}>Reintentar</button></>
                      ) : (
                        <>
                          {fecha ? horaCorta(fecha) : ""}
                          {mio && (m.enviando ? " · enviando" : <span className={m.leido ? "leido" : ""} title={m.leido ? "Leído" : "Enviado"}>{m.leido ? " ✓✓" : " ✓"}</span>)}
                        </>
                      )}
                    </div>
                  </div>
                  {!mio && typeof m.id === "number" && (
                    <button
                      type="button"
                      className={`boton-opciones-mensaje ${menuMensaje === m.id ? "abierto" : ""}`}
                      aria-label="Opciones del mensaje"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuMensaje(menuMensaje === m.id ? null : m.id);
                      }}
                    >
                      ⋮
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="redactar">
        {datos && !datos.puedeEscribir ? (
          <p className="aviso-redactar">
            {datos.yoBloquee ? (
              <>
                Bloqueaste a {nombreCortoDe(otro, "esta persona")}: no se pueden escribir.{" "}
                <MenuDesbloquear otro={otro} onListo={recargarPermisos} />
              </>
            ) : datos.bloqueado ? (
              "No podés escribirle a este usuario."
            ) : (
              "Solo podés escribirle a alguien con quien tenés una cita o una solicitud."
            )}
          </p>
        ) : (
          <>
            {foto && (
              <div className="foto-a-mandar">
                <img src={foto.previa} alt="Foto para mandar" />
                <span>Foto lista para mandar</span>
                <button type="button" onClick={() => setFoto(null)}>Quitar</button>
              </div>
            )}
            {errorRedactar && <p className="error-redactar" role="alert">{errorRedactar}</p>}
            <div className="fila-redactar">
              <button className="boton-foto-chat" onClick={() => elegirFoto.current?.click()} aria-label="Mandar una foto" title="Mandar una foto" disabled={!datos}>
                <IconoCamara />
              </button>
              <input ref={elegirFoto} type="file" accept={TIPOS_FOTO_PERFIL.join(",")} style={{ display: "none" }} onChange={manejarFoto} />
              <textarea
                ref={campo}
                className="campo-mensaje"
                rows={1}
                maxLength={2000}
                placeholder="Escribí tu mensaje..."
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                aria-label={`Mensaje para ${otro?.nombre || "la otra persona"}`}
                disabled={!datos}
              />
              <button className="boton-mandar" onClick={() => enviar()} disabled={!datos || (!texto.trim() && !foto)} aria-label="Enviar mensaje">
                <IconoMandar />
              </button>
            </div>
          </>
        )}
      </div>

      {borrando && (
        <>
          <style>{estilosProblemas}</style>
          <ConfirmarModal
            titulo="¿Eliminar este mensaje?"
            texto="Se borra para los dos. No se puede deshacer."
            textoConfirmar="Eliminar"
            peligro
            procesando={procesandoBorrar}
            error={errorBorrar}
            onConfirmar={confirmarBorrar}
            onCerrar={() => setBorrando(null)}
          />
        </>
      )}
      {denunciandoMensaje && otro && (
        <DenunciarModal
          usuario={{ id: otro.id, nombre: otro.nombre, esEmpresa: otro.esEmpresa }}
          que="mensaje"
          mensajeid={denunciandoMensaje.id}
          solicitudid={citaActiva?.id}
          onCerrar={() => setDenunciandoMensaje(null)}
          onBloqueado={recargarPermisos}
        />
      )}
      {fotoAbierta && (
        <div className="visor-foto-chat" onClick={() => setFotoAbierta(null)} role="dialog" aria-label="Foto ampliada">
          <img src={fotoAbierta} alt="Foto ampliada" />
        </div>
      )}
      {viendoResenas && otro && (
        <ResenasModal
          userid={otro.id}
          nombre={otro.nombre}
          rolInicial={citaActiva?.miRol === "trabajador" ? "cliente" : "trabajador"}
          onCerrar={() => setViendoResenas(false)}
        />
      )}
      {calificando && <DejarResenaModal pendiente={calificando} onCerrar={() => setCalificando(null)} onListo={() => setCalificando(null)} />}
    </section>
  );
}

/* ---------------- página ---------------- */

export default function Mensajes() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  const [chats, setChats] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  const seleccion = parametros.get("con") || "";
  const otroId = seleccion && seleccion !== ID_SOPORTE ? Number(seleccion) : null;

  const irAlLogin = useCallback(() => {
    cerrarSesionCompleta();
    navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`);
  }, [navegar, ubicacion]);

  const cargarLista = useCallback(async () => {
    try {
      const [lista, personas] = await Promise.all([obtenerMisChats(), obtenerContactos()]);
      setChats(lista);
      setContactos(personas);
      setError("");
    } catch (err) {
      if (err.status === 401) irAlLogin();
      else setError(err.message || "No se pudieron cargar tus mensajes.");
    } finally {
      setCargando(false);
    }
  }, [irAlLogin]);

  useEffect(() => {
    if (!usuario) {
      navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`, { replace: true });
      return undefined;
    }
    cargarLista();
    const intervalo = setInterval(() => !document.hidden && cargarLista(), CADA_CUANTO_LISTA);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrir = (id) => {
    const siguientes = new URLSearchParams(parametros);
    if (id) siguientes.set("con", String(id));
    else siguientes.delete("con");
    setParametros(siguientes);
    // Al abrir una conversación, su globito de no leídos se va
    if (id && id !== ID_SOPORTE) setChats((lista) => lista.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c)));
  };

  const q = normalizarTexto(filtro.trim());
  const chatsVisibles = useMemo(() => chats.filter((c) => !q || normalizarTexto(c.nombre).includes(q)), [chats, q]);
  const idsConChat = new Set(chats.map((c) => c.id));
  const contactosNuevos = contactos.filter((c) => !idsConChat.has(c.id) && (!q || normalizarTexto(c.nombre).includes(q)));
  const primerNombre = nombreCorto(usuario?.nombre, usuario?.esEmpresa);

  if (!usuario) return null;

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-mensajes">
        <BarraNav />
        <main className="contenedor-mensajes">
          <div className={`caja-mensajes ${seleccion ? "con-chat" : ""}`}>
            <aside className="columna-chats" aria-label="Conversaciones">
              <div className="cabecera-chats">
                <h1 className="titulo-chats">Mensajes</h1>
                <label className="buscar-chats">
                  <IconoLupa />
                  <input type="text" placeholder="Buscar una persona" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Buscar una conversación" />
                </label>
              </div>
              <div className="lista-chats">
                <button className={`item-chat ${seleccion === ID_SOPORTE ? "activo" : ""}`} onClick={() => abrir(ID_SOPORTE)}>
                  <div className="avatar-soporte"><img src={logoIcono} alt="" /></div>
                  <div className="datos-item-chat">
                    <div className="fila-item-chat"><span className="nombre-item-chat">Atención al usuario</span></div>
                    <div className="vista-item-chat">Preguntas frecuentes · respuestas al instante</div>
                  </div>
                </button>

                {cargando ? (
                  [0, 1, 2].map((i) => <div className="esqueleto-chat" key={i} />)
                ) : error ? (
                  <p className="vacio-chats">{error}</p>
                ) : (
                  <>
                    {chatsVisibles.length > 0 && <p className="titulo-grupo-chats">Conversaciones</p>}
                    {chatsVisibles.map((c) => (
                      <button key={c.id} className={`item-chat ${otroId === c.id ? "activo" : ""}`} onClick={() => abrir(c.id)}>
                        <Avatar src={c.foto} nombre={c.nombre} tamano={42} />
                        <div className="datos-item-chat">
                          <div className="fila-item-chat">
                            <span className="nombre-item-chat">{c.nombre}</span>
                            <span className={`hora-item-chat ${c.noLeidos ? "nuevo" : ""}`}>{fechaEnLista(c.ultimaFecha)}</span>
                          </div>
                          <div className="fila-item-chat">
                            <span className={`vista-item-chat ${c.noLeidos ? "nuevo" : ""}`}>
                              {c.ultimoEsMio ? "Vos: " : ""}
                              {c.ultimoEsImagen && !c.ultimoTexto ? "📷 Foto" : `${c.ultimoEsImagen ? "📷 " : ""}${c.ultimoTexto}`}
                            </span>
                            {c.noLeidos > 0 && <span className="globo-no-leidos" aria-label={`${c.noLeidos} sin leer`}>{c.noLeidos}</span>}
                          </div>
                        </div>
                      </button>
                    ))}

                    {contactosNuevos.length > 0 && <p className="titulo-grupo-chats">Personas con citas</p>}
                    {contactosNuevos.map((c) => (
                      <button key={c.id} className={`item-chat ${otroId === c.id ? "activo" : ""}`} onClick={() => abrir(c.id)}>
                        <Avatar src={c.foto} nombre={c.nombre} tamano={42} />
                        <div className="datos-item-chat">
                          <div className="fila-item-chat"><span className="nombre-item-chat">{c.nombre}</span></div>
                          <div className="vista-item-chat">{ESTADOS_CITA[c.cita.estado]?.texto || "Cita"} · {resumenCita(c.cita)}</div>
                        </div>
                      </button>
                    ))}

                    {chats.length === 0 && contactos.length === 0 && (
                      <p className="vacio-chats">
                        Cuando tengas una cita o una solicitud con alguien, vas a poder escribirle desde acá para coordinar.
                      </p>
                    )}
                  </>
                )}
              </div>
            </aside>

            {seleccion === ID_SOPORTE ? (
              <PanelSoporte nombre={primerNombre} onVolver={() => abrir(null)} />
            ) : otroId ? (
              <PanelChat key={otroId} otroId={otroId} onVolver={() => abrir(null)} onSesionVencida={irAlLogin} onActividad={cargarLista} />
            ) : (
              <section className="panel-chat">
                <div className="sin-chat">
                  <div className="icono-sin-chat"><IconoChat /></div>
                  <strong>Tus mensajes</strong>
                  <p>Elegí una conversación para coordinar la dirección, el horario o mandar fotos del problema con la persona de tu cita.</p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
