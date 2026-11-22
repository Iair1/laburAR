// Ofertas.jsx
// Todo lo que se ve de las propuestas de precio:
//  · ProponerModal: el trabajador elige día, hora y precio para un problema
//  · TarjetaOferta: una propuesta, con el ida y vuelta y los botones de quien tiene el turno
//  · PropuestasModal: las propuestas que recibió el cliente para un problema
//  · ContraofertaModal / RechazarOfertaModal / AceptarOfertaModal
import { useState } from "react";
import Avatar from "./Avatar";
import { Calendario, Modal } from "./ProblemasUI";
import { ResenasModal } from "./Resenas";
import ResumenConfianza from "./ResumenConfianza";
import {
  FRANJAS,
  fechasPosibles,
  fechaLarga,
  fechaCorta,
  horasDeFranja,
} from "../problemasDatos";
import {
  formatearPesos,
  leerPesos,
  mostrarPesosEscritos,
  errorDePrecio,
  estadoDeOferta,
  textoPaso,
  textoCuando,
} from "../ofertasApi";

export const estilosOfertas = `
  .campo-precio {
    display: flex; align-items: center; border: 1px solid #8f8f8f; border-radius: 10px; background: #fff;
    padding: 0 12px; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .campo-precio:focus-within { border-color: #570101; box-shadow: 0 0 0 3px rgba(87,1,1,0.12); }
  .campo-precio.con-error { border-color: #b3261e; }
  .campo-precio span { font-size: 1.05rem; font-weight: 700; color: #570101; margin-right: 6px; }
  .campo-precio input {
    flex: 1; min-width: 0; border: none; outline: none; padding: 10px 0; font-size: 1.05rem; font-weight: 700;
    color: #1a1a1a; font-family: inherit; background: none; letter-spacing: 0.01em;
  }
  .ayuda-campo-oferta { font-size: 0.72rem; color: #666; margin: 5px 0 0 0.4rem; line-height: 1.4; }
  .bloque-oferta { margin-top: 0.9rem; }
  .contador-mensaje { font-size: 0.66rem; color: #999; text-align: right; margin-top: 2px; }
  .nota-pago {
    display: flex; gap: 8px; align-items: flex-start; font-size: 0.72rem; color: #5b4a2e; background: #fbf7ee;
    border: 1px solid #efe3c6; border-radius: 10px; padding: 8px 10px; margin-top: 0.9rem; line-height: 1.45;
  }
  .resumen-oferta {
    background: #fcf8f8; border: 1px solid #ecdede; border-radius: 12px; padding: 10px 14px; margin-top: 0.9rem;
    font-size: 0.84rem; color: #333; line-height: 1.55; text-align: center;
  }
  .resumen-oferta strong { color: #570101; }

  /* --- una propuesta --- */
  .oferta {
    border: 1px solid #e6dcdc; border-radius: 14px; padding: 12px 14px; background: #fff;
    display: flex; flex-direction: column; gap: 8px;
  }
  .oferta + .oferta { margin-top: 10px; }
  .oferta.para-responder { border-color: #8a0f0f; box-shadow: 0 0 0 2px rgba(138,15,15,0.08); }
  .oferta.apagada { background: #fafafa; }
  .oferta.apagada .precio-oferta { color: #8a8a8a; text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .oferta.resaltada { animation: resaltar-oferta 1.6s ease-out; }
  @keyframes resaltar-oferta { 0%, 40% { box-shadow: 0 0 0 4px rgba(138,15,15,0.25); } 100% { box-shadow: none; } }
  .cabecera-oferta { display: flex; align-items: center; gap: 10px; }
  .persona-oferta { flex: 1; min-width: 0; }
  .nombre-oferta { font-size: 0.86rem; font-weight: 700; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .datos-persona-oferta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 0.7rem; color: #666; margin-top: 2px; }
  .datos-persona-oferta .estrellas { color: #b07a00; font-weight: 700; }
  .verificado-oferta { color: #1e6b2d; font-weight: 700; }
  .enlace-oferta { background: none; border: none; padding: 0; color: #570101; font-weight: 700; font-size: 0.7rem; cursor: pointer; font-family: inherit; }
  .enlace-oferta:hover { text-decoration: underline; }
  .precio-oferta { font-size: 1.25rem; font-weight: 800; color: #1a1a1a; white-space: nowrap; letter-spacing: -0.01em; }
  .cuando-oferta { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: #333; }
  .cuando-oferta svg { width: 14px; height: 14px; color: #7a2a2a; flex-shrink: 0; }
  .mensaje-oferta {
    font-size: 0.76rem; color: #333; background: #f7f5f5; border-radius: 10px; padding: 7px 10px; line-height: 1.45;
    white-space: pre-line; overflow-wrap: anywhere;
  }
  .mensaje-oferta .autor { font-weight: 700; color: #1a1a1a; }
  .estado-oferta {
    display: inline-flex; align-items: center; gap: 5px; font-size: 0.68rem; font-weight: 700; border-radius: 999px;
    padding: 3px 9px; width: fit-content;
  }
  .estado-oferta::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .estado-oferta.nuevo { background: #f6e6e6; color: #8a0f0f; }
  .estado-oferta.espera { background: #e8f1fb; color: #1d4f8c; }
  .estado-oferta.bien { background: #e6f4ea; color: #1e6b2d; }
  .estado-oferta.mal { background: #fbeceb; color: #a1261e; }
  .estado-oferta.neutro { background: #efefed; color: #666; }
  .historial-oferta { list-style: none; margin: 0; padding: 0 0 0 4px; display: flex; flex-direction: column; gap: 4px; }
  .historial-oferta li { position: relative; padding-left: 14px; font-size: 0.72rem; color: #555; line-height: 1.35; }
  .historial-oferta li::before { content: ""; position: absolute; left: 0; top: 5px; width: 6px; height: 6px; border-radius: 50%; background: #cdbaba; }
  .historial-oferta li:last-child::before { background: #8a0f0f; }
  .historial-oferta .cita-paso { display: block; color: #777; font-style: italic; }
  .boton-historial { background: none; border: none; padding: 0; font-size: 0.7rem; font-weight: 700; color: #570101; cursor: pointer; width: fit-content; font-family: inherit; }
  .boton-historial:hover { text-decoration: underline; }
  .acciones-oferta { display: flex; flex-wrap: wrap; gap: 6px; }
  .accion-oferta {
    border-radius: 999px; padding: 7px 14px; font-size: 0.76rem; font-weight: 700; cursor: pointer; font-family: inherit;
    border: 1px solid #570101; background: #fff; color: #1a1a1a; transition: background 0.15s;
  }
  .accion-oferta:hover { background: #f6eeee; }
  .accion-oferta.principal { background: #570101; color: #fff; }
  .accion-oferta.principal:hover { background: #3b1e0d; }
  .accion-oferta.suave { border-color: #d9c8c8; color: #3b1e0d; }
  .accion-oferta.peligro { border-color: #e7b9b5; color: #a1261e; }
  .accion-oferta.peligro:hover { background: #fbeceb; }
  .espera-oferta { font-size: 0.74rem; color: #1d4f8c; background: #f1f6fc; border-radius: 10px; padding: 7px 10px; line-height: 1.4; }

  /* --- propuestas de un problema (cliente) --- */
  .resumen-propuestas { font-size: 0.78rem; color: #555; text-align: center; margin: 0.35rem 0 1rem; }
  .titulo-grupo-ofertas { font-size: 0.72rem; font-weight: 800; color: #7a2a2a; text-transform: uppercase; letter-spacing: 0.05em; margin: 1rem 0 0.5rem; }
  .vacio-ofertas { text-align: center; font-size: 0.84rem; color: #555; padding: 1.4rem 0.6rem; line-height: 1.5; }

  /* --- rechazar --- */
  .opciones-rechazo { display: flex; flex-direction: column; gap: 8px; margin-top: 1rem; }
  .opcion-rechazo {
    display: flex; flex-direction: column; gap: 2px; text-align: left; border-radius: 12px; padding: 11px 14px;
    border: 1px solid #d9c8c8; background: #fff; cursor: pointer; font-family: inherit; transition: background 0.15s, border-color 0.15s;
  }
  .opcion-rechazo strong { font-size: 0.86rem; color: #1a1a1a; }
  .opcion-rechazo span { font-size: 0.74rem; color: #666; line-height: 1.4; }
  .opcion-rechazo:hover:not(:disabled) { background: #fcf7f7; border-color: #570101; }
  .opcion-rechazo.peligro strong { color: #a1261e; }
  .opcion-rechazo.peligro:hover:not(:disabled) { background: #fdf1f0; border-color: #b3261e; }
  .opcion-rechazo:disabled { opacity: 0.6; cursor: wait; }

  @media (max-width: 520px) {
    .precio-oferta { font-size: 1.1rem; }
    .accion-oferta { flex: 1 1 auto; text-align: center; }
  }
`;

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

