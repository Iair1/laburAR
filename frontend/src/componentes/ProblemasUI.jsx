import { useEffect, useMemo, useState } from "react";
import { ICONOS_CATEGORIAS } from "../iconosCategorias";
import {
  ESTADOS_PROBLEMA,
  ESTADOS_PRESUPUESTO,
  URGENCIAS,
  FRANJAS,
  aFechaStr,
  hoyStr,
  formatearPesos,
  textoPeriodo,
  textoDiasSemana,
  tiempoRelativo,
  estadoVisible,
} from "../problemasDatos";

// Estilos propios de problemas/presupuestos (las tarjetas usan estilosTarjetas.js)
export const estilosProblemas = `
  .chip-estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.66rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 3px 9px;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .chip-estado::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .chip-estado.abierto { background: #e8f1fb; color: #1d4f8c; }
  .chip-estado.agendado { background: #e6f4ea; color: #1e6b2d; }
  .chip-estado.terminado { background: #f0ece4; color: #5b4a2e; }
  .chip-estado.cancelado { background: #fbeceb; color: #a1261e; }
  .chip-estado.vencido { background: #efefed; color: #666; }

  .chip-urgencia {
    display: inline-block;
    font-size: 0.64rem;
    font-weight: 700;
    border-radius: 6px;
    padding: 2px 7px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .chip-urgencia.urgente { background: #570101; color: #fff; }
  .chip-urgencia.semana { background: #f4e2c9; color: #7a4a06; }
  .chip-urgencia.flexible { background: #efefed; color: #555; }

  .imagen-problema {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px solid #555;
    overflow: hidden;
    flex-shrink: 0;
    background: #f4eeee;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .imagen-problema img { width: 100%; height: 100%; object-fit: cover; }
  .imagen-problema .icono-cat {
    width: 38px;
    height: 38px;
    background: #570101;
    -webkit-mask: var(--icono) center / contain no-repeat;
    mask: var(--icono) center / contain no-repeat;
  }
  .imagen-problema svg { width: 34px; height: 34px; color: #570101; }
  .imagen-problema.chica { width: 52px; height: 52px; }
  .imagen-problema.chica .icono-cat { width: 26px; height: 26px; }
  .imagen-problema.chica svg { width: 24px; height: 24px; }

  .galeria-fotos { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
  .galeria-fotos button {
    border: none;
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
    cursor: zoom-in;
    aspect-ratio: 1 / 1;
    background: #eee;
  }
  .galeria-fotos img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.15s; }
  .galeria-fotos button:hover img { transform: scale(1.04); }
  .visor-foto {
    position: fixed;
    inset: 0;
    z-index: 400;
    background: rgba(10,10,10,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    cursor: zoom-out;
  }
  .visor-foto img { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  .visor-foto .navegar-foto {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.9);
    font-size: 1.3rem;
    cursor: pointer;
  }
  .visor-foto .navegar-foto.anterior { left: 16px; }
  .visor-foto .navegar-foto.siguiente { right: 16px; }

  /* --- calendario (mismo estilo que el de Agendar) --- */
  .cal-nav { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 0.6rem; }
  .cal-boton-mes {
    background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #1a1a1a; font-weight: 600;
    width: 28px; height: 28px; border-radius: 50%; line-height: 1;
  }
  .cal-boton-mes:hover:not(:disabled) { background: #f0f0ee; }
  .cal-boton-mes:disabled { opacity: 0.3; cursor: default; }
  .cal-mes { font-size: 1rem; font-weight: 500; color: #1a1a1a; min-width: 140px; text-align: center; text-transform: capitalize; }
  .cal-semana, .cal-grilla { display: grid; grid-template-columns: repeat(7, 1fr); }
  .cal-semana { background: #7a2a2a; border-radius: 10px; padding: 6px 10px; margin-bottom: 8px; }
  .cal-semana span { text-align: center; font-size: 0.76rem; font-weight: 600; color: #fff; }
  .cal-contenedor { background: #a8a8a8; border-radius: 14px; padding: 10px; }
  .cal-grilla { row-gap: 6px; }
  .cal-celda { display: flex; align-items: center; justify-content: center; padding: 2px 0; }
  .cal-celda.en-rango { background: #3b1e0d; }
  .cal-celda.inicio-rango { background: linear-gradient(90deg, transparent 50%, #3b1e0d 50%); }
  .cal-celda.fin-rango { background: linear-gradient(90deg, #3b1e0d 50%, transparent 50%); }
  .cal-dia {
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    font-size: 0.76rem; font-weight: 600; color: #fff; background: #6b4a3e; border-radius: 50%;
    cursor: pointer; border: none; font-family: inherit; transition: background 0.12s, transform 0.1s;
  }
  .cal-dia:hover:not(:disabled) { background: #570101; transform: scale(1.06); }
  .cal-dia:disabled { background: #c4bcb9; color: #8a8380; cursor: not-allowed; }
  .cal-dia.hoy { box-shadow: 0 0 0 2px #fff; }
  .cal-dia.en-rango { background: #3b1e0d; }
  .cal-dia.apagado { background: #8f7a72; opacity: 0.55; }
  .cal-dia.elegido { background: #8a0f0f; box-shadow: 0 0 0 2px #fff; }
  .cal-resumen { text-align: center; font-size: 0.76rem; color: #555; margin: 8px 0 2px; }
  .cal-resumen strong { color: #570101; }
  @media (max-width: 420px) { .cal-dia { width: 27px; height: 27px; font-size: 0.7rem; } }

  /* --- modales de problemas (mismo estilo que Ver perfil / Agendar) --- */
  .fondo-modal-problema {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
    animation: aparecer-fondo-problema 0.15s ease-out;
  }
  @keyframes aparecer-fondo-problema { from { opacity: 0; } to { opacity: 1; } }
  .tarjeta-modal-problema {
    position: relative;
    background: #fff;
    border: 1.5px solid #1a1a1a;
    border-radius: 22px;
    padding: 1.6rem 1.9rem 1.5rem;
    width: 100%;
    max-width: 600px;
    max-height: 92vh;
    overflow-y: auto;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    animation: aparecer-tarjeta-problema 0.18s ease-out;
  }
  @keyframes aparecer-tarjeta-problema { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
  .cerrar-modal-problema {
    position: absolute; top: 12px; right: 14px; width: 30px; height: 30px; border-radius: 50%;
    background: none; border: none; cursor: pointer; font-size: 1rem; color: #666;
  }
  .cerrar-modal-problema:hover { background: #f0f0ee; color: #1a1a1a; }
  .titulo-modal-grande {
    font-size: 1.5rem; font-weight: 700; color: #111; text-transform: uppercase; text-align: center; letter-spacing: 0.01em;
  }
  .subtitulo-modal { font-size: 0.8rem; color: #333; text-align: center; margin: 4px 0 2px; }
  .detalle-modal { font-size: 0.74rem; color: #777; text-align: center; margin-bottom: 1rem; }
  .seccion-modal { margin-bottom: 1.05rem; }
  .titulo-seccion-modal { font-size: 0.82rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.4rem; }
  .texto-seccion-modal { font-size: 0.82rem; color: #333; line-height: 1.5; white-space: pre-line; }
  .campo-modal { margin: 0.85rem 0 0.75rem; }
  .etiqueta-modal { display: block; font-size: 0.85rem; font-weight: 500; color: #1a1a1a; margin: 0 0 0.3rem 0.4rem; }
  .entrada-modal, .textarea-modal, .select-modal {
    width: 100%; padding: 9px 14px; border: 1px solid #8f8f8f; border-radius: 10px; font-size: 0.84rem;
    color: #222; outline: none; font-family: inherit; background: #fff; box-sizing: border-box;
  }
  .select-modal {
    background: #c9c9c9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='%23222' d='M0 2.5h10L5 8.5z'/%3E%3C/svg%3E") no-repeat right 14px center / 10px;
    appearance: none; -webkit-appearance: none; padding-right: 34px; cursor: pointer;
  }
  .entrada-modal:focus, .textarea-modal:focus, .select-modal:focus { border-color: #570101; box-shadow: 0 0 0 3px rgba(87,1,1,0.12); }
  .textarea-modal { resize: vertical; min-height: 80px; line-height: 1.4; }
  .fila-modal { display: flex; gap: 12px; }
  .fila-modal > div { flex: 1; min-width: 0; }
  .chips-modal { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-modal {
    padding: 6px 12px; border-radius: 999px; border: 1px solid #8f8f8f; background: #c9c9c9; font-size: 0.74rem;
    font-weight: 500; color: #1a1a1a; cursor: pointer; font-family: inherit; transition: background 0.15s;
  }
  .chip-modal:hover { background: #bdbdbd; }
  .chip-modal.activo { background: #7a2a2a; border-color: #570101; color: #fff; }
  .error-modal { font-size: 0.8rem; color: #b3261e; font-weight: 600; text-align: center; margin: 8px 0; }
  .boton-grande-modal {
    display: block; margin: 1rem auto 0; min-width: 220px; padding: 11px 36px; background: #6b0d0d; color: #fff;
    border: none; border-radius: 999px; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
    cursor: pointer; font-family: inherit; box-shadow: 0 4px 12px rgba(87,1,1,0.25); transition: background 0.15s, transform 0.1s;
  }
  .boton-grande-modal:hover { background: #570101; }
  .boton-grande-modal:disabled { opacity: 0.6; cursor: not-allowed; }
  .acciones-modal { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 0.8rem; }
  .boton-pill { border-radius: 999px; padding: 9px 18px; font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: inherit; }
  .boton-pill.primario { background: #570101; color: #fff; border: 1px solid #570101; }
  .boton-pill.primario:hover { background: #3b1e0d; }
  .boton-pill.secundario { background: #fff; color: #1a1a1a; border: 1px solid #570101; }
  .boton-pill.secundario:hover { background: #f6eeee; }
  .boton-pill.peligro { background: #b3261e; color: #fff; border: 1px solid #b3261e; }
  .boton-pill.peligro:hover { background: #8f1d17; }
  .boton-pill:disabled { opacity: 0.6; cursor: not-allowed; }

  .aviso-modo-local {
    max-width: 1220px;
    margin: 0.9rem auto 0;
    padding: 0 2rem;
    font-size: 0.72rem;
    color: #6b5300;
  }
  .aviso-modo-local span {
    display: inline-block;
    background: #fff8e1;
    border: 1px solid #ffe08a;
    border-radius: 999px;
    padding: 4px 12px;
  }
  @media (max-width: 860px) { .aviso-modo-local { padding: 0 1rem; } }
  @media (max-width: 520px) {
    .tarjeta-modal-problema { padding: 1.3rem 1rem 1.2rem; }
    .fila-modal { flex-direction: column; gap: 0; }
  }
`;

