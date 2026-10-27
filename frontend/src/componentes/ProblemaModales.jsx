import { useState } from "react";
import Avatar from "./Avatar";
import { ImagenProblema, ChipEstado, ChipUrgencia, Calendario, Modal } from "./ProblemasUI";
import {
  FRANJAS,
  fechasPosibles,
  fechaCorta,
  fechaLarga,
  textoPeriodo,
  textoDiasSemana,
  estadoVisible,
} from "../problemasDatos";

const estilosModales = `
  .encabezado-detalle { display: flex; gap: 14px; align-items: center; padding-right: 24px; margin-bottom: 0.9rem; }
  .titulo-detalle { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; line-height: 1.25; }
  .chips-detalle { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }
  .chip-categoria-detalle { font-size: 0.68rem; font-weight: 600; color: #fff; background: #7a2a2a; border-radius: 999px; padding: 3px 10px; }
  .cliente-detalle { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #444; margin-bottom: 1rem; }
  .datos-cuando { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .dato-cuando { background: #fcf8f8; border: 1px solid #ecdede; border-radius: 10px; padding: 8px 10px; font-size: 0.76rem; color: #333; }
  .dato-cuando strong { display: block; font-size: 0.68rem; color: #7a2a2a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
  .fechas-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .fecha-chip { font-size: 0.7rem; font-weight: 600; background: #f4eeee; border: 1px solid #e3d3d3; color: #3b1e0d; border-radius: 999px; padding: 3px 9px; }
  .cita-detalle {
    border: 1px solid #b7dfba; background: #f1f9f2; border-radius: 12px; padding: 10px 12px; margin-bottom: 1rem;
    font-size: 0.82rem; color: #1e5e22; line-height: 1.5;
  }
  .resumen-confirmar { background: #fcf8f8; border: 1px solid #ecdede; border-radius: 12px; padding: 12px 14px; margin: 0.8rem 0; font-size: 0.84rem; color: #333; line-height: 1.6; text-align: center; }
  .resumen-confirmar strong { color: #570101; }
  .horario-agendar { font-size: 0.78rem; color: #333; text-align: center; margin: 0 0 0.8rem; }
  .horario-agendar strong { color: #570101; }
  .sin-fechas-agendar { text-align: center; font-size: 0.85rem; color: #555; padding: 1.2rem 0.5rem; }
  @media (max-width: 520px) { .datos-cuando { grid-template-columns: 1fr; } }
`;

/* ------------------------------------------------------------------ */
/* Detalle de un problema                                              */
/*  - el trabajador lo ve antes de agendar (botón "Agendar cita")      */
/*  - en "Mis citas" muestra el día elegido (botón "Cancelar cita")    */
/*  - paraCliente: lo ve quien lo publicó ("Mis problemas")            */
/* ------------------------------------------------------------------ */

