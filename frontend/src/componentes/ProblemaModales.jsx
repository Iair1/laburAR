import { useMemo, useState } from "react";
import Avatar from "./Avatar";
import {
  ImagenProblema,
  ChipEstado,
  ChipUrgencia,
  GaleriaFotos,
  Calendario,
  Iconos,
  useEscape,
} from "./ProblemasUI";
import {
  FRANJAS,
  DURACIONES,
  MATERIALES,
  fechasPosibles,
  horasDeFranja,
  formatearPesos,
  fechaCorta,
  fechaLarga,
  textoPeriodo,
  textoDiasSemana,
  tiempoRelativo,
  estadoVisible,
} from "../problemasDatos";
import { enviarPresupuesto } from "../problemasApi";

function Modal({ etiqueta, onCerrar, children, ancho }) {
  useEscape(onCerrar);
  return (
    <div className="fondo-modal-problema" onClick={onCerrar}>
      <div
        className="tarjeta-modal-problema"
        style={ancho ? { maxWidth: ancho } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cerrar-modal-problema" onClick={onCerrar} aria-label="Cerrar">✕</button>
        {children}
      </div>
    </div>
  );
}

const estilosModales = `
  .encabezado-detalle { display: flex; gap: 14px; align-items: center; padding-right: 24px; margin-bottom: 0.9rem; }
  .titulo-detalle { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; line-height: 1.25; }
  .chips-detalle { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }
  .chip-categoria-detalle { font-size: 0.68rem; font-weight: 600; color: #fff; background: #7a2a2a; border-radius: 999px; padding: 3px 10px; }
  .cliente-detalle { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #444; margin-bottom: 1rem; }
  .estimado-detalle {
    margin-left: auto; background: #6b0d0d; color: #fff; font-weight: 700; font-size: 0.82rem; padding: 7px 14px;
    border-radius: 999px; white-space: nowrap;
  }
  .datos-cuando { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .dato-cuando { background: #fcf8f8; border: 1px solid #ecdede; border-radius: 10px; padding: 8px 10px; font-size: 0.76rem; color: #333; }
  .dato-cuando strong { display: block; font-size: 0.68rem; color: #7a2a2a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
  .fechas-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .fecha-chip { font-size: 0.7rem; font-weight: 600; background: #f4eeee; border: 1px solid #e3d3d3; color: #3b1e0d; border-radius: 999px; padding: 3px 9px; }
  .mi-presupuesto-detalle {
    border: 1px solid #b7dfba; background: #f1f9f2; border-radius: 12px; padding: 10px 12px; margin-bottom: 1rem;
    font-size: 0.8rem; color: #1e5e22; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  }
  .direccion-detalle {
    display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #1e5e22; background: #f1f9f2;
    border: 1px solid #b7dfba; border-radius: 10px; padding: 8px 10px; margin-top: 6px;
  }
  .direccion-detalle svg { width: 14px; height: 14px; }
  .monto-presupuesto-input { font-size: 1.3rem !important; font-weight: 700; color: #570101 !important; }

  .lista-presupuestos { display: flex; flex-direction: column; gap: 10px; }
  .tarjeta-presupuesto {
    border: 1px solid #9e7d7d; border-radius: 12px; padding: 12px 14px; background: #fff;
    transition: box-shadow 0.15s;
  }
  .tarjeta-presupuesto:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.07); }
  .tarjeta-presupuesto.mas-barato { border-color: #2e7d32; box-shadow: inset 0 0 0 1px #2e7d32; }
  .cabecera-presupuesto { display: flex; align-items: center; gap: 10px; }
  .nombre-presupuesto { font-size: 0.9rem; font-weight: 700; color: #1a1a1a; }
  .sub-presupuesto { font-size: 0.7rem; color: #777; }
  .monto-presupuesto { margin-left: auto; text-align: right; }
  .monto-presupuesto strong { display: block; font-size: 1.15rem; color: #570101; }
  .monto-presupuesto span { font-size: 0.66rem; color: #777; }
  .etiqueta-mas-barato { font-size: 0.62rem; font-weight: 700; color: #2e7d32; text-transform: uppercase; letter-spacing: 0.04em; }
  .meta-presupuesto { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 8px 0 6px; font-size: 0.74rem; color: #333; }
  .meta-presupuesto span { display: inline-flex; align-items: center; gap: 5px; }
  .meta-presupuesto svg { width: 13px; height: 13px; color: #570101; }
  .mensaje-presupuesto { font-size: 0.8rem; color: #333; line-height: 1.45; white-space: pre-line; background: #fafafa; border-radius: 8px; padding: 8px 10px; }
  .aviso-fecha-presupuesto { font-size: 0.72rem; color: #a1261e; margin-top: 6px; }
  .acciones-presupuesto { display: flex; gap: 8px; margin-top: 10px; }
  .acciones-presupuesto button { flex: 1; }
  .resumen-confirmar { background: #fcf8f8; border: 1px solid #ecdede; border-radius: 12px; padding: 12px 14px; margin: 0.8rem 0; font-size: 0.84rem; color: #333; line-height: 1.6; }
  .resumen-confirmar strong { color: #570101; }
  .orden-presupuestos { display: flex; justify-content: flex-end; gap: 6px; margin-bottom: 8px; }
  @media (max-width: 520px) { .datos-cuando { grid-template-columns: 1fr; } }
`;

/* ------------------------------------------------------------------ */
/* Detalle de un problema (lo ve el trabajador)                        */
/* ------------------------------------------------------------------ */

export function DetalleProblemaModal({ problema, onCerrar, onPresupuestar, onRetirar, procesando = false }) {
  const fechas = fechasPosibles(problema);
  const franja = FRANJAS[problema.franja];
  const estado = estadoVisible(problema);
  const puedePresupuestar = !problema.esMio && !problema.miPresupuesto && estado === "por revisar";
  const mio = problema.miPresupuesto;

  return (
    <Modal etiqueta={`Problema: ${problema.titulo}`} onCerrar={onCerrar}>
      <style>{estilosModales}</style>
      <div className="encabezado-detalle">
        <ImagenProblema problema={problema} />
        <div style={{ minWidth: 0 }}>
          <h2 className="titulo-detalle">{problema.titulo}</h2>
          <div className="chips-detalle">
            <span className="chip-categoria-detalle">{problema.categoria}</span>
            <ChipUrgencia urgencia={problema.urgencia} />
            {estado !== "por revisar" && <ChipEstado estado={estado} />}
          </div>
        </div>
      </div>

      <div className="cliente-detalle">
        <Avatar src={problema.cliente?.foto} nombre={problema.cliente?.nombre} tamano={30} />
        <span>
          Publicado por <strong>{problema.cliente?.nombre || "un cliente"}</strong>
          {problema.creado ? ` · ${tiempoRelativo(problema.creado)}` : ""}
        </span>
        {problema.presupuestoEstimado != null && (
          <span className="estimado-detalle" title="Lo que el cliente estima gastar">
            Hasta {formatearPesos(problema.presupuestoEstimado)}
          </span>
        )}
      </div>

      {mio && (
        <div className="mi-presupuesto-detalle">
          <span>
            Tu presupuesto: <strong>{formatearPesos(mio.monto)}</strong> · {fechaCorta(mio.dia)} {mio.hora} hs ·{" "}
            <ChipEstado estado={mio.estado} tipo="presupuesto" />
          </span>
          {mio.estado === "enviado" && onRetirar && (
            <button className="boton-pill secundario" onClick={() => onRetirar(mio)} disabled={procesando}>
              Retirar presupuesto
            </button>
          )}
        </div>
      )}

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">El problema</p>
        <p className="texto-seccion-modal">{problema.descripcion}</p>
      </div>

      {problema.fotos?.length > 0 && (
        <div className="seccion-modal">
          <p className="titulo-seccion-modal">Fotos</p>
          <GaleriaFotos fotos={problema.fotos} />
        </div>
      )}

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">Cuándo pueden ir</p>
        <div className="datos-cuando">
          <div className="dato-cuando"><strong>Fechas</strong>{textoPeriodo(problema.periodo)}</div>
          <div className="dato-cuando"><strong>Días</strong>{textoDiasSemana(problema.diassemana)}</div>
          <div className="dato-cuando"><strong>Horario</strong>{franja ? `${franja.etiqueta} (${franja.detalle})` : "A convenir"}</div>
          <div className="dato-cuando"><strong>Días posibles</strong>{fechas.length} {fechas.length === 1 ? "día" : "días"}</div>
        </div>
        {fechas.length > 0 && (
          <div className="fechas-chips">
            {fechas.slice(0, 10).map((f) => <span className="fecha-chip" key={f}>{fechaCorta(f)}</span>)}
            {fechas.length > 10 && <span className="fecha-chip">+{fechas.length - 10} más</span>}
          </div>
        )}
      </div>

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">Dónde</p>
        <p className="texto-seccion-modal">{[problema.barrio, problema.localidad].filter(Boolean).join(", ")}</p>
        {problema.direccion && (
          <div className="direccion-detalle">{Iconos.ubicacion} Dirección: <strong>{problema.direccion}</strong></div>
        )}
      </div>

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">Presupuestos</p>
        <p className="texto-seccion-modal">
          {problema.cantidadPresupuestos > 0
            ? `Ya recibió ${problema.cantidadPresupuestos} ${problema.cantidadPresupuestos === 1 ? "presupuesto" : "presupuestos"}.`
            : "Todavía nadie mandó presupuesto. ¡Sé el primero!"}
        </p>
      </div>

      {puedePresupuestar && onPresupuestar && (
        <button className="boton-grande-modal" onClick={() => onPresupuestar(problema)}>Enviar presupuesto</button>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Enviar presupuesto (trabajador) — mismo estilo que "Agendar"        */
/* ------------------------------------------------------------------ */

export function PresupuestoModal({ problema, onCerrar, onEnviado }) {
  const fechas = useMemo(() => fechasPosibles(problema), [problema]);
  const horas = useMemo(() => horasDeFranja(problema.franja), [problema.franja]);
  const [dia, setDia] = useState(fechas.length === 1 ? fechas[0] : "");
  const [hora, setHora] = useState("");
  const [monto, setMonto] = useState("");
  const [duracion, setDuracion] = useState("");
  const [materiales, setMateriales] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Al tocar cualquier campo se borra el error anterior
  const conCambio = (setter) => (valor) => {
    setError("");
    setter(valor);
  };

  const enviar = async () => {
    setError("");
    if (!monto || Number(monto) <= 0) return setError("Poné el monto total del presupuesto.");
    if (!dia) return setError("Elegí qué día podés ir.");
    if (!hora) return setError("Elegí a qué hora llegarías.");
    if (!duracion) return setError("Indicá cuánto te va a llevar.");
    if (!materiales) return setError("Indicá si los materiales están incluidos.");
    if (mensaje.trim().length < 15) return setError("Contale al cliente qué incluye tu presupuesto (mínimo 15 letras).");
    setEnviando(true);
    try {
      const presupuesto = await enviarPresupuesto(problema, { monto: Number(monto), dia, hora, duracion, materiales, mensaje });
      onEnviado?.(presupuesto);
    } catch (err) {
      setError(err.message || "No se pudo enviar el presupuesto. Probá de nuevo.");
      setEnviando(false);
    }
  };

  const franja = FRANJAS[problema.franja];

  return (
    <Modal etiqueta={`Enviar presupuesto para ${problema.titulo}`} onCerrar={onCerrar} ancho={500}>
      <style>{estilosModales}</style>
      <h2 className="titulo-modal-grande">Presupuesto</h2>
      <p className="subtitulo-modal">Para: <strong>{problema.titulo}</strong></p>
      <p className="detalle-modal">
        {problema.categoria} · {[problema.barrio, problema.localidad].filter(Boolean).join(", ")}
        {problema.presupuestoEstimado != null ? ` · El cliente estima hasta ${formatearPesos(problema.presupuestoEstimado)}` : ""}
      </p>

      <div className="campo-modal">
        <label className="etiqueta-modal" htmlFor="monto-presupuesto">Precio total del trabajo ($)</label>
        <input
          id="monto-presupuesto"
          className="entrada-modal monto-presupuesto-input"
          type="number"
          min="0"
          step="500"
          placeholder="Ej: 25000"
          value={monto}
          onChange={(e) => conCambio(setMonto)(e.target.value)}
        />
      </div>

      <label className="etiqueta-modal">¿Qué día podés ir?</label>
      <Calendario modo="unico" habilitadas={fechas} valor={dia} onCambio={conCambio(setDia)} />
      <p className="cal-resumen">
        {dia ? <>Elegiste el <strong>{fechaLarga(dia)}</strong></> : `Solo se pueden elegir los ${fechas.length} días que eligió el cliente`}
      </p>

      <div className="fila-modal">
        <div className="campo-modal">
          <label className="etiqueta-modal" htmlFor="hora-presupuesto">Horario de llegada</label>
          <select id="hora-presupuesto" className="select-modal" value={hora} onChange={(e) => conCambio(setHora)(e.target.value)}>
            <option value="">{franja ? `${franja.etiqueta} (${franja.detalle})` : "Elegí un horario"}</option>
            {horas.map((h) => <option key={h} value={h}>{h} hs</option>)}
          </select>
        </div>
        <div className="campo-modal">
          <label className="etiqueta-modal" htmlFor="duracion-presupuesto">Duración estimada</label>
          <select id="duracion-presupuesto" className="select-modal" value={duracion} onChange={(e) => conCambio(setDuracion)(e.target.value)}>
            <option value="">Elegí</option>
            {DURACIONES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="campo-modal">
        <label className="etiqueta-modal">Materiales</label>
        <div className="chips-modal">
          {Object.entries(MATERIALES).map(([id, texto]) => (
            <button type="button" key={id} className={`chip-modal ${materiales === id ? "activo" : ""}`} onClick={() => conCambio(setMateriales)(id)}>
              {texto}
            </button>
          ))}
        </div>
      </div>

      <div className="campo-modal">
        <label className="etiqueta-modal" htmlFor="mensaje-presupuesto">¿Qué incluye tu presupuesto?</label>
        <textarea
          id="mensaje-presupuesto"
          className="textarea-modal"
          maxLength={1500}
          placeholder="Ej: Cambio el flexible y la válvula, reviso la pérdida y dejo todo sellado. Tengo 8 años de experiencia en plomería."
          value={mensaje}
          onChange={(e) => conCambio(setMensaje)(e.target.value)}
        />
      </div>

      {error && <p className="error-modal" role="alert">{error}</p>}
      <button className="boton-grande-modal" onClick={enviar} disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar presupuesto"}
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Presupuestos recibidos (cliente)                                    */
/* ------------------------------------------------------------------ */

function TarjetaPresupuesto({ pr, esMasBarato, onAceptar, onRechazar, procesando }) {
  const puedeResponder = pr.estado === "enviado";
  return (
    <article className={`tarjeta-presupuesto ${esMasBarato ? "mas-barato" : ""}`}>
      <div className="cabecera-presupuesto">
        <Avatar src={pr.trabajador?.foto} nombre={pr.trabajador?.nombre} tamano={44} />
        <div style={{ minWidth: 0 }}>
          <div className="nombre-presupuesto">{pr.trabajador?.nombre}</div>
          <div className="sub-presupuesto">
            {pr.creado ? `Enviado ${tiempoRelativo(pr.creado)}` : ""}
            {pr.estado !== "enviado" && <> · <ChipEstado estado={pr.estado === "aceptado" ? "aceptado" : pr.estado} tipo="presupuesto" /></>}
          </div>
        </div>
        <div className="monto-presupuesto">
          {esMasBarato && <div className="etiqueta-mas-barato">Más barato</div>}
          <strong>{formatearPesos(pr.monto)}</strong>
          <span>precio total</span>
        </div>
      </div>
      <div className="meta-presupuesto">
        <span>{Iconos.calendario}{fechaLarga(pr.dia)}</span>
        <span>{Iconos.reloj}{pr.hora} hs · {pr.duracion}</span>
        <span>{Iconos.herramienta}{MATERIALES[pr.materiales] || "Materiales a convenir"}</span>
      </div>
      {pr.mensaje && <p className="mensaje-presupuesto">{pr.mensaje}</p>}
      {puedeResponder && !pr.fechaValida && (
        <p className="aviso-fecha-presupuesto">La fecha que propuso ya no está entre tus días disponibles: no se puede aceptar.</p>
      )}
      {puedeResponder && (
        <div className="acciones-presupuesto">
          <button className="boton-ver-perfil" onClick={() => onRechazar(pr)} disabled={procesando}>Rechazar</button>
          <button className="boton-agendar" onClick={() => onAceptar(pr)} disabled={procesando || !pr.fechaValida}>Aceptar y agendar</button>
        </div>
      )}
    </article>
  );
}

export function PresupuestosModal({ problema, onCerrar, onAceptar, onRechazar, procesando = false }) {
  const [orden, setOrden] = useState("precio");
  const [confirmando, setConfirmando] = useState(null);
  const presupuestos = useMemo(() => {
    const lista = [...(problema.presupuestos || [])];
    const peso = { aceptado: 0, enviado: 1, rechazado: 2, cancelado: 3 };
    return lista.sort((a, b) =>
      (peso[a.estado] ?? 4) - (peso[b.estado] ?? 4) ||
      (orden === "precio" ? a.monto - b.monto : String(a.dia).localeCompare(String(b.dia)))
    );
  }, [problema.presupuestos, orden]);
  const abiertos = presupuestos.filter((p) => p.estado === "enviado");
  const masBarato = abiertos.length > 1 ? Math.min(...abiertos.map((p) => p.monto)) : null;

  const cerrar = confirmando ? () => setConfirmando(null) : onCerrar;

  return (
    <Modal etiqueta={`Presupuestos para ${problema.titulo}`} onCerrar={cerrar} ancho={620}>
      <style>{estilosModales}</style>
      {confirmando ? (
        <>
          <h2 className="titulo-modal-grande">¿Confirmás?</h2>
          <p className="subtitulo-modal">Vas a agendar <strong>{problema.titulo}</strong></p>
          <div className="resumen-confirmar">
            Con <strong>{confirmando.trabajador?.nombre}</strong><br />
            El <strong>{fechaLarga(confirmando.dia)}</strong> a las <strong>{confirmando.hora} hs</strong><br />
            Por <strong>{formatearPesos(confirmando.monto)}</strong> ({MATERIALES[confirmando.materiales]?.toLowerCase()})
          </div>
          <p className="detalle-modal">
            Los demás presupuestos se rechazan automáticamente y le compartimos tu dirección a {confirmando.trabajador?.nombre}.
          </p>
          <div className="acciones-modal" style={{ justifyContent: "center" }}>
            <button className="boton-pill secundario" onClick={() => setConfirmando(null)} disabled={procesando}>Volver</button>
            <button className="boton-pill primario" onClick={() => onAceptar(confirmando)} disabled={procesando}>
              {procesando ? "Agendando..." : "Sí, aceptar y agendar"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="titulo-modal-grande">Presupuestos</h2>
          <p className="subtitulo-modal">Para: <strong>{problema.titulo}</strong></p>
          <p className="detalle-modal">
            {abiertos.length > 0
              ? `${abiertos.length} ${abiertos.length === 1 ? "presupuesto para elegir" : "presupuestos para elegir"} · ${textoPeriodo(problema.periodo)}`
              : "Todavía no tenés presupuestos para elegir."}
          </p>
          {presupuestos.length > 1 && (
            <div className="orden-presupuestos">
              <button className={`chip-modal ${orden === "precio" ? "activo" : ""}`} onClick={() => setOrden("precio")}>Más baratos primero</button>
              <button className={`chip-modal ${orden === "fecha" ? "activo" : ""}`} onClick={() => setOrden("fecha")}>Más pronto primero</button>
            </div>
          )}
          {presupuestos.length === 0 ? (
            <p className="texto-seccion-modal" style={{ textAlign: "center", padding: "1.5rem 0" }}>
              Cuando un trabajador te mande un presupuesto, te avisamos en la campanita 🔔
            </p>
          ) : (
            <div className="lista-presupuestos">
              {presupuestos.map((pr) => (
                <TarjetaPresupuesto
                  key={pr.id}
                  pr={pr}
                  esMasBarato={masBarato !== null && pr.estado === "enviado" && pr.monto === masBarato}
                  onAceptar={setConfirmando}
                  onRechazar={onRechazar}
                  procesando={procesando}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmación genérica (cancelar, retirar...)                        */
/* ------------------------------------------------------------------ */

export function ConfirmarModal({ titulo, texto, textoConfirmar = "Confirmar", peligro = false, procesando = false, onConfirmar, onCerrar }) {
  return (
    <Modal etiqueta={titulo} onCerrar={onCerrar} ancho={440}>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.25rem", textTransform: "none" }}>{titulo}</h2>
      <p className="texto-seccion-modal" style={{ textAlign: "center", margin: "0.8rem 0 0.4rem" }}>{texto}</p>
      <div className="acciones-modal" style={{ justifyContent: "center" }}>
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
        <button className={`boton-pill ${peligro ? "peligro" : "primario"}`} onClick={onConfirmar} disabled={procesando}>
          {procesando ? "Un momento..." : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