const primerNombre = (nombre) => String(nombre || "").trim().split(/\s+/)[0] || "";

/** Campo de precio en pesos: "$ 25.000" mientras se escribe. */
export function CampoPrecio({ id, valor, onCambio, conError = false, autoFocus = false, etiqueta = "Precio" }) {
  return (
    <div className={`campo-precio ${conError ? "con-error" : ""}`}>
      <span aria-hidden="true">$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        maxLength={12}
        aria-label={etiqueta}
        autoFocus={autoFocus}
        value={valor}
        onChange={(e) => onCambio(mostrarPesosEscritos(e.target.value))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* El trabajador propone día, hora y precio para un problema           */
/* ------------------------------------------------------------------ */

/**
 * También sirve para el presupuesto de una solicitud directa: `titulo`, `horas`, `horaInicial`,
 * `ayudaHora` y `textoBoton` permiten cambiar lo que se muestra.
 */
export function ProponerModal({ problema, tarifa = null, onCerrar, onConfirmar, titulo = "Proponer cita", horas: horasDadas, horaInicial = "", ayudaHora, textoBoton = "Enviar propuesta" }) {
  const fechas = fechasPosibles(problema);
  const horas = horasDadas || horasDeFranja(problema.franja);
  const franja = FRANJAS[problema.franja];
  const nombreCliente = primerNombre(problema.cliente?.nombre) || "el cliente";
  const [dia, setDia] = useState(fechas.length === 1 ? fechas[0] : "");
  const [hora, setHora] = useState(horas.includes(horaInicial) ? horaInicial : "");
  const [precioTexto, setPrecioTexto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const precio = leerPesos(precioTexto);

  const enviar = async () => {
    if (!dia) return setError("Elegí qué día irías.");
    if (!hora) return setError("Elegí a qué hora irías.");
    const problemaPrecio = errorDePrecio(precio);
    if (problemaPrecio) return setError(problemaPrecio);
    setError("");
    setProcesando(true);
    try {
      await onConfirmar({ dia, hora, precio, mensaje: mensaje.trim() });
    } catch (err) {
      setError(err.message || "No se pudo mandar la propuesta. Probá de nuevo.");
      setProcesando(false);
    }
  };

  return (
    <Modal etiqueta={titulo} onCerrar={procesando ? undefined : onCerrar} ancho={500}>
      <style>{estilosOfertas}</style>
      <h2 className="titulo-modal-grande">{titulo}</h2>
      <p className="subtitulo-modal">{problema.titulo}</p>
      <p className="detalle-modal">
        Elegí uno de los días que puso {nombreCliente} y decile cuánto cobrarías. Puede aceptar, proponerte otro precio o rechazarla.
      </p>

      {fechas.length === 0 ? (
        <p className="sin-fechas-agendar">Ya no quedan días disponibles para este problema.</p>
      ) : (
        <>
          <Calendario modo="unico" valor={dia} habilitadas={fechas} onCambio={(f) => { setDia(f); setError(""); }} />

          <div className="bloque-oferta">
            <label className="etiqueta-modal" htmlFor="hora-propuesta">¿A qué hora irías?</label>
            <select id="hora-propuesta" className="select-modal" value={hora} onChange={(e) => { setHora(e.target.value); setError(""); }}>
              <option value="">Elegí la hora</option>
              {horas.map((h) => <option key={h} value={h}>{h} hs</option>)}
            </select>
            {ayudaHora !== undefined
              ? ayudaHora && <p className="ayuda-campo-oferta">{ayudaHora}</p>
              : franja && <p className="ayuda-campo-oferta">{nombreCliente} pidió: {franja.etiqueta} ({franja.detalle})</p>}
          </div>

          <div className="bloque-oferta">
            <label className="etiqueta-modal" htmlFor="precio-propuesta">¿Cuánto cobrarías por el trabajo?</label>
            <CampoPrecio id="precio-propuesta" valor={precioTexto} onCambio={(v) => { setPrecioTexto(v); setError(""); }} etiqueta="Precio en pesos" />
            <p className="ayuda-campo-oferta">
              {tarifa
                ? `Tu tarifa publicada para ${problema.categoria || "este rubro"} es ${formatearPesos(tarifa)} por hora. Poné el total que cobrarías por este trabajo.`
                : "El total que cobrarías por este trabajo (mano de obra y, si hace falta, materiales)."}
            </p>
          </div>

          <div className="bloque-oferta">
            <label className="etiqueta-modal" htmlFor="mensaje-propuesta">Mensaje para {nombreCliente} (opcional)</label>
            <textarea
              id="mensaje-propuesta"
              className="textarea-modal"
              rows={3}
              maxLength={500}
              placeholder="Ej: incluye los materiales, tardo unas 2 horas, llevo todas las herramientas…"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <div className="contador-mensaje">{mensaje.length}/500</div>
          </div>

          {dia && hora && precio > 0 && (
            <div className="resumen-oferta">
              Proponés ir el <strong>{fechaLarga(dia)}</strong> a las <strong>{hora} hs</strong>
              <br />por <strong>{formatearPesos(precio)}</strong>
            </div>
          )}
          <div className="nota-pago">
            <span aria-hidden="true">💬</span>
            <span>Hasta que {nombreCliente} acepte no hay nada confirmado. El pago lo arreglan entre ustedes: LaburAR no cobra comisión.</span>
          </div>
          {error && <p className="error-modal" role="alert">{error}</p>}
          <button className="boton-grande-modal" onClick={enviar} disabled={procesando}>
            {procesando ? "Enviando..." : textoBoton}
          </button>
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Una propuesta                                                       */
/* ------------------------------------------------------------------ */

function Historial({ oferta, rol }) {
  const [abierto, setAbierto] = useState(false);
  const pasos = oferta.historial.filter((p) => p.accion !== "cerrada");
  if (pasos.length <= 1) return null;
  const nombres = { cliente: primerNombre(oferta.cliente?.nombre), trabajador: primerNombre(oferta.trabajador?.nombre) };
  return (
    <>
      <button type="button" className="boton-historial" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto ? "Ocultar el ida y vuelta" : `Ver el ida y vuelta (${pasos.length})`}
      </button>
      {abierto && (
        <ul className="historial-oferta">
          {pasos.map((p) => (
            <li key={p.id}>
              {textoPaso(p, rol, nombres)}
              {p.mensaje && p.accion !== "propuesta" && <span className="cita-paso">“{p.mensaje}”</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// El último mensaje que mandó la otra persona (o el de la propuesta)
function ultimoMensaje(oferta) {
  const conMensaje = [...oferta.historial].reverse().find((p) => p.mensaje);
  if (conMensaje) return { rol: conMensaje.rol, texto: conMensaje.mensaje };
  return oferta.mensaje ? { rol: "trabajador", texto: oferta.mensaje } : null;
}

/**
 * Una propuesta, vista por el cliente (rol "cliente": muestra al trabajador) o por el
 * trabajador (rol "trabajador": muestra al cliente). Los botones dependen de a quién le toca.
 */
export function TarjetaOferta({ oferta, rol, titulo = null, resaltada = false, sinPersona = false, onAceptar, onContraofertar, onRechazar, onMensaje, extraAcciones = null }) {
  const [viendoResenas, setViendoResenas] = useState(false);
  const estado = estadoDeOferta(oferta, rol);
  const otro = rol === "cliente" ? oferta.trabajador : oferta.cliente;
  const nombreOtro = primerNombre(otro?.nombre) || (rol === "cliente" ? "el trabajador" : "el cliente");
  const abierta = oferta.estado === "pendiente" && !oferta.vencida;
  const apagada = ["rechazada", "retirada", "cerrada"].includes(oferta.estado) || oferta.vencida;
  const mensaje = ultimoMensaje(oferta);
  const puntaje = Number(otro?.puntuacion) || 0;
  const ultimoPaso = oferta.historial[oferta.historial.length - 1];

  return (
    <article
      className={`oferta ${estado.meToca && abierta ? "para-responder" : ""} ${apagada ? "apagada" : ""} ${resaltada ? "resaltada" : ""}`}
      id={`oferta-${oferta.id}`}
      aria-label={rol === "cliente" ? `Propuesta de ${oferta.trabajador?.nombre} por ${formatearPesos(oferta.precio)}` : `Tu propuesta por ${formatearPesos(oferta.precio)}`}
    >
      {titulo && <div>{titulo}</div>}
      <div className="cabecera-oferta">
        {!sinPersona && <Avatar src={otro?.foto} nombre={otro?.nombre} tamano={40} />}
        <div className="persona-oferta">
          <div className="nombre-oferta">
            {sinPersona ? (rol === "trabajador" ? "Tu presupuesto" : "Presupuesto") : rol === "trabajador" ? `Para ${otro?.nombre || "el cliente"}` : otro?.nombre}
          </div>
          <div className="datos-persona-oferta">
            {puntaje > 0 && <span className="estrellas">★ {puntaje.toFixed(1)}</span>}
            {rol === "cliente" && otro?.verificado && <span className="verificado-oferta">✓ Identidad verificada</span>}
            {otro?.id && (
              <button type="button" className="enlace-oferta" onClick={() => setViendoResenas(true)}>Ver reseñas</button>
            )}
          </div>
        </div>
        <div className="precio-oferta" title="Precio propuesto">{formatearPesos(oferta.precio)}</div>
      </div>
      {otro?.id && !apagada && !sinPersona && <ResumenConfianza userid={otro.id} rol={rol === "cliente" ? "trabajador" : "cliente"} compacto />}

      <div className="cuando-oferta"><IconoCalendario />{textoCuando(oferta.dia, oferta.hora)}</div>
      <span className={`estado-oferta ${estado.tono}`}>{estado.etiqueta}</span>

      {mensaje && (
        <div className="mensaje-oferta">
          <span className="autor">{mensaje.rol === rol ? "Vos" : nombreOtro}:</span> {mensaje.texto}
        </div>
      )}
      <Historial oferta={oferta} rol={rol} />

      {abierta && !estado.meToca && ultimoPaso && (
        <p className="espera-oferta">
          {ultimoPaso.accion === "contraoferta" && ultimoPaso.rol === rol
            ? `Le propusiste ${formatearPesos(oferta.precio)}. Te avisamos cuando ${nombreOtro} responda.`
            : `Le mandaste tu propuesta. Te avisamos cuando ${nombreOtro} responda.`}
        </p>
      )}

      {(abierta || extraAcciones) && (
        <div className="acciones-oferta">
          {abierta && estado.meToca && (
            <>
              <button type="button" className="accion-oferta principal" onClick={() => onAceptar?.(oferta)}>
                Aceptar {formatearPesos(oferta.precio)}
              </button>
              <button type="button" className="accion-oferta" onClick={() => onContraofertar?.(oferta)}>Contraoferta</button>
              <button type="button" className="accion-oferta peligro" onClick={() => onRechazar?.(oferta)}>Rechazar</button>
            </>
          )}
          {abierta && !estado.meToca && (
            <button type="button" className="accion-oferta peligro" onClick={() => onRechazar?.(oferta)}>
              {rol === "trabajador" ? "Retirar propuesta" : "Rechazar"}
            </button>
          )}
          {(abierta || oferta.estado === "aceptada") && onMensaje && otro?.id && (
            <button type="button" className="accion-oferta suave" onClick={() => onMensaje(otro)}>Mandar mensaje</button>
          )}
          {extraAcciones}
        </div>
      )}

      {viendoResenas && otro?.id && (
        <ResenasModal
          userid={otro.id}
          nombre={otro.nombre}
          rolInicial={rol === "cliente" ? "trabajador" : "cliente"}
          onCerrar={() => setViendoResenas(false)}
        />
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Las propuestas de un problema (las ve el cliente)                   */
/* ------------------------------------------------------------------ */

export function PropuestasModal({ problema, ofertas, resaltada = null, onCerrar, onAceptar, onContraofertar, onRechazar, onMensaje }) {
  const [verAnteriores, setVerAnteriores] = useState(false);
  const abiertas = ofertas.filter((o) => o.estado === "pendiente" && !o.vencida);
  // Primero las que esperan tu respuesta, después las que esperan la del trabajador; cada grupo del más barato al más caro
  abiertas.sort((a, b) => Number(b.turno === "cliente") - Number(a.turno === "cliente") || a.precio - b.precio);
  const anteriores = ofertas.filter((o) => !abiertas.includes(o));
  const paraResponder = abiertas.filter((o) => o.turno === "cliente").length;
  const desde = abiertas.length ? Math.min(...abiertas.map((o) => o.precio)) : null;

  return (
    <Modal etiqueta={`Propuestas para ${problema.titulo}`} onCerrar={onCerrar} ancho={560}>
      <style>{estilosOfertas}</style>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.3rem" }}>Propuestas</h2>
      <p className="subtitulo-modal">{problema.titulo}</p>
      {abiertas.length > 0 ? (
        <p className="resumen-propuestas">
          {abiertas.length === 1 ? "1 propuesta abierta" : `${abiertas.length} propuestas abiertas`}
          {desde !== null ? ` · desde ${formatearPesos(desde)}` : ""}
          {paraResponder > 0 ? ` · ${paraResponder === 1 ? "1 espera" : `${paraResponder} esperan`} tu respuesta` : ""}
        </p>
      ) : (
        <p className="vacio-ofertas">
          {anteriores.length > 0
            ? "No tenés propuestas abiertas. Tu problema sigue publicado: te avisamos cuando llegue otra."
            : "Todavía no te llegaron propuestas. Cuando un trabajador te mande una, te avisamos en la campanita."}
        </p>
      )}
      {abiertas.map((o) => (
        <TarjetaOferta
          key={o.id}
          oferta={o}
          rol="cliente"
          resaltada={String(resaltada) === String(o.id)}
          onAceptar={onAceptar}
          onContraofertar={onContraofertar}
          onRechazar={onRechazar}
          onMensaje={onMensaje}
        />
      ))}
      {anteriores.length > 0 && (
        <>
          <button type="button" className="boton-historial" style={{ marginTop: 14 }} onClick={() => setVerAnteriores((v) => !v)}>
            {verAnteriores ? "Ocultar las anteriores" : `Ver propuestas anteriores (${anteriores.length})`}
          </button>
          {verAnteriores && (
            <>
              <p className="titulo-grupo-ofertas">Anteriores</p>
              {anteriores.map((o) => <TarjetaOferta key={o.id} oferta={o} rol="cliente" />)}
            </>
          )}
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Contraoferta                                                        */
/* ------------------------------------------------------------------ */

export function ContraofertaModal({ oferta, rol, onCerrar, onConfirmar }) {
  const otro = rol === "cliente" ? oferta.trabajador : oferta.cliente;
  const nombreOtro = primerNombre(otro?.nombre) || "la otra persona";
  const [precioTexto, setPrecioTexto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const precio = leerPesos(precioTexto);

  const enviar = async () => {
    const problemaPrecio = errorDePrecio(precio);
    if (problemaPrecio) return setError(problemaPrecio);
    if (precio === oferta.precio) return setError(`Es el mismo precio que te propuso ${nombreOtro}: si te sirve, aceptalo.`);
    setError("");
    setProcesando(true);
    try {
      await onConfirmar(oferta, precio, mensaje.trim());
    } catch (err) {
      setError(err.message || "No se pudo mandar la contraoferta. Probá de nuevo.");
      setProcesando(false);
    }
  };

  return (
    <Modal etiqueta="Contraoferta" onCerrar={procesando ? undefined : onCerrar} ancho={440}>
      <style>{estilosOfertas}</style>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.3rem" }}>Contraoferta</h2>
      <p className="subtitulo-modal">{oferta.titulo}</p>
      <p className="detalle-modal">
        {nombreOtro} propuso <strong>{formatearPesos(oferta.precio)}</strong> para el {fechaCorta(oferta.dia)}
        {oferta.hora ? ` a las ${oferta.hora} hs` : ""}. Proponele otro precio y le toca responder a {nombreOtro}.
      </p>
      <label className="etiqueta-modal" htmlFor="precio-contraoferta">Tu precio</label>
      <CampoPrecio id="precio-contraoferta" valor={precioTexto} onCambio={(v) => { setPrecioTexto(v); setError(""); }} autoFocus etiqueta="Tu precio en pesos" conError={Boolean(error)} />
      <div className="bloque-oferta">
        <label className="etiqueta-modal" htmlFor="mensaje-contraoferta">Mensaje (opcional)</label>
        <textarea
          id="mensaje-contraoferta"
          className="textarea-modal"
          rows={2}
          maxLength={500}
          placeholder={rol === "cliente" ? "Ej: ¿lo podés hacer por este precio si pongo yo los materiales?" : "Ej: por ese precio no llego, pero puedo hacerlo por…"}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </div>
      {error && <p className="error-modal" role="alert">{error}</p>}
      <div className="acciones-modal" style={{ justifyContent: "center" }}>
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
        <button className="boton-pill primario" onClick={enviar} disabled={procesando}>
          {procesando ? "Enviando..." : precio ? `Proponer ${formatearPesos(precio)}` : "Enviar contraoferta"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Aceptar                                                             */
/* ------------------------------------------------------------------ */

export function AceptarOfertaModal({ oferta, rol, otrasAbiertas = 0, onCerrar, onConfirmar }) {
  const otro = rol === "cliente" ? oferta.trabajador : oferta.cliente;
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const confirmar = async () => {
    setProcesando(true);
    setError("");
    try {
      await onConfirmar(oferta);
    } catch (err) {
      setError(err.message || "No se pudo aceptar. Probá de nuevo.");
      setProcesando(false);
    }
  };
  return (
    <Modal etiqueta="Aceptar propuesta" onCerrar={procesando ? undefined : onCerrar} ancho={440}>
      <style>{estilosOfertas}</style>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.25rem", textTransform: "none" }}>
        ¿Aceptar {formatearPesos(oferta.precio)}?
      </h2>
      <div className="resumen-oferta">
        Cita con <strong>{otro?.nombre || "la otra persona"}</strong>
        <br /><strong>{fechaLarga(oferta.dia)}</strong>{oferta.hora ? <> a las <strong>{oferta.hora} hs</strong></> : null}
        <br />por <strong>{formatearPesos(oferta.precio)}</strong>
      </div>
      <p className="texto-seccion-modal" style={{ textAlign: "center", margin: "0.8rem 0 0", fontSize: "0.78rem", color: "#555" }}>
        La cita queda agendada y le avisamos a {primerNombre(otro?.nombre) || "la otra persona"}.
        {rol === "cliente" && otrasAbiertas > 0
          ? ` Las otras ${otrasAbiertas === 1 ? "propuesta se cierra" : `${otrasAbiertas} propuestas se cierran`} y el problema deja de estar publicado.`
          : rol === "cliente" ? " El problema deja de estar publicado." : ""}
      </p>
      {error && <p className="error-modal" role="alert">{error}</p>}
      <div className="acciones-modal" style={{ justifyContent: "center" }}>
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
        <button className="boton-pill primario" onClick={confirmar} disabled={procesando}>
          {procesando ? "Un momento..." : "Sí, aceptar y agendar"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Rechazar (el cliente elige si mantiene o elimina la publicación)    */
/* ------------------------------------------------------------------ */

export function RechazarOfertaModal({ oferta, rol, otrasAbiertas = 0, dirigida = false, onCerrar, onConfirmar }) {
  const otro = rol === "cliente" ? oferta.trabajador : oferta.cliente;
  const nombreOtro = primerNombre(otro?.nombre) || "la otra persona";
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const retirar = rol === "trabajador" && oferta.turno === "cliente";

  const confirmar = async (eliminarPublicacion) => {
    setProcesando(true);
    setError("");
    try {
      await onConfirmar(oferta, eliminarPublicacion);
    } catch (err) {
      setError(err.message || "No se pudo completar. Probá de nuevo.");
      setProcesando(false);
    }
  };

  if (rol === "trabajador") {
    return (
      <Modal etiqueta={retirar ? "Retirar propuesta" : "Rechazar contraoferta"} onCerrar={procesando ? undefined : onCerrar} ancho={420}>
        <h2 className="titulo-modal-grande" style={{ fontSize: "1.25rem", textTransform: "none" }}>
          {retirar ? "¿Retirar tu propuesta?" : `¿Rechazar los ${formatearPesos(oferta.precio)}?`}
        </h2>
        <p className="texto-seccion-modal" style={{ textAlign: "center", margin: "0.8rem 0 0.4rem" }}>
          {retirar
            ? `${nombreOtro} ya no va a poder aceptarla. Le avisamos.`
            : `Le avisamos a ${nombreOtro}. Si querés seguir negociando, mejor mandale una contraoferta.`}
        </p>
        {error && <p className="error-modal" role="alert">{error}</p>}
        <div className="acciones-modal" style={{ justifyContent: "center" }}>
          <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
          <button className="boton-pill peligro" onClick={() => confirmar(false)} disabled={procesando}>
            {procesando ? "Un momento..." : retirar ? "Sí, retirarla" : "Sí, rechazar"}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal etiqueta="Rechazar propuesta" onCerrar={procesando ? undefined : onCerrar} ancho={460}>
      <style>{estilosOfertas}</style>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.25rem", textTransform: "none" }}>
        ¿Rechazar la propuesta de {nombreOtro}?
      </h2>
      <p className="texto-seccion-modal" style={{ textAlign: "center", margin: "0.6rem 0 0" }}>
        {formatearPesos(oferta.precio)} · {textoCuando(oferta.dia, oferta.hora)}. Le avisamos a {nombreOtro}.
        <br />{dirigida ? "¿Qué hacemos con tu pedido?" : "¿Qué hacemos con tu publicación?"}
      </p>
      {dirigida ? (
        <div className="opciones-rechazo">
          <button type="button" className="opcion-rechazo" onClick={() => confirmar(false)} disabled={procesando}>
            <strong>Rechazar el presupuesto</strong>
            <span>Tu pedido sigue en pie y {nombreOtro} te puede mandar otro presupuesto.</span>
          </button>
          <button type="button" className="opcion-rechazo peligro" onClick={() => confirmar(true)} disabled={procesando}>
            <strong>Rechazar y cancelar el pedido</strong>
            <span>{nombreOtro} ya no lo ve. Podés buscar a otro trabajador cuando quieras.</span>
          </button>
        </div>
      ) : (
      <div className="opciones-rechazo">
        <button type="button" className="opcion-rechazo" onClick={() => confirmar(false)} disabled={procesando}>
          <strong>Rechazar y mantener la publicación</strong>
          <span>
            Tu problema sigue publicado y te pueden llegar otras propuestas
            {otrasAbiertas > 0 ? ` (tenés ${otrasAbiertas === 1 ? "1 más abierta" : `${otrasAbiertas} más abiertas`}).` : "."}
          </span>
        </button>
        <button type="button" className="opcion-rechazo peligro" onClick={() => confirmar(true)} disabled={procesando}>
          <strong>Rechazar y eliminar la publicación</strong>
          <span>
            Los trabajadores ya no lo ven{otrasAbiertas > 0 ? " y se cierran las demás propuestas" : ""}. Lo podés volver a publicar cuando quieras.
          </span>
        </button>
      </div>
      )}
      {error && <p className="error-modal" role="alert">{error}</p>}
      <div className="acciones-modal" style={{ justifyContent: "center" }}>
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
      </div>
    </Modal>
  );
}