export function DetalleProblemaModal({ problema, onCerrar, onAgendar, onCancelarCita, paraCliente = false }) {
  const estado = estadoVisible(problema);
  const esCita = problema.estado === "pendiente" || problema.estado === "terminada";
  const fechas = esCita ? [] : fechasPosibles(problema);
  const franja = FRANJAS[problema.franja];

  return (
    <Modal etiqueta={`Problema: ${problema.titulo}`} onCerrar={onCerrar}>
      <style>{estilosModales}</style>
      <div className="encabezado-detalle">
        <ImagenProblema problema={problema} />
        <div style={{ minWidth: 0 }}>
          <h2 className="titulo-detalle">{problema.titulo}</h2>
          <div className="chips-detalle">
            {problema.categoria && <span className="chip-categoria-detalle">{problema.categoria}</span>}
            <ChipUrgencia urgencia={problema.urgencia} />
            {estado !== "por revisar" && <ChipEstado estado={estado} />}
          </div>
        </div>
      </div>

      {!paraCliente && problema.cliente && (
        <div className="cliente-detalle">
          <Avatar src={problema.cliente.foto} nombre={problema.cliente.nombre} tamano={30} />
          <span>
            Publicado por <strong>{problema.cliente.nombre}</strong>
          </span>
        </div>
      )}

      {esCita && problema.dia && (
        <div className="cita-detalle">
          {paraCliente ? (
            <>
              {problema.trabajador && (
                <div className="cliente-detalle" style={{ marginBottom: 4, color: "inherit" }}>
                  <Avatar src={problema.trabajador.foto} nombre={problema.trabajador.nombre} tamano={30} />
                  <span>Cita con <strong>{problema.trabajador.nombre}</strong></span>
                </div>
              )}
              {estado === "terminada" ? "Fue el " : "Va a ir el "}
            </>
          ) : estado === "terminada" ? "Fuiste el " : "Tu cita es el "}
          <strong>{fechaLarga(problema.dia)}</strong>
          {franja ? ` · ${franja.etiqueta} (${franja.detalle})` : ""}
        </div>
      )}

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">El problema</p>
        <p className="texto-seccion-modal">{problema.descripcion || problema.textoOriginal}</p>
      </div>

      {!esCita && (
        <div className="seccion-modal">
          <p className="titulo-seccion-modal">Cuándo pueden ir</p>
          <div className="datos-cuando">
            <div className="dato-cuando"><strong>Fechas</strong>{textoPeriodo(problema.periodo) || "Sin definir"}</div>
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
      )}

      <div className="seccion-modal">
        <p className="titulo-seccion-modal">Dónde</p>
        <p className="texto-seccion-modal">{[problema.barrio, problema.localidad].filter(Boolean).join(", ") || "Sin definir"}</p>
      </div>

      {onAgendar && estado === "por revisar" && (
        <button className="boton-grande-modal" onClick={() => onAgendar(problema)}>Agendar cita</button>
      )}
      {onCancelarCita && problema.estado === "pendiente" && estado === "pendiente" && (
        <div className="acciones-modal" style={{ justifyContent: "center" }}>
          <button className="boton-pill peligro" onClick={() => onCancelarCita(problema)}>Cancelar cita</button>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Agendar cita: el trabajador elige un día entre los del cliente      */
/* ------------------------------------------------------------------ */

export function AgendarCitaModal({ problema, onCerrar, onConfirmar }) {
  const fechas = fechasPosibles(problema);
  const [dia, setDia] = useState(fechas.length === 1 ? fechas[0] : "");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const franja = FRANJAS[problema.franja];
  const nombreCliente = problema.cliente?.nombre?.split(" ")[0] || "el cliente";

  const confirmar = async () => {
    if (!dia) {
      setError("Elegí qué día vas a ir.");
      return;
    }
    setError("");
    setProcesando(true);
    try {
      await onConfirmar(problema, dia);
    } catch (err) {
      setError(err.message || "No se pudo agendar la cita. Probá de nuevo.");
      setProcesando(false);
    }
  };

  return (
    <Modal etiqueta="Agendar cita" onCerrar={procesando ? undefined : onCerrar} ancho={480}>
      <style>{estilosModales}</style>
      <h2 className="titulo-modal-grande">Agendar cita</h2>
      <p className="subtitulo-modal">{problema.titulo}</p>
      <p className="detalle-modal">
        Elegí qué día vas a ir. Solo se pueden elegir los días que puso {nombreCliente}.
      </p>

      {fechas.length === 0 ? (
        <p className="sin-fechas-agendar">Este problema ya no tiene días disponibles.</p>
      ) : (
        <>
          {franja && (
            <p className="horario-agendar">
              Horario que pidió: <strong>{franja.etiqueta} ({franja.detalle})</strong>
            </p>
          )}
          <Calendario
            modo="unico"
            valor={dia}
            habilitadas={fechas}
            onCambio={(f) => {
              setDia(f);
              setError("");
            }}
          />
          {dia && (
            <div className="resumen-confirmar">
              Vas a ir el <strong>{fechaLarga(dia)}</strong>
              {franja ? <> · {franja.etiqueta} ({franja.detalle})</> : null}
              <br />
              en {[problema.barrio, problema.localidad].filter(Boolean).join(", ")}
            </div>
          )}
          {error && <p className="error-modal" role="alert">{error}</p>}
          <button className="boton-grande-modal" onClick={confirmar} disabled={procesando || !dia}>
            {procesando ? "Agendando..." : "Confirmar cita"}
          </button>
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmación genérica (cancelar, etc.)                              */
/* ------------------------------------------------------------------ */

export function ConfirmarModal({ titulo, texto, textoConfirmar = "Confirmar", peligro = false, procesando = false, error = "", onConfirmar, onCerrar }) {
  return (
    <Modal etiqueta={titulo} onCerrar={procesando ? undefined : onCerrar} ancho={440}>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.25rem", textTransform: "none" }}>{titulo}</h2>
      <p className="texto-seccion-modal" style={{ textAlign: "center", margin: "0.8rem 0 0.4rem" }}>{texto}</p>
      {error && <p className="error-modal" role="alert">{error}</p>}
      <div className="acciones-modal" style={{ justifyContent: "center" }}>
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Volver</button>
        <button className={`boton-pill ${peligro ? "peligro" : "primario"}`} onClick={onConfirmar} disabled={procesando}>
          {procesando ? "Un momento..." : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
