import { useEffect, useId, useMemo, useRef, useState } from "react";
import { REGIONES, barriosDe, buscarLugares, provinciaDe, textoLugar } from "../zonas";

const estilos = `
  .selector-zona { position: relative; min-width: 0; }
  .selector-zona-boton {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    text-align: left; cursor: pointer; font-family: inherit; min-width: 0;
    background-image: none !important; /* la flechita la pone el componente */
  }
  .selector-zona-boton:disabled { cursor: not-allowed; opacity: 0.6; }
  .selector-zona-boton .texto-selector-zona { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .selector-zona-boton .texto-selector-zona.vacio { opacity: 0.75; }
  .selector-zona-boton svg { width: 9px; height: 9px; flex-shrink: 0; transition: transform 0.15s; }
  .selector-zona-boton[aria-expanded="true"] svg { transform: rotate(180deg); }

  .panel-selector-zona {
    position: absolute; top: calc(100% + 6px); left: 0; z-index: 120;
    width: max(100%, 280px); max-width: calc(100vw - 24px);
    background: #fff; border: 1px solid #e2e2df; border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.16); overflow: hidden;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    animation: aparecer-selector-zona 0.12s ease-out;
  }
  .panel-selector-zona.derecha { left: auto; right: 0; }
  @keyframes aparecer-selector-zona { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .buscador-selector-zona { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #efefed; }
  .buscador-selector-zona svg { width: 15px; height: 15px; color: #777; flex-shrink: 0; }
  .buscador-selector-zona input {
    flex: 1; border: none; outline: none; font-size: 0.85rem; color: #222; font-family: inherit; min-width: 0; background: none;
  }
  .lista-selector-zona { max-height: 300px; overflow-y: auto; padding: 6px; list-style: none; margin: 0; }
  .opcion-selector-zona {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;
    padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; color: #222; text-align: left;
  }
  .opcion-selector-zona.activa { background: #f4eeee; }
  .opcion-selector-zona.elegida { font-weight: 700; color: #570101; }
  .opcion-selector-zona .detalle-opcion-zona { font-size: 0.7rem; color: #888; font-weight: 400; white-space: nowrap; }
  .opcion-selector-zona .ver-barrios {
    border: none; background: #f4eeee; color: #570101; border-radius: 999px; font-size: 0.68rem; font-weight: 700;
    padding: 3px 9px; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .opcion-selector-zona .ver-barrios:hover { background: #ead9d9; }
  .titulo-lista-zona { font-size: 0.66rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 10px 4px; }
  .volver-selector-zona { color: #570101; font-weight: 600; }
  .vacio-selector-zona { padding: 14px 10px; font-size: 0.8rem; color: #888; text-align: center; }
`;

function IconoLupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

/**
 * Selector de zona (y barrio) con buscador. Es el mismo en todo el sitio.
 *  - valor: { zona, barrio }   ·   onCambio({ zona, barrio })
 *  - conBarrio: si se puede elegir un barrio dentro de la zona
 *  - textoTodas: si viene, agrega la opción "Todas las zonas" (no filtrar) y es lo que muestra el botón sin zona
 *  - claseBoton: clase del botón (para que tome el estilo de cada pantalla)
 *  - alinearDerecha: abre el panel hacia la izquierda (para botones a la derecha)
 */