export const Iconos = {
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
  precio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7.5 9.5 10.5 12 11s5 1.5 5 4-2.2 3.5-5 3.5-5-.9-5-2.5" />
    </svg>
  ),
  sobre: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  ),
  usuario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  lupa: (
    <svg className="lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  candado: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
};

export function ChipEstado({ estado, tipo = "problema" }) {
  const datos = (tipo === "presupuesto" ? ESTADOS_PRESUPUESTO : ESTADOS_PROBLEMA)[estado];
  if (!datos) return null;
  return <span className={`chip-estado ${datos.tono}`}>{datos.etiqueta}</span>;
}

export function ChipUrgencia({ urgencia }) {
  const datos = URGENCIAS[urgencia];
  if (!datos) return null;
  return <span className={`chip-urgencia ${urgencia}`}>{datos.etiqueta}</span>;
}

// Primera foto del problema, o el ícono de la categoría si no tiene fotos
export function ImagenProblema({ problema, chica = false }) {
  const [fallo, setFallo] = useState(false);
  const foto = problema.fotos?.[0];
  const icono = ICONOS_CATEGORIAS[problema.categoria];
  return (
    <div className={`imagen-problema ${chica ? "chica" : ""}`}>
      {foto && !fallo ? (
        <img src={foto} alt={problema.titulo} onError={() => setFallo(true)} />
      ) : icono ? (
        <span className="icono-cat" style={{ "--icono": `url("${icono}")` }} />
      ) : (
        Iconos.herramienta
      )}
    </div>
  );
}

