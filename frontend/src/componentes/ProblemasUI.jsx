import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import { ICONOS_CATEGORIAS } from "../iconosCategorias";
import {
  ESTADOS_PROBLEMA,
  URGENCIAS,
  FRANJAS,
  aFechaStr,
  hoyStr,
  fechaLarga,
  textoPeriodo,
  textoDiasSemana,
  estadoVisible,
} from "../problemasDatos";


const ICONOS = {
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
};

/** Ícono de línea (mismo trazo que los de la búsqueda): <Icono nombre="calendario" /> */
export function Icono({ nombre }) {
  return ICONOS[nombre] || null;
}

export function ChipEstado({ estado }) {
  const datos = ESTADOS_PROBLEMA[estado];
  if (!datos) return null;
  return <span className={`chip-estado ${datos.tono}`}>{datos.etiqueta}</span>;
}

export function ChipUrgencia({ urgencia }) {
  const datos = URGENCIAS[urgencia];
  if (!datos) return null;
  return <span className={`chip-urgencia ${urgencia}`}>{datos.etiqueta}</span>;
}

// Ícono de la categoría (o una herramienta si la categoría no tiene dibujo)
export function ImagenProblema({ problema, chica = false }) {
  const icono = ICONOS_CATEGORIAS[problema.categoria];
  return (
    <div className={`imagen-problema ${chica ? "chica" : ""}`}>
      {icono ? <span className="icono-cat" style={{ "--icono": `url("${icono}")` }} /> : ICONOS.herramienta}
    </div>
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
  const primeraFecha = modo === "unico" ? valor || habilitadas?.[0] || hoy : inicio || hoy;
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
  const nombreMes = mes.toLocaleDateString("es-AR", {
    month: "long",
    year: mes.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

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
 *  - vista "trabajador": muestra quién lo publicó y si coincide con sus servicios
 *  - vista "cliente": muestra el estado y, si hay cita, con quién y qué día
 *  - vista "cita": la cita que agendó el trabajador (día + cliente)
 *  - extra: contenido opcional antes de los botones
 */
export function TarjetaProblema({ problema, vista = "trabajador", acciones = null, extra = null }) {
  const franja = FRANJAS[problema.franja];
  const estado = estadoVisible(problema);
  const hayCita = problema.dia && (problema.estado === "pendiente" || problema.estado === "terminada");
  return (
    <div className="tarjeta-trabajador tarjeta-problema">
      <div className="cabecera-tarjeta">
        <ImagenProblema problema={problema} />
        <div className="identidad-trabajador">
          <span className="nombre-trabajador" title={problema.titulo}>{problema.titulo || "Problema"}</span>
          <div className="fila-calificacion">
            {vista === "trabajador" ? (
              <>
                <ChipUrgencia urgencia={problema.urgencia} />
                {problema.coincidencias > 0 && <span className="chip-coincide">Coincide con tus servicios</span>}
              </>
            ) : (
              <ChipEstado estado={vista === "cita" ? (estado === "terminada" ? "terminada" : "pendiente") : estado} />
            )}
          </div>
          <div className="subtexto-calificacion">{problema.categoria || "Sin categoría"}</div>
        </div>
      </div>

      {vista !== "cliente" && problema.cliente && (
        <div className={`persona-tarjeta ${vista === "cita" ? "cita" : ""}`}>
          <Avatar src={problema.cliente.foto} nombre={problema.cliente.nombre} tamano={24} />
          <span>
            {vista === "cita" ? "Cita con " : "Publicado por "}
            <strong>{problema.cliente.nombre}</strong>
          </span>
        </div>
      )}
      {vista === "cliente" && hayCita && problema.trabajador && (
        <div className="persona-tarjeta cita">
          <Avatar src={problema.trabajador.foto} nombre={problema.trabajador.nombre} tamano={24} />
          <span>
            Cita con <strong>{problema.trabajador.nombre}</strong>
          </span>
        </div>
      )}

      <ul className="lista-meta-tarjeta">
        {problema.descripcion && (
          <li className="item-meta-tarjeta" title={problema.descripcion}>
            {ICONOS.herramienta}
            <span className="texto-recortado">{problema.descripcion}</span>
          </li>
        )}
        <li className="item-meta-tarjeta">
          {ICONOS.ubicacion}
          {[problema.barrio, problema.localidad].filter(Boolean).join(", ") || "Zona sin definir"}
        </li>
        <li className="item-meta-tarjeta">
          {ICONOS.calendario}
          {hayCita
            ? <span><strong>{fechaLarga(problema.dia)}</strong>{problema.hora ? ` · ${problema.hora} hs` : ""}</span>
            : problema.periodo?.[0]
              ? `${textoPeriodo(problema.periodo)} · ${textoDiasSemana(problema.diassemana)}`
              : "Fechas sin definir"}
        </li>
        {franja && (
          <li className="item-meta-tarjeta">{ICONOS.reloj}{franja.etiqueta} ({franja.detalle})</li>
        )}
      </ul>

      {extra}
      {acciones && <div className="acciones-tarjeta">{acciones}</div>}
    </div>
  );
}

// Cierra con Escape
function useEscape(alPresionar) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") alPresionar?.();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [alPresionar]);
}

/** Ventana modal con el mismo marco que "Ver perfil" / "Agendar". */
export function Modal({ etiqueta, onCerrar, children, ancho }) {
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
