import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { ZONAS } from "../constantes";
import { agregarAlHistorial, obtenerHistorial } from "../sesion";
import iconoCarpinteria from "../assets/categorias/carpinteria.svg";
import iconoJardineria from "../assets/categorias/jardineria.svg";
import iconoMudanza from "../assets/categorias/mudanza.svg";
import iconoElectricidad from "../assets/categorias/electricidad.svg";
import iconoPintura from "../assets/categorias/pintura.svg";
import iconoPiletero from "../assets/categorias/piletero.svg";
import iconoAlbanileria from "../assets/categorias/albanileria.svg";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-inicio {
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    margin: 0;
  }

  .hero-inicio {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4.5rem 1.5rem 4rem;
  }
  .eslogan-inicio {
    font-size: clamp(1.6rem, 4vw, 2.6rem);
    font-weight: 900;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: #111;
    margin: 0 0 2.25rem;
    text-align: center;
  }

  /* --- buscador --- */
  .contenedor-busqueda { width: 100%; max-width: 760px; }
  .barra-busqueda {
    display: flex;
    align-items: center;
    background: #c9c9c9;
    border-radius: 999px;
    padding: 0 5px 0 8px;
    height: 54px;
    gap: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transition: box-shadow 0.15s;
  }
  .barra-busqueda:focus-within { box-shadow: 0 0 0 3px rgba(87,1,1,0.18), 0 4px 16px rgba(0,0,0,0.08); }
  .boton-lupa {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: none;
    border: none;
    cursor: pointer;
    color: #222;
    flex-shrink: 0;
  }
  .boton-lupa:hover { background: rgba(255,255,255,0.4); }
  .boton-lupa svg { width: 18px; height: 18px; }
  .campo-busqueda {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.92rem;
    color: #222;
    min-width: 0;
    font-family: inherit;
  }
  .campo-busqueda::placeholder { color: #333; }

  .contenedor-barrio { position: relative; flex-shrink: 0; }
  .boton-barrio {
    height: 44px;
    min-width: 128px;
    max-width: 190px;
    padding: 0 1.3rem;
    border-radius: 999px;
    border: none;
    background: #570101;
    color: #fff;
    font-size: 0.86rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.15s;
    font-family: inherit;
  }
  .boton-barrio:hover { background: #3b1e0d; }
  .boton-barrio span { overflow: hidden; text-overflow: ellipsis; }
  .boton-barrio svg { width: 9px; height: 9px; flex-shrink: 0; }
  .menu-barrio {
    position: absolute;
    top: 52px;
    right: 0;
    width: 220px;
    max-height: 300px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.14);
    padding: 6px;
    z-index: 20;
  }
  .opcion-barrio {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 8px 10px;
    font-size: 0.82rem;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
  }
  .opcion-barrio:hover { background: #f4eeee; }
  .opcion-barrio.activa { background: #570101; color: #fff; font-weight: 600; }

  /* --- historial --- */
  .seccion-recientes {
    margin-top: 2rem;
    width: 100%;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .etiqueta-recientes {
    font-size: 0.88rem;
    font-weight: 500;
    color: #222;
    margin: 0 0 0.9rem;
  }
  .tarjetas-recientes {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .tarjeta-reciente {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 6px;
    padding: 14px 16px;
    width: 220px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }
  .tarjeta-reciente:hover { border-color: #570101; box-shadow: 0 6px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .icono-tarjeta {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    background: #570101;
    -webkit-mask: var(--icono) center / contain no-repeat;
    mask: var(--icono) center / contain no-repeat;
  }
  .icono-tarjeta.generico { -webkit-mask: none; mask: none; background: none; color: #570101; }
  .icono-tarjeta.generico svg { width: 30px; height: 30px; }
  .texto-tarjeta { min-width: 0; }
  .titulo-tarjeta {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ubicacion-tarjeta { font-size: 0.72rem; color: #666; margin-top: 2px; }

  /* --- categorías --- */
  .seccion-categorias {
    margin-top: 3.5rem;
    width: 100%;
    max-width: 960px;
  }
  .grilla-categorias {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .boton-categoria {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    border-radius: 12px;
    padding: 14px 10px;
    cursor: pointer;
    min-width: 104px;
    font-family: inherit;
    transition: background 0.15s, transform 0.1s;
  }
  .boton-categoria:hover { background: rgba(87,1,1,0.07); }
  .boton-categoria:active { transform: scale(0.97); }
  .icono-categoria {
    width: 48px;
    height: 48px;
    background: #3b1e0d;
    -webkit-mask: var(--icono) center / contain no-repeat;
    mask: var(--icono) center / contain no-repeat;
    transition: background 0.15s;
  }
  .boton-categoria:hover .icono-categoria { background: #570101; }
  .etiqueta-categoria {
    font-size: 0.78rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .hero-inicio { padding-top: 2.5rem; }
    .barra-busqueda { height: 50px; }
    .boton-barrio { min-width: 0; padding: 0 0.9rem; font-size: 0.78rem; max-width: 120px; }
    .campo-busqueda { font-size: 0.82rem; }
    .tarjeta-reciente { width: 100%; }
    .grilla-categorias { justify-content: center; }
    .boton-categoria { min-width: 90px; }
  }
`;

// "aptitud" tiene que coincidir con el nombre de la categoría que el
// trabajador elige en "Ofrecer servicios" (así filtramos por esa aptitud).
const categorias = [
  { aptitud: "Carpintería", etiqueta: "Carpintería", icono: iconoCarpinteria },
  { aptitud: "Jardinería", etiqueta: "Jardinería", icono: iconoJardineria },
  { aptitud: "Mudanza", etiqueta: "Mudanza", icono: iconoMudanza },
  { aptitud: "Electricidad", etiqueta: "Electricista", icono: iconoElectricidad },
  { aptitud: "Pintura", etiqueta: "Pintor/a", icono: iconoPintura },
  { aptitud: "Piletero", etiqueta: "Piletero", icono: iconoPiletero },
  { aptitud: "Albañilería", etiqueta: "Albañilería", icono: iconoAlbanileria },
];

function iconoDeCategoria(categoria) {
  return categorias.find((c) => c.aptitud === categoria)?.icono || null;
}

function IconoLupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function IconoCasa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" />
    </svg>
  );
}

function armarRutaBusqueda({ consulta, zona, categoria }) {
  const params = new URLSearchParams();
  if (consulta) params.set("q", consulta);
  if (zona) params.set("zona", zona);
  if (categoria) params.set("categoria", categoria);
  const query = params.toString();
  return query ? `/buscar?${query}` : "/buscar";
}

function PaginaInicio() {
  const navegar = useNavigate();
  const [consulta, setConsulta] = useState("");
  const [barrio, setBarrio] = useState("");
  const [menuBarrioAbierto, setMenuBarrioAbierto] = useState(false);
  const [historial, setHistorial] = useState(() => obtenerHistorial());
  const referenciaBarrio = useRef(null);

  useEffect(() => {
    const actualizar = () => setHistorial(obtenerHistorial());
    window.addEventListener("laburar-historial-cambio", actualizar);
    return () => window.removeEventListener("laburar-historial-cambio", actualizar);
  }, []);

  const cerrarMenuBarrio = useCallback((e) => {
    if (referenciaBarrio.current && !referenciaBarrio.current.contains(e.target)) {
      setMenuBarrioAbierto(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener("mousedown", cerrarMenuBarrio);
    return () => document.removeEventListener("mousedown", cerrarMenuBarrio);
  }, [cerrarMenuBarrio]);

  const manejarBusqueda = () => {
    const texto = consulta.trim();
    if (texto) {
      agregarAlHistorial({ tipo: "busqueda", titulo: texto, consulta: texto, zona: barrio });
    }
    navegar(armarRutaBusqueda({ consulta: texto, zona: barrio }));
  };

  const manejarTecla = (e) => {
    if (e.key === "Enter") manejarBusqueda();
  };

  const elegirBarrio = (zona) => {
    setBarrio(zona);
    setMenuBarrioAbierto(false);
  };

  const manejarCategoria = (cat) => {
    agregarAlHistorial({ tipo: "busqueda", titulo: cat.aptitud, categoria: cat.aptitud, zona: barrio });
    navegar(armarRutaBusqueda({ categoria: cat.aptitud, zona: barrio }));
  };

  const retomar = (h) => {
    navegar(armarRutaBusqueda({ consulta: h.consulta, zona: h.zona, categoria: h.categoria }));
  };

  return (
    <>
      <style>{estilos}</style>

      <div className="pagina-inicio">
        <BarraNav />

        <main className="hero-inicio">
          <h1 className="eslogan-inicio">LaburAR te ayuda a conectar</h1>

          <div className="contenedor-busqueda">
            <div className="barra-busqueda">
              <button className="boton-lupa" onClick={manejarBusqueda} aria-label="Buscar">
                <IconoLupa />
              </button>
              <input
                type="text"
                className="campo-busqueda"
                placeholder="Describí tu proyecto o problema; ¡sé tan detallado como quieras!"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                onKeyDown={manejarTecla}
              />
              <div className="contenedor-barrio" ref={referenciaBarrio}>
                <button
                  className="boton-barrio"
                  onClick={() => setMenuBarrioAbierto((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={menuBarrioAbierto}
                  title={barrio || "Elegí tu barrio o zona"}
                >
                  <span>{barrio || "BARRIO"}</span>
                  <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M0 2.5h10L5 8.5z" /></svg>
                </button>
                {menuBarrioAbierto && (
                  <div className="menu-barrio" role="listbox">
                    <button
                      className={`opcion-barrio ${barrio === "" ? "activa" : ""}`}
                      onClick={() => elegirBarrio("")}
                    >
                      Todas las zonas
                    </button>
                    {ZONAS.map((z) => (
                      <button
                        key={z}
                        className={`opcion-barrio ${barrio === z ? "activa" : ""}`}
                        onClick={() => elegirBarrio(z)}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {historial.length > 0 && (
            <section className="seccion-recientes">
              <p className="etiqueta-recientes">Retomá donde lo dejaste:</p>
              <div className="tarjetas-recientes">
                {historial.slice(0, 3).map((h) => {
                  const icono = iconoDeCategoria(h.categoria);
                  return (
                    <button className="tarjeta-reciente" key={`${h.titulo}-${h.zona}-${h.fecha}`} onClick={() => retomar(h)}>
                      {icono ? (
                        <span className="icono-tarjeta" style={{ "--icono": `url("${icono}")` }} />
                      ) : (
                        <span className="icono-tarjeta generico"><IconoCasa /></span>
                      )}
                      <span className="texto-tarjeta">
                        <span className="titulo-tarjeta" style={{ display: "block" }}>{h.titulo}</span>
                        <span className="ubicacion-tarjeta" style={{ display: "block" }}>
                          {h.tipo === "solicitud" ? "Solicitud enviada" : "Búsqueda"}
                          {h.zona ? ` · ${h.zona}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="seccion-categorias">
            <div className="grilla-categorias">
              {categorias.map((cat) => (
                <button
                  key={cat.aptitud}
                  className="boton-categoria"
                  onClick={() => manejarCategoria(cat)}
                >
                  <span className="icono-categoria" style={{ "--icono": `url("${cat.icono}")` }} />
                  <span className="etiqueta-categoria">{cat.etiqueta}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default PaginaInicio;