export default function SelectorZona({
  valor = { zona: "", barrio: "" },
  onCambio,
  conBarrio = true,
  textoTodas = "",
  placeholder = "Elegí tu zona",
  claseBoton = "",
  id,
  ariaLabel = "Zona",
  alinearDerecha = false,
  deshabilitado = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [zonaAbierta, setZonaAbierta] = useState("");
  const [activa, setActiva] = useState(0);
  const contenedor = useRef(null);
  const campoBusqueda = useRef(null);
  const idLista = useId();

  // Opciones visibles según lo escrito o la zona que se abrió
  const opciones = useMemo(() => {
    const lista = [];
    const q = consulta.trim();
    if (q) {
      for (const o of buscarLugares(q, { conBarrios: conBarrio })) lista.push({ tipo: "lugar", ...o });
      return lista;
    }
    if (zonaAbierta) {
      lista.push({ tipo: "volver" });
      lista.push({ tipo: "lugar", zona: zonaAbierta, barrio: "" });
      for (const b of barriosDe(zonaAbierta)) lista.push({ tipo: "lugar", zona: zonaAbierta, barrio: b });
      return lista;
    }
    if (textoTodas) lista.push({ tipo: "todas" });
    for (const r of REGIONES) lista.push({ tipo: "lugar", zona: r.id, barrio: "", expandible: conBarrio });
    return lista;
  }, [consulta, zonaAbierta, conBarrio, textoTodas]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarAfuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarAfuera);
    return () => document.removeEventListener("mousedown", cerrarAfuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) campoBusqueda.current?.focus();
  }, [abierto, zonaAbierta]);

  const abrir = () => {
    if (deshabilitado) return;
    setConsulta("");
    setZonaAbierta(conBarrio && valor.barrio ? valor.zona : "");
    setActiva(0);
    setAbierto(true);
  };

  const elegir = (opcion) => {
    if (opcion.tipo === "volver") {
      setZonaAbierta("");
      setActiva(0);
      return;
    }
    if (opcion.tipo === "todas") onCambio({ zona: "", barrio: "" });
    else onCambio({ zona: opcion.zona, barrio: conBarrio ? opcion.barrio : "" });
    setAbierto(false);
  };

  const manejarTecla = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => Math.min(i + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (opciones[activa]) elegir(opciones[activa]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setAbierto(false);
    } else if (e.key === "ArrowRight" && opciones[activa]?.expandible) {
      setZonaAbierta(opciones[activa].zona);
      setActiva(1);
    }
  };

  const etiqueta = valor.zona ? textoLugar(valor.zona, conBarrio ? valor.barrio : "") : "";

  return (
    <div className="selector-zona" ref={contenedor}>
      <style>{estilos}</style>
      <button
        type="button"
        id={id}
        className={`selector-zona-boton ${claseBoton}`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta ? `${ariaLabel}: ${etiqueta}` : ariaLabel}
        title={etiqueta || placeholder}
        disabled={deshabilitado}
      >
        <span className={`texto-selector-zona ${etiqueta ? "" : "vacio"}`}>{etiqueta || (textoTodas && !valor.zona ? textoTodas : placeholder)}</span>
        <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M0 2.5h10L5 8.5z" /></svg>
      </button>

      {abierto && (
        <div className={`panel-selector-zona ${alinearDerecha ? "derecha" : ""}`}>
          <div className="buscador-selector-zona">
            <IconoLupa />
            <input
              ref={campoBusqueda}
              type="text"
              value={consulta}
              onChange={(e) => {
                setConsulta(e.target.value);
                setActiva(0);
              }}
              onKeyDown={manejarTecla}
              placeholder={conBarrio ? "Buscá tu barrio o localidad..." : "Buscá tu zona..."}
              aria-label={conBarrio ? "Buscar barrio o zona" : "Buscar zona"}
              aria-controls={idLista}
              aria-activedescendant={opciones[activa] ? `${idLista}-${activa}` : undefined}
              role="combobox"
              aria-expanded="true"
            />
          </div>
          {!consulta.trim() && zonaAbierta && <p className="titulo-lista-zona">Barrios y localidades de {zonaAbierta}</p>}
          {opciones.length === 0 ? (
            <p className="vacio-selector-zona">No encontramos "{consulta}". Probá con otro nombre.</p>
          ) : (
            <ul className="lista-selector-zona" role="listbox" id={idLista}>
              {opciones.map((o, i) => {
                const elegida = o.tipo === "lugar" && o.zona === valor.zona && (o.barrio || "") === (conBarrio ? valor.barrio || "" : "");
                const clases = `opcion-selector-zona ${i === activa ? "activa" : ""} ${elegida || (o.tipo === "todas" && !valor.zona) ? "elegida" : ""}`;
                return (
                  <li
                    key={o.tipo === "lugar" ? `${o.zona}|${o.barrio}` : o.tipo}
                    id={`${idLista}-${i}`}
                    role="option"
                    aria-selected={elegida}
                    className={clases}
                    onMouseEnter={() => setActiva(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => elegir(o)}
                  >
                    {o.tipo === "volver" && <span className="volver-selector-zona">‹ Ver otras zonas</span>}
                    {o.tipo === "todas" && <span className="todas-selector-zona">Todas las zonas</span>}
                    {o.tipo === "lugar" && (
                      <>
                        <span>
                          {o.barrio ? o.barrio : zonaAbierta && !consulta.trim() ? `Toda ${o.zona}` : o.zona}
                        </span>
                        {o.barrio ? (
                          <span className="detalle-opcion-zona">{o.zona}</span>
                        ) : o.expandible ? (
                          <button
                            type="button"
                            className="ver-barrios"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZonaAbierta(o.zona);
                              setActiva(1);
                            }}
                          >
                            Barrios ›
                          </button>
                        ) : (
                          <span className="detalle-opcion-zona">{o.via ? `incluye ${o.via}` : provinciaDe(o.zona)}</span>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
