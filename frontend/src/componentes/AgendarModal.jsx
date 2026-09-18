import { useState } from "react";
import { crearSolicitud } from "../api";

const estilos = `
  .fondo-modal-agendar {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
  }
  .tarjeta-modal-agendar {
    background: #fff;
    border-radius: 14px;
    padding: 1.75rem;
    width: 100%;
    max-width: 460px;
    max-height: 90vh;
    overflow-y: auto;
  }
  .encabezado-modal-agendar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.3rem;
  }
  .titulo-modal-agendar { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; }
  .cerrar-modal-agendar {
    background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #888; line-height: 1;
  }
  .subtitulo-modal-agendar { font-size: 0.8rem; color: #777; margin-bottom: 1.25rem; }

  .campo-agendar { margin-bottom: 0.9rem; }
  .etiqueta-agendar {
    display: block; font-size: 0.72rem; font-weight: 700; color: #555;
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;
  }
  .entrada-agendar, .textarea-agendar {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #222;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
  }
  .entrada-agendar:focus, .textarea-agendar:focus { border-color: #999; }
  .textarea-agendar { resize: vertical; min-height: 70px; }

  .chips-dias-agendar { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-dia-agendar {
    padding: 6px 11px;
    border-radius: 999px;
    border: 1.5px solid #ddd;
    background: #fff;
    font-size: 0.74rem;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .chip-dia-agendar.activo { background: #1a2332; border-color: #1a2332; color: #fff; }

  .error-agendar { font-size: 0.8rem; color: #d0341a; font-weight: 600; margin-bottom: 10px; }

  .boton-enviar-agendar {
    width: 100%;
    padding: 12px;
    background: #1a2332;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 4px;
    transition: background 0.15s;
  }
  .boton-enviar-agendar:hover { background: #0f1621; }
  .boton-enviar-agendar:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Modal para mandarle una solicitud (pedido de cita) a un trabajador.
 * Props:
 *  - trabajador: { id, nombre, zona, etiquetaCategoria }
 *  - onCerrar(): cierra el modal sin hacer nada
 *  - onEnviada(trabajador): se llama cuando la solicitud se mandó bien
 */
export default function AgendarModal({ trabajador, onCerrar, onEnviada }) {
  const [descripcion, setDescripcion] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [localidad, setLocalidad] = useState(trabajador?.zona || "");
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!trabajador) return null;

  const alternarDia = (dia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const todosLosDiasActivo = diasSeleccionados.length === DIAS.length;
  const alternarTodosLosDias = () => {
    setDiasSeleccionados((prev) => (prev.length === DIAS.length ? [] : [...DIAS]));
  };

  const manejarEnviar = async () => {
    if (!descripcion.trim() || !periodo.trim() || !localidad.trim()) {
      setError("Completá la descripción, el período y la localidad.");
      return;
    }

    setError("");
    setEnviando(true);
    try {
      await crearSolicitud({
        trabajadorid: trabajador.id,
        solicitud: descripcion.trim(),
        // Ojo: periodo también resultó ser una columna array (igual que
        // diassemana), no texto plano. Mandamos un array de un elemento.
        periodo: [periodo.trim()],
        localidad: localidad.trim(),
        // Ojo: la columna diassemana en Postgres es un array (text[]).
        // Hay que mandar un array de JS de verdad, nunca un string armado
        // a mano (eso tira "malformed array literal" en el backend).
        diassemana: diasSeleccionados,
      });
      onEnviada?.(trabajador);
    } catch (err) {
      setError(err.message || "No se pudo enviar la solicitud. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="fondo-modal-agendar" onClick={onCerrar}>
        <div className="tarjeta-modal-agendar" onClick={(e) => e.stopPropagation()}>
          <div className="encabezado-modal-agendar">
            <span className="titulo-modal-agendar">Agendar con {trabajador.nombre}</span>
            <button className="cerrar-modal-agendar" onClick={onCerrar} aria-label="Cerrar">✕</button>
          </div>
          <p className="subtitulo-modal-agendar">
            {trabajador.etiquetaCategoria ? `${trabajador.etiquetaCategoria} · ` : ""}
            Contale qué necesitás y cuándo.
          </p>

          <div className="campo-agendar">
            <label className="etiqueta-agendar">¿Qué necesitás?</label>
            <textarea
              className="textarea-agendar"
              placeholder="Ej: arreglar una pérdida de agua en la cocina"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="campo-agendar">
            <label className="etiqueta-agendar">Período</label>
            <input
              className="entrada-agendar"
              type="text"
              placeholder="Ej: última semana de octubre"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </div>

          <div className="campo-agendar">
            <label className="etiqueta-agendar">Localidad</label>
            <input
              className="entrada-agendar"
              type="text"
              placeholder="Ej: CABA"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
            />
          </div>

          <div className="campo-agendar">
            <label className="etiqueta-agendar">Días de la semana (opcional)</label>
            <div className="chips-dias-agendar">
              <span
                className={`chip-dia-agendar ${todosLosDiasActivo ? "activo" : ""}`}
                onClick={alternarTodosLosDias}
              >
                Todos los días
              </span>
              {DIAS.map((dia) => (
                <span
                  key={dia}
                  className={`chip-dia-agendar ${diasSeleccionados.includes(dia) ? "activo" : ""}`}
                  onClick={() => alternarDia(dia)}
                >
                  {dia}
                </span>
              ))}
            </div>
          </div>

          {error && <p className="error-agendar">{error}</p>}

          <button className="boton-enviar-agendar" onClick={manejarEnviar} disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </div>
    </>
  );
}
