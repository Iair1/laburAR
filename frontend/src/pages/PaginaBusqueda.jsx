import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { obtenerPublicaciones } from "../sesion";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-busqueda {
    min-height: 100vh;
    background: #f5f5f3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .barra-busqueda-superior {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 1.25rem 2rem;
    background: #efefed;
    border-bottom: 1px solid #d4d4d0;
  }
  .campo-busqueda-superior {
    flex: 1;
    max-width: 480px;
    display: flex;
    align-items: center;
    background: #ccc;
    border-radius: 999px;
    padding: 0 14px;
    height: 42px;
    gap: 8px;
  }
  .campo-busqueda-superior input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.85rem;
    color: #222;
    min-width: 0;
  }
  .campo-busqueda-superior input::placeholder { color: #666; }
  .campo-busqueda-superior svg { width: 16px; height: 16px; color: #555; flex-shrink: 0; }
  .campo-cp-superior {
    width: 100px;
    height: 42px;
    background: #ccc;
    border-radius: 999px;
    border: none;
    outline: none;
    text-align: center;
    font-size: 0.85rem;
    color: #222;
  }
  .campo-cp-superior::placeholder { color: #666; }
  .boton-buscar-superior {
    height: 42px;
    padding: 0 1.1rem;
    border-radius: 999px;
    border: none;
    background: #888;
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .boton-buscar-superior:hover { background: #666; }

  .layout-resultados {
    display: flex;
    align-items: flex-start;
    gap: 1.75rem;
    padding: 1.75rem 2rem 3rem;
    max-width: 1180px;
    margin: 0 auto;
  }

  .panel-filtros {
    width: 250px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 1.25rem;
    position: sticky;
    top: 1.25rem;
  }
  .titulo-filtros {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 1rem;
  }
  .grupo-filtro { margin-bottom: 1.4rem; }
  .grupo-filtro:last-child { margin-bottom: 0; }
  .etiqueta-filtro {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .fila-precio { display: flex; align-items: center; gap: 8px; }
  .fila-precio input[type="number"] {
    width: 100%;
    height: 34px;
    border: 1px solid #ddd;
    border-radius: 7px;
    padding: 0 8px;
    font-size: 0.82rem;
    outline: none;
  }
  .fila-precio input[type="number"]:focus { border-color: #999; }
  .guion-precio { color: #999; font-size: 0.8rem; }
  .select-filtro {
    width: 100%;
    height: 36px;
    border: 1px solid #ddd;
    border-radius: 7px;
    padding: 0 8px;
    font-size: 0.82rem;
    color: #222;
    background: #fff;
    outline: none;
  }
  .select-filtro:focus { border-color: #999; }
  .opciones-estrellas { display: flex; flex-direction: column; gap: 6px; }
  .opcion-estrella {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: #333;
    cursor: pointer;
  }
  .opcion-estrella input { accent-color: #555; cursor: pointer; }
  .boton-limpiar-filtros {
    margin-top: 1.4rem;
    width: 100%;
    height: 34px;
    border-radius: 7px;
    border: 1px solid #ddd;
    background: #f5f5f3;
    color: #444;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  .boton-limpiar-filtros:hover { background: #eaeae8; }

  .columna-resultados { flex: 1; min-width: 0; }
  .resumen-resultados {
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 1rem;
  }
  .resumen-resultados strong { color: #1a1a1a; }

  /* Grilla de tarjetas cuadradas, estilo marketplace */
  .lista-tarjetas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .tarjeta-trabajador {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }
  .tarjeta-trabajador:hover {
    border-color: #bbb;
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .imagen-trabajador {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: #eef0ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    overflow: hidden;
  }
  .imagen-trabajador img { width: 100%; height: 100%; object-fit: cover; }
  .insignia-verificado {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #1a2332;
    color: #fff;
    font-size: 0.62rem;
    font-weight: 700;
    padding: 3px 7px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .info-trabajador { flex: 1; min-width: 0; padding: 12px 14px 14px; display: flex; flex-direction: column; }
  .nombre-trabajador { font-size: 0.92rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .categoria-trabajador {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 600;
    color: #555;
    background: #efefed;
    border-radius: 5px;
    padding: 2px 7px;
    margin: 5px 0 6px;
    width: fit-content;
  }
  .fila-meta-trabajador {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.74rem;
    color: #666;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .calificacion-trabajador { display: flex; align-items: center; gap: 4px; color: #b8860b; font-weight: 600; }
  .calificacion-trabajador svg { width: 12px; height: 12px; }
  .zona-trabajador { display: flex; align-items: center; gap: 4px; }
  .precio-trabajador { font-size: 0.88rem; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
  .precio-trabajador span { font-size: 0.68rem; font-weight: 500; color: #777; }

  .acciones-tarjeta { display: flex; gap: 8px; margin-top: auto; }
  .boton-ver-perfil, .boton-agendar {
    flex: 1;
    font-size: 0.74rem;
    font-weight: 700;
    border-radius: 7px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background 0.15s;
    border: none;
    text-align: center;
  }
  .boton-ver-perfil { background: #fff; border: 1px solid #ccc; color: #333; }
  .boton-ver-perfil:hover { background: #f0f0ee; }
  .boton-agendar { background: #1a2332; color: #fff; }
  .boton-agendar:hover { background: #0f1621; }

  .sin-resultados {
    text-align: center;
    padding: 3rem 1rem;
    color: #777;
    font-size: 0.9rem;
  }

  .toast-agendar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a2332;
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    z-index: 100;
  }

  @media (max-width: 800px) {
    .layout-resultados { flex-direction: column; }
    .panel-filtros { width: 100%; position: static; }
    .barra-busqueda-superior { flex-wrap: wrap; }
    .lista-tarjetas { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  }
`;

// --- Datos de trabajadores cargados a mano (mock, sin backend) ---
const trabajadoresMock = [
  {
    id: 1,
    nombre: "Marcos Gimenez",
    categoria: "jardineria",
    etiquetaCategoria: "Jardinería",
    precio: 4500,
    zona: "San Isidro",
    calificacion: 4.8,
    reseñas: 32,
    avatar: "🌿",
    descripcion: "Mantenimiento de jardines, poda y diseño de espacios verdes. Más de 8 años de experiencia.",
  },
  {
    id: 2,
    nombre: "Laura Fernández",
    categoria: "pintura",
    etiquetaCategoria: "Pintura",
    precio: 6000,
    zona: "CABA",
    calificacion: 4.6,
    reseñas: 21,
    avatar: "🖌️",
    descripcion: "Pintura de interiores y exteriores. Presupuesto sin cargo y trabajo prolijo.",
  },
  {
    id: 3,
    nombre: "Diego Romero",
    categoria: "electricidad",
    etiquetaCategoria: "Electricidad",
    precio: 5200,
    zona: "Avellaneda",
    calificacion: 4.9,
    reseñas: 47,
    avatar: "⚡",
    descripcion: "Electricista matriculado. Instalaciones, urgencias y certificaciones.",
  },
  {
    id: 4,
    nombre: "Sofía Álvarez",
    categoria: "mudanza",
    etiquetaCategoria: "Mudanza",
    precio: 8000,
    zona: "Vicente López",
    calificacion: 4.3,
    reseñas: 14,
    avatar: "📦",
    descripcion: "Mudanzas chicas y grandes, embalaje incluido. Camión propio.",
  },
  {
    id: 5,
    nombre: "Pablo Acosta",
    categoria: "piletero",
    etiquetaCategoria: "Piletero",
    precio: 3800,
    zona: "Tigre",
    calificacion: 4.7,
    reseñas: 19,
    avatar: "🏊",
    descripcion: "Limpieza y mantenimiento de piletas. Tratamiento químico incluido.",
  },
  {
    id: 6,
    nombre: "Carla Medina",
    categoria: "jardineria",
    etiquetaCategoria: "Jardinería",
    precio: 4000,
    zona: "CABA",
    calificacion: 4.5,
    reseñas: 11,
    avatar: "🌿",
    descripcion: "Diseño de jardines verticales y mantenimiento mensual.",
  },
  {
    id: 7,
    nombre: "Ezequiel Torres",
    categoria: "electricidad",
    etiquetaCategoria: "Electricidad",
    precio: 4700,
    zona: "San Isidro",
    calificacion: 4.2,
    reseñas: 9,
    avatar: "⚡",
    descripcion: "Reparaciones eléctricas a domicilio, respuesta rápida.",
  },
  {
    id: 8,
    nombre: "Valentina Ruiz",
    categoria: "pintura",
    etiquetaCategoria: "Pintura",
    precio: 5500,
    zona: "Avellaneda",
    calificacion: 4.9,
    reseñas: 38,
    avatar: "🖌️",
    descripcion: "Especialista en terminaciones decorativas y revestimientos.",
  },
];

function Estrella() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.1l7.1-.6L12 2z" />
    </svg>
  );
}

function PaginaBusqueda() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();

  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  const [codigoPostal, setCodigoPostal] = useState(parametros.get("cp") || "");
  const categoriaInicial = parametros.get("categoria") || "";

  const [filtroCategoria, setFiltroCategoria] = useState(categoriaInicial);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroCalificacion, setFiltroCalificacion] = useState(0);
  const [toast, setToast] = useState("");

  // Publicaciones reales creadas desde "Ofrecer servicios" (localStorage)
  const [publicaciones, setPublicaciones] = useState(obtenerPublicaciones());
  useEffect(() => {
    const actualizar = () => setPublicaciones(obtenerPublicaciones());
    window.addEventListener("laburar-publicaciones-cambio", actualizar);
    return () => window.removeEventListener("laburar-publicaciones-cambio", actualizar);
  }, []);

  // Las publicaciones reales se muestran primero
  const trabajadores = useMemo(
    () => [...publicaciones, ...trabajadoresMock],
    [publicaciones]
  );

  const manejarTecla = (e) => {
    if (e.key === "Enter") e.target.blur();
  };

  const limpiarFiltros = () => {
    setFiltroCategoria("");
    setPrecioMin("");
    setPrecioMax("");
    setFiltroZona("");
    setFiltroCalificacion(0);
  };

  const manejarAgendar = (t) => {
    setToast(`Vas a poder agendar con ${t.nombre} muy pronto 🙌`);
    setTimeout(() => setToast(""), 2500);
  };

  const zonasDisponibles = useMemo(
    () => [...new Set(trabajadores.map((t) => t.zona))].sort(),
    [trabajadores]
  );

  const resultados = useMemo(() => {
    return trabajadores.filter((t) => {
      const textoCoincide =
        !consulta.trim() ||
        t.nombre.toLowerCase().includes(consulta.toLowerCase()) ||
        t.etiquetaCategoria.toLowerCase().includes(consulta.toLowerCase()) ||
        (t.descripcion || "").toLowerCase().includes(consulta.toLowerCase());

      const categoriaCoincide = !filtroCategoria || t.categoria === filtroCategoria;
      const zonaCoincide = !filtroZona || t.zona === filtroZona;
      const minCoincide = !precioMin || t.precio >= Number(precioMin);
      const maxCoincide = !precioMax || t.precio <= Number(precioMax);
      const calificacionCoincide = t.calificacion >= filtroCalificacion;

      return (
        textoCoincide &&
        categoriaCoincide &&
        zonaCoincide &&
        minCoincide &&
        maxCoincide &&
        calificacionCoincide
      );
    });
  }, [trabajadores, consulta, filtroCategoria, filtroZona, precioMin, precioMax, filtroCalificacion]);

  return (
    <>
      <style>{estilos}</style>

      <div className="pagina-busqueda">
        <BarraNav />

        <div className="barra-busqueda-superior">
          <div className="campo-busqueda-superior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar trabajador o servicio..."
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={manejarTecla}
            />
          </div>
          <input
            type="text"
            className="campo-cp-superior"
            placeholder="Cod. Postal"
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
            onKeyDown={manejarTecla}
            maxLength={8}
          />
          <button className="boton-buscar-superior" onClick={() => {}}>
            Buscar
          </button>
        </div>

        <div className="layout-resultados">
          <aside className="panel-filtros">
            <p className="titulo-filtros">Filtros</p>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Categoría</label>
              <select
                className="select-filtro"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="jardineria">Jardinería</option>
                <option value="mudanza">Mudanza</option>
                <option value="electricidad">Electricidad</option>
                <option value="pintura">Pintura</option>
                <option value="piletero">Piletero</option>
              </select>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Precio</label>
              <div className="fila-precio">
                <input
                  type="number"
                  placeholder="Mín"
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  min="0"
                />
                <span className="guion-precio">–</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Zona</label>
              <select
                className="select-filtro"
                value={filtroZona}
                onChange={(e) => setFiltroZona(e.target.value)}
              >
                <option value="">Todas las zonas</option>
                {zonasDisponibles.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Calificación mínima</label>
              <div className="opciones-estrellas">
                {[0, 3, 4, 4.5].map((valor) => (
                  <label key={valor} className="opcion-estrella">
                    <input
                      type="radio"
                      name="calificacion"
                      checked={filtroCalificacion === valor}
                      onChange={() => setFiltroCalificacion(valor)}
                    />
                    {valor === 0 ? "Cualquiera" : `${valor}+ estrellas`}
                  </label>
                ))}
              </div>
            </div>

            <button className="boton-limpiar-filtros" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </aside>

          <div className="columna-resultados">
            <p className="resumen-resultados">
              <strong>{resultados.length}</strong> trabajador{resultados.length === 1 ? "" : "es"} encontrado{resultados.length === 1 ? "" : "s"}
            </p>

            {resultados.length === 0 ? (
              <div className="sin-resultados">
                No encontramos trabajadores con esos filtros. Probá ajustarlos.
              </div>
            ) : (
              <div className="lista-tarjetas">
                {resultados.map((t) => (
                  <div className="tarjeta-trabajador" key={t.id}>
                    <div className="imagen-trabajador">
                      {t.fotoPerfilURL ? (
                        <img src={t.fotoPerfilURL} alt={t.nombre} />
                      ) : (
                        t.avatar
                      )}
                      {t.verificado && (
                        <span className="insignia-verificado">✓ Verificado</span>
                      )}
                    </div>
                    <div className="info-trabajador">
                      <span className="nombre-trabajador">{t.nombre}</span>
                      <span className="categoria-trabajador">{t.etiquetaCategoria}</span>
                      <div className="fila-meta-trabajador">
                        <span className="calificacion-trabajador">
                          <Estrella /> {t.reseñas > 0 ? t.calificacion.toFixed(1) : "Nuevo"} {t.reseñas > 0 && `(${t.reseñas})`}
                        </span>
                        <span className="zona-trabajador">📍 {t.zona}</span>
                      </div>
                      <div className="precio-trabajador">
                        ${t.precio.toLocaleString("es-AR")} <span>/ hora</span>
                      </div>
                      <div className="acciones-tarjeta">
                        <button className="boton-ver-perfil" onClick={() => navegar(`/trabajador/${t.id}`)}>
                          Ver perfil
                        </button>
                        <button className="boton-agendar" onClick={() => manejarAgendar(t)}>
                          Agendar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {toast && <div className="toast-agendar">{toast}</div>}
      </div>
    </>
  );
}

export default PaginaBusqueda;
