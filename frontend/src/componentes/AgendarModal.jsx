import { useMemo, useState } from "react";
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
    border-radius: 16px;
    padding: 1.75rem;
    width: 100%;
    max-width: 440px;
    max-height: 92vh;
    overflow-y: auto;
    box-sizing: border-box;
  }
  .encabezado-modal-agendar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.2rem;
  }
  .titulo-modal-agendar {
    font-size: 1.15rem;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    margin: 0 auto;
    text-align: center;
  }
  .cerrar-modal-agendar {
    background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #888; line-height: 1;
  }
  .subtitulo-modal-agendar { font-size: 0.8rem; color: #777; margin-bottom: 1.1rem; text-align: center; }

  /* --- calendario --- */
  .nav-mes-calendario {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 0.7rem;
  }
  .boton-nav-mes {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    color: #570101;
    font-weight: 700;
    padding: 2px 8px;
  }
  .nombre-mes-calendario {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1a1a1a;
    min-width: 130px;
    text-align: center;
  }
  .grilla-dias-semana, .grilla-calendario {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .grilla-dias-semana {
    margin-bottom: 4px;
  }
  .etiqueta-dia-semana {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #999;
    padding: 4px 0;
  }
  .celda-dia-calendario {
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: #333;
    background: #efefed;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: background 0.12s, color 0.12s;
  }
  .celda-dia-calendario:hover { background: #e2ddd6; }
  .celda-dia-calendario.vacia { background: none; cursor: default; }
  .celda-dia-calendario.pasada { color: #ccc; cursor: not-allowed; }
  .celda-dia-calendario.en-rango { background: #f2d9d9; color: #570101; border-radius: 0; }
  .celda-dia-calendario.punta-rango { background: #570101; color: #fff; border-radius: 50%; }

  .resumen-periodo-calendario {
    text-align: center;
    font-size: 0.78rem;
    color: #555;
    margin: 10px 0 4px;
  }
  .resumen-periodo-calendario strong { color: #570101; }

  .campo-agendar { margin: 1rem 0 0.9rem; }
  .etiqueta-agendar {
    display: block; font-size: 0.72rem; font-weight: 700; color: #555;
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;
  }
  .entrada-agendar, .textarea-agendar, .select-agendar {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #222;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
    background: #fff;
  }
  .entrada-agendar:focus, .textarea-agendar:focus, .select-agendar:focus { border-color: #570101; }
  .textarea-agendar { resize: vertical; min-height: 65px; }

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
  .chip-dia-agendar.activo { background: #570101; border-color: #570101; color: #fff; }

  .error-agendar { font-size: 0.8rem; color: #d0341a; font-weight: 600; margin-bottom: 10px; text-align: center; }

  .boton-enviar-agendar {
    width: 100%;
    padding: 13px;
    background: #570101;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;
    margin-top: 6px;
    transition: background 0.15s;
  }
  .boton-enviar-agendar:hover { background: #3b1e0d; }
  .boton-enviar-agendar:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_HEADER = ["D", "L", "M", "X", "J", "V", "S"];
const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const HORARIOS = [
  "8:00 hrs", "9:00 hrs", "10:00 hrs", "11:00 hrs", "13:00 hrs",
  "14:00 hrs", "15:00 hrs", "16:00 hrs", "17:00 hrs", "18:00 hrs",
];

function aFechaLocal(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function aFechaStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function hoyStr() {
  const h = new Date();
  return aFechaStr(h.getFullYear(), h.getMonth(), h.getDate());
}

/**
 * Modal para mandarle una solicitud (pedido de cita) a un trabajador.
 * Props:
 *  - trabajador: { id, nombre, zona, etiquetaCategoria }
 *  - onCerrar(): cierra el modal sin hacer nada
 *  - onEnviada(trabajador): se llama cuando la solicitud se mandó bien
 */
export default function AgendarModal({ trabajador, onCerrar, onEnviada }) {
  const [descripcion, setDescripcion] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [horario, setHorario] = useState("");

  const [localidad, setLocalidad] = useState(trabajador?.zona || "");
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [mesVisible, setMesVisible] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });

  if (!trabajador) return null;

  const diasDelMes = useMemo(() => {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const celdas = [];
    for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
    for (let d = 1; d <= totalDias; d++) celdas.push(aFechaStr(anio, mes, d));
    return celdas;
  }, [mesVisible]);

  const hoy = hoyStr();

  const cambiarMes = (delta) => {
    setMesVisible((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const manejarClickDia = (fechaStr) => {
    if (fechaStr < hoy) return;
    if (!periodoInicio || periodoFin) {
      setPeriodoInicio(fechaStr);
      setPeriodoFin("");
    } else if (fechaStr < periodoInicio) {
      setPeriodoInicio(fechaStr);
      setPeriodoFin("");
    } else {
      setPeriodoFin(fechaStr);
    }
  };

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
    if (!descripcion.trim() || !periodoInicio || !periodoFin || !localidad.trim()) {
      setError("Completá la descripción, el período (elegí dos días en el calendario) y la localidad.");
      return;
    }

    setError("");
    setEnviando(true);
    try {
      const descripcionFinal = horario
        ? `Horario preferido: ${horario}. ${descripcion.trim()}`
        : descripcion.trim();

      await crearSolicitud({
        trabajadorid: trabajador.id,
        solicitud: descripcionFinal,
        periodo: [periodoInicio, periodoFin],
        localidad: localidad.trim(),
        diassemana: DIAS.map((dia) => diasSeleccionados.includes(dia)),
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
            <span style={{ width: 20 }} />
            <span className="titulo-modal-agendar">Calendario</span>
            <button className="cerrar-modal-agendar" onClick={onCerrar} aria-label="Cerrar">✕</button>
          </div>
          <p className="subtitulo-modal-agendar">
            Agendar con {trabajador.nombre}
            {trabajador.etiquetaCategoria ? ` · ${trabajador.etiquetaCategoria}` : ""}
          </p>

          <div className="nav-mes-calendario">
            <button className="boton-nav-mes" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
            <span className="nombre-mes-calendario">
              {NOMBRES_MES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </span>
            <button className="boton-nav-mes" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
          </div>

          <div className="grilla-dias-semana">
            {DIAS_HEADER.map((d, i) => (
              <span className="etiqueta-dia-semana" key={i}>{d}</span>
            ))}
          </div>
          <div className="grilla-calendario">
            {diasDelMes.map((fechaStr, i) => {
              if (!fechaStr) return <span className="celda-dia-calendario vacia" key={i} />;
              const esPasada = fechaStr < hoy;
              const esPunta = fechaStr === periodoInicio || fechaStr === periodoFin;
              const enRango =
                periodoInicio && periodoFin && fechaStr > periodoInicio && fechaStr < periodoFin;
              const clases = [
                "celda-dia-calendario",
                esPasada ? "pasada" : "",
                enRango ? "en-rango" : "",
                esPunta ? "punta-rango" : "",
              ].filter(Boolean).join(" ");
              return (
                <button
                  type="button"
                  className={clases}
                  key={fechaStr}
                  disabled={esPasada}
                  onClick={() => manejarClickDia(fechaStr)}
                >
                  {Number(fechaStr.slice(-2))}
                </button>
              );
            })}
          </div>

          <p className="resumen-periodo-calendario">
            {periodoInicio && periodoFin ? (
              <>Del <strong>{periodoInicio}</strong> al <strong>{periodoFin}</strong></>
            ) : periodoInicio ? (
              <>Elegí el día de fin (desde <strong>{periodoInicio}</strong>)</>
            ) : (
              "Elegí el día de inicio y el de fin"
            )}
          </p>

          <div className="campo-agendar">
            <label className="etiqueta-agendar">Horario</label>
            <select className="select-agendar" value={horario} onChange={(e) => setHorario(e.target.value)}>
              <option value="">Elegí un horario</option>
              {HORARIOS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

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
            {enviando ? "Enviando..." : "Solicitar"}
          </button>
        </div>
      </div>
    </>
  );
}
