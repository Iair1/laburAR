import { useEffect, useMemo, useState } from "react";
import { crearSolicitud } from "../api";

const estilos = `
  .fondo-modal-agendar {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
    animation: aparecer-fondo-agendar 0.15s ease-out;
  }
  @keyframes aparecer-fondo-agendar { from { opacity: 0; } to { opacity: 1; } }
  .tarjeta-modal-agendar {
    position: relative;
    background: #fff;
    border: 1.5px solid #1a1a1a;
    border-radius: 26px;
    padding: 1.6rem 2rem 1.75rem;
    width: 100%;
    max-width: 480px;
    max-height: 92vh;
    overflow-y: auto;
    box-sizing: border-box;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    animation: aparecer-tarjeta-agendar 0.18s ease-out;
  }
  @keyframes aparecer-tarjeta-agendar {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .titulo-modal-agendar {
    display: block;
    font-size: 1.6rem;
    font-weight: 700;
    color: #111;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    text-align: center;
  }
  .cerrar-modal-agendar {
    position: absolute;
    top: 14px;
    right: 16px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #666;
    line-height: 1;
    transition: background 0.15s;
  }
  .cerrar-modal-agendar:hover { background: #f0f0ee; color: #1a1a1a; }
  .subtitulo-modal-agendar { font-size: 0.8rem; color: #333; margin: 4px 0 2px; text-align: center; }
  .trabajador-modal-agendar { font-size: 0.74rem; color: #777; margin-bottom: 0.9rem; text-align: center; }

  /* --- calendario --- */
  .nav-mes-calendario {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 0.7rem;
  }
  .boton-nav-mes {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: #1a1a1a;
    font-weight: 600;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    line-height: 1;
    transition: background 0.15s;
  }
  .boton-nav-mes:hover { background: #f0f0ee; }
  .nombre-mes-calendario {
    font-size: 1.05rem;
    font-weight: 500;
    color: #1a1a1a;
    min-width: 130px;
    text-align: center;
  }
  .grilla-dias-semana, .grilla-calendario {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  .grilla-dias-semana {
    background: #7a2a2a;
    border-radius: 10px;
    padding: 6px 10px;
    margin-bottom: 8px;
  }
  .etiqueta-dia-semana {
    text-align: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: #fff;
  }
  .contenedor-calendario {
    background: #a8a8a8;
    border-radius: 14px;
    padding: 10px;
  }
  .grilla-calendario { row-gap: 6px; }
  .celda-calendario {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 0;
  }
  .celda-calendario.en-rango { background: #3b1e0d; }
  .celda-calendario.inicio-rango { background: linear-gradient(90deg, transparent 50%, #3b1e0d 50%); }
  .celda-calendario.fin-rango { background: linear-gradient(90deg, #3b1e0d 50%, transparent 50%); }
  .celda-dia-calendario {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.76rem;
    font-weight: 600;
    color: #fff;
    background: #6b4a3e;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: background 0.12s, transform 0.1s;
  }
  .celda-dia-calendario:hover:not(:disabled) { background: #570101; transform: scale(1.06); }
  .celda-dia-calendario.vacia { background: none; cursor: default; }
  .celda-dia-calendario.pasada { background: #c4bcb9; color: #8a8380; cursor: not-allowed; }
  .celda-dia-calendario.hoy { box-shadow: 0 0 0 2px #fff; }
  .celda-dia-calendario.en-rango { background: #3b1e0d; }
  .celda-dia-calendario.punta-rango { background: #8a0f0f; color: #fff; box-shadow: 0 0 0 2px #fff; }

  .resumen-periodo-calendario {
    text-align: center;
    font-size: 0.76rem;
    color: #555;
    margin: 10px 0 4px;
  }
  .resumen-periodo-calendario strong { color: #570101; }

  .campo-agendar { margin: 0.9rem 0 0.8rem; }
  .etiqueta-agendar {
    display: block; font-size: 0.85rem; font-weight: 500; color: #1a1a1a;
    margin: 0 0 0.3rem 0.5rem;
  }
  .entrada-agendar, .textarea-agendar, .select-agendar {
    width: 100%;
    padding: 9px 14px;
    border: 1px solid #8f8f8f;
    border-radius: 10px;
    font-size: 0.82rem;
    color: #222;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
    background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .select-agendar {
    background: #c9c9c9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='%23222' d='M0 2.5h10L5 8.5z'/%3E%3C/svg%3E") no-repeat right 14px center / 10px;
    appearance: none;
    -webkit-appearance: none;
    padding-right: 34px;
    cursor: pointer;
  }
  .entrada-agendar:focus, .textarea-agendar:focus, .select-agendar:focus {
    border-color: #570101;
    box-shadow: 0 0 0 3px rgba(87,1,1,0.12);
  }
  .textarea-agendar { resize: vertical; min-height: 65px; }

  .chips-dias-agendar { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-dia-agendar {
    padding: 5px 11px;
    border-radius: 999px;
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    font-size: 0.72rem;
    font-weight: 500;
    color: #1a1a1a;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .chip-dia-agendar:hover { background: #bdbdbd; }
  .chip-dia-agendar.activo { background: #7a2a2a; border-color: #570101; color: #fff; }

  .error-agendar { font-size: 0.8rem; color: #d0341a; font-weight: 600; margin-bottom: 10px; text-align: center; }

  .boton-enviar-agendar {
    display: block;
    margin: 1rem auto 0;
    min-width: 220px;
    padding: 11px 36px;
    background: #6b0d0d;
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(87,1,1,0.25);
    transition: background 0.15s, transform 0.1s;
  }
  .boton-enviar-agendar:hover { background: #570101; }
  .boton-enviar-agendar:active:not(:disabled) { transform: scale(0.98); }
  .boton-enviar-agendar:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 480px) {
    .tarjeta-modal-agendar { padding: 1.4rem 1rem 1.4rem; }
    .celda-dia-calendario { width: 28px; height: 28px; font-size: 0.72rem; }
  }
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
function fechaLegible(fechaStr) {
  return aFechaLocal(fechaStr).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
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

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === "Escape") onCerrar?.();
    };
    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

  if (!trabajador) return null;

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
        <div
          className="tarjeta-modal-agendar"
          role="dialog"
          aria-modal="true"
          aria-label={`Agendar con ${trabajador.nombre}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="cerrar-modal-agendar" onClick={onCerrar} aria-label="Cerrar">✕</button>
          <h2 className="titulo-modal-agendar">Calendario</h2>
          <p className="subtitulo-modal-agendar">
            Seleccioná los días/semanas en los que necesitás el servicio
          </p>
          <p className="trabajador-modal-agendar">
            Agendar con {trabajador.nombre}
            {trabajador.etiquetaCategoria ? ` · ${trabajador.etiquetaCategoria}` : ""}
          </p>

          <div className="nav-mes-calendario">
            <button className="boton-nav-mes" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
            <span className="nombre-mes-calendario">
              {NOMBRES_MES[mesVisible.getMonth()]}
              {mesVisible.getFullYear() !== new Date().getFullYear() ? ` ${mesVisible.getFullYear()}` : ""}
            </span>
            <button className="boton-nav-mes" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
          </div>

          <div className="grilla-dias-semana">
            {DIAS_HEADER.map((d, i) => (
              <span className="etiqueta-dia-semana" key={i}>{d}</span>
            ))}
          </div>
          <div className="contenedor-calendario">
            <div className="grilla-calendario">
              {diasDelMes.map((fechaStr, i) => {
                if (!fechaStr) return <span className="celda-calendario" key={i} />;
                const esPasada = fechaStr < hoy;
                const esPunta = fechaStr === periodoInicio || fechaStr === periodoFin;
                const hayRango = periodoInicio && periodoFin && periodoInicio !== periodoFin;
                const enRango =
                  periodoInicio && periodoFin && fechaStr > periodoInicio && fechaStr < periodoFin;
                const clasesCelda = [
                  "celda-calendario",
                  enRango ? "en-rango" : "",
                  hayRango && fechaStr === periodoInicio ? "inicio-rango" : "",
                  hayRango && fechaStr === periodoFin ? "fin-rango" : "",
                ].filter(Boolean).join(" ");
                const clases = [
                  "celda-dia-calendario",
                  esPasada ? "pasada" : "",
                  fechaStr === hoy ? "hoy" : "",
                  enRango ? "en-rango" : "",
                  esPunta ? "punta-rango" : "",
                ].filter(Boolean).join(" ");
                return (
                  <span className={clasesCelda} key={fechaStr}>
                    <button
                      type="button"
                      className={clases}
                      disabled={esPasada}
                      onClick={() => manejarClickDia(fechaStr)}
                      aria-label={fechaStr}
                      aria-pressed={esPunta || Boolean(enRango)}
                    >
                      {Number(fechaStr.slice(-2))}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <p className="resumen-periodo-calendario">
            {periodoInicio && periodoFin ? (
              periodoInicio === periodoFin ? (
                <>El <strong>{fechaLegible(periodoInicio)}</strong></>
              ) : (
                <>Del <strong>{fechaLegible(periodoInicio)}</strong> al <strong>{fechaLegible(periodoFin)}</strong></>
              )
            ) : periodoInicio ? (
              <>Elegí el día de fin (desde el <strong>{fechaLegible(periodoInicio)}</strong>). Si es un solo día, tocalo de nuevo.</>
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