export function GaleriaFotos({ fotos = [] }) {
  const [abierta, setAbierta] = useState(null);
  useEffect(() => {
    if (abierta === null) return;
    // En fase de captura y frenando la propagación: Escape cierra solo la foto,
    // no la ventana del problema que está abajo.
    const manejar = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierta(null);
      }
      if (e.key === "ArrowRight") setAbierta((i) => (i + 1) % fotos.length);
      if (e.key === "ArrowLeft") setAbierta((i) => (i - 1 + fotos.length) % fotos.length);
    };
    document.addEventListener("keydown", manejar, true);
    return () => document.removeEventListener("keydown", manejar, true);
  }, [abierta, fotos.length]);
  if (fotos.length === 0) return null;
  return (
    <>
      <div className="galeria-fotos">
        {fotos.map((f, i) => (
          <button type="button" key={i} onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}`}>
            <img src={f} alt={`Foto ${i + 1} del problema`} />
          </button>
        ))}
      </div>
      {abierta !== null && (
        <div className="visor-foto" onClick={() => setAbierta(null)} role="dialog" aria-label="Foto ampliada">
          <img src={fotos[abierta]} alt={`Foto ${abierta + 1}`} />
          {fotos.length > 1 && (
            <>
              <button
                className="navegar-foto anterior"
                onClick={(e) => { e.stopPropagation(); setAbierta((abierta - 1 + fotos.length) % fotos.length); }}
                aria-label="Foto anterior"
              >‹</button>
              <button
                className="navegar-foto siguiente"
                onClick={(e) => { e.stopPropagation(); setAbierta((abierta + 1) % fotos.length); }}
                aria-label="Foto siguiente"
              >›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

const DIAS_HEADER = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Calendario con la estética del de "Agendar".
 *  - modo "rango": se elige inicio y fin (onCambio({ inicio, fin }))
 *  - modo "unico": se elige un día de `habilitadas` (onCambio(fecha))
 * `marcar(fecha)` permite apagar visualmente días dentro del rango (ej: días de la semana no elegidos).
 */
export function Calendario({ modo = "rango", inicio, fin, valor, habilitadas, onCambio, marcar }) {
  const hoy = hoyStr();
  const primeraFecha = modo === "unico" ? habilitadas?.[0] || hoy : inicio || hoy;
  const [mes, setMes] = useState(() => {
    const [y, m] = primeraFecha.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const conjuntoHabilitadas = useMemo(() => (habilitadas ? new Set(habilitadas) : null), [habilitadas]);

  const celdas = useMemo(() => {
    const anio = mes.getFullYear();
    const m = mes.getMonth();
    const primerDia = (new Date(anio, m, 1).getDay() + 6) % 7; // lunes primero
    const total = new Date(anio, m + 1, 0).getDate();
    const lista = [];
    for (let i = 0; i < primerDia; i++) lista.push(null);
    for (let d = 1; d <= total; d++) lista.push(aFechaStr(new Date(anio, m, d)));
    return lista;
  }, [mes]);

  const mesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const puedeIrAtras = mes > mesActual;
  const nombreMes = mes.toLocaleDateString("es-AR", { month: "long", year: mes.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });

  const clickDia = (fecha) => {
    if (modo === "unico") {
      onCambio(fecha);
      return;
    }
    if (!inicio || fin || fecha < inicio) onCambio({ inicio: fecha, fin: "" });
    else onCambio({ inicio, fin: fecha });
  };

  return (
    <div>
      <div className="cal-nav">
        <button type="button" className="cal-boton-mes" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} disabled={!puedeIrAtras} aria-label="Mes anterior">‹</button>
        <span className="cal-mes">{nombreMes}</span>
        <button type="button" className="cal-boton-mes" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Mes siguiente">›</button>
      </div>
      <div className="cal-semana">{DIAS_HEADER.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal-contenedor">
        <div className="cal-grilla">
          {celdas.map((fecha, i) => {
            if (!fecha) return <span className="cal-celda" key={`v${i}`} />;
            const pasada = fecha < hoy;
            const deshabilitada = pasada || (conjuntoHabilitadas && !conjuntoHabilitadas.has(fecha));
            const esPunta = modo === "rango" ? fecha === inicio || fecha === fin : fecha === valor;
            const hayRango = modo === "rango" && inicio && fin && inicio !== fin;
            const enRango = modo === "rango" && inicio && fin && fecha > inicio && fecha < fin;
            const apagado = modo === "rango" && (enRango || esPunta) && marcar && !marcar(fecha);
            const clasesCelda = [
              "cal-celda",
              enRango ? "en-rango" : "",
              hayRango && fecha === inicio ? "inicio-rango" : "",
              hayRango && fecha === fin ? "fin-rango" : "",
            ].filter(Boolean).join(" ");
            const clases = [
              "cal-dia",
              fecha === hoy ? "hoy" : "",
              enRango ? "en-rango" : "",
              esPunta ? "elegido" : "",
              apagado ? "apagado" : "",
            ].filter(Boolean).join(" ");
            return (
              <span className={clasesCelda} key={fecha}>
                <button
                  type="button"
                  className={clases}
                  disabled={deshabilitada}
                  onClick={() => clickDia(fecha)}
                  aria-label={fecha}
                  aria-pressed={esPunta}
                >
                  {Number(fecha.slice(-2))}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de un problema, con la misma estructura que la tarjeta de trabajador
 * de la búsqueda (clases de estilosTarjetas.js).
 *  - mostrarEstado: muestra el estado (para "Mis problemas") en vez de la urgencia
 *  - extra: contenido opcional antes de los botones
 */
export function TarjetaProblema({ problema, acciones, mostrarEstado = false, extra = null }) {
  const franja = FRANJAS[problema.franja];
  const estimado = formatearPesos(problema.presupuestoEstimado);
  const minimo = formatearPesos(problema.presupuestoMinimo);
  const cantidad = problema.cantidadPresupuestos || 0;
  return (
    <div className="tarjeta-trabajador tarjeta-problema">
      <div className="cabecera-tarjeta">
        <ImagenProblema problema={problema} />
        <div className="identidad-trabajador">
          <span className="nombre-trabajador" title={problema.titulo}>{problema.titulo || "Tu problema"}</span>
          <div className="fila-calificacion">
            {mostrarEstado ? <ChipEstado estado={estadoVisible(problema)} /> : <ChipUrgencia urgencia={problema.urgencia} />}
          </div>
          <div className="subtexto-calificacion">
            {problema.categoria || "Sin categoría"}
            {problema.creado ? ` · ${tiempoRelativo(problema.creado)}` : ""}
          </div>
        </div>
      </div>

      <ul className="lista-meta-tarjeta">
        {problema.descripcion && (
          <li className="item-meta-tarjeta" title={problema.descripcion}>
            {Iconos.herramienta}
            <span className="texto-recortado">{problema.descripcion}</span>
          </li>
        )}
        <li className="item-meta-tarjeta">
          {Iconos.ubicacion}
          {[problema.barrio, problema.localidad].filter(Boolean).join(", ") || "Zona sin definir"}
        </li>
        <li className="item-meta-tarjeta">
          {Iconos.calendario}
          {problema.periodo?.[0] ? `${textoPeriodo(problema.periodo)} · ${textoDiasSemana(problema.diassemana)}` : "Fechas sin definir"}
        </li>
        {franja && (
          <li className="item-meta-tarjeta">{Iconos.reloj}{franja.etiqueta} ({franja.detalle})</li>
        )}
        <li className="item-meta-tarjeta">
          {Iconos.precio}
          {estimado ? `Presupuesto estimado: hasta ${estimado}` : "Presupuesto a definir"}
        </li>
        <li className="item-meta-tarjeta">
          {Iconos.sobre}
          {cantidad === 0
            ? "Todavía sin presupuestos"
            : `${cantidad} ${cantidad === 1 ? "presupuesto" : "presupuestos"}${minimo ? ` · desde ${minimo}` : ""}`}
        </li>
      </ul>

      {extra}
      {acciones && <div className="acciones-tarjeta">{acciones}</div>}
    </div>
  );
}

// Cierra con Escape
export function useEscape(alPresionar) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") alPresionar?.();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [alPresionar]);
}
