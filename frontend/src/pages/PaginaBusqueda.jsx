import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-busqueda {
    min-height: 100vh;
    background: #f5f5f3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .barra-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    height: 56px;
    background: #e8e8e6;
    border-bottom: 1px solid #d4d4d0;
  }
  .logotipo {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1a1a1a;
    cursor: pointer;
    user-select: none;
  }
  .nav-derecha { display: flex; align-items: center; gap: 0.25rem; }
  .enlace-nav {
    background: none;
    border: none;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    color: #333;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .enlace-nav:hover { background: #d6d6d3; }
  .icono-usuario { background: none; border: none; cursor: pointer; padding: 0; margin-left: 0.5rem; }
  .icono-usuario img { width: 32px; height: 32px; opacity: 0.65; transition: opacity 0.15s; }
  .icono-usuario:hover img { opacity: 1; }

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

  .lista-tarjetas { display: flex; flex-direction: column; gap: 12px; }

  .tarjeta-trabajador {
    display: flex;
    gap: 14px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 16px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .tarjeta-trabajador:hover {
    border-color: #bbb;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .avatar-trabajador {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #e8e8e6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    flex-shrink: 0;
  }
  .info-trabajador { flex: 1; min-width: 0; }
  .fila-encabezado-trabajador {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .nombre-trabajador { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  .precio-trabajador { font-size: 0.9rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; }
  .precio-trabajador span { font-size: 0.72rem; font-weight: 500; color: #777; }
  .categoria-trabajador {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 600;
    color: #555;
    background: #efefed;
    border-radius: 5px;
    padding: 2px 7px;
    margin: 4px 0 6px;
  }
  .fila-meta-trabajador {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.78rem;
    color: #666;
    margin-bottom: 6px;
  }
  .calificacion-trabajador { display: flex; align-items: center; gap: 4px; color: #b8860b; font-weight: 600; }
  .calificacion-trabajador svg { width: 13px; height: 13px; }
  .zona-trabajador { display: flex; align-items: center; gap: 4px; }
  .descripcion-trabajador { font-size: 0.82rem; color: #555; line-height: 1.4; }
  .acciones-tarjeta { display: flex; gap: 8px; margin-top: 10px; }
  .boton-ver-perfil, .boton-contactar {
    font-size: 0.78rem;
    font-weight: 600;
    border-radius: 7px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .boton-ver-perfil { background: #fff; border: 1px solid #ccc; color: #333; }
  .boton-ver-perfil:hover { background: #f0f0ee; }
  .boton-contactar { background: #555; border: 1px solid #555; color: #fff; }
  .boton-contactar:hover { background: #333; }

  .sin-resultados {
    text-align: center;
    padding: 3rem 1rem;
    color: #777;
    font-size: 0.9rem;
  }

  @media (max-width: 800px) {
    .layout-resultados { flex-direction: column; }
    .panel-filtros { width: 100%; position: static; }
    .barra-busqueda-superior { flex-wrap: wrap; }
  }
`;

// --- Datos de trabajadores cargados a mano (mock, sin backend) ---
const trabajadores = [
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

const zonasDisponibles = [...new Set(trabajadores.map((t) => t.zona))].sort();

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

  // Filtro busqueda con useMemo para optimizar el rendimiento
    const resultados = useMemo(() => {
    return trabajadores.filter((t) => {
      const textoCoincide =
        !consulta.trim() ||
        t.nombre.toLowerCase().includes(consulta.toLowerCase()) ||
        t.etiquetaCategoria.toLowerCase().includes(consulta.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(consulta.toLowerCase());

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
  }, [consulta, filtroCategoria, filtroZona, precioMin, precioMax, filtroCalificacion]);

  return (
    <>
      <style>{estilos}</style>

      <div className="pagina-busqueda">
        <header className="barra-nav">
          <div className="logotipo" onClick={() => navegar("/")}>laburAR</div>
          <nav className="nav-derecha">
            <button className="enlace-nav" onClick={() => navegar("/paso1")}>
              Registrarme como trabajador
            </button>
            <button className="enlace-nav" onClick={() => navegar("/mensajes")}>
              Bandeja de entrada
            </button>
            <button className="icono-usuario" onClick={() => navegar("/login")} aria-label="Iniciar sesión">
              <img src="https://cdn-icons-png.flaticon.com/128/310/310869.png" alt="Iniciar sesión" />
            </button>
          </nav>
        </header>

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
                    <div className="avatar-trabajador">{t.avatar}</div>
                    <div className="info-trabajador">
                      <div className="fila-encabezado-trabajador">
                        <span className="nombre-trabajador">{t.nombre}</span>
                        <span className="precio-trabajador">
                          ${t.precio.toLocaleString("es-AR")} <span>/ trabajo</span>
                        </span>
                      </div>
                      <span className="categoria-trabajador">{t.etiquetaCategoria}</span>
                      <div className="fila-meta-trabajador">
                        <span className="calificacion-trabajador">
                          <Estrella /> {t.calificacion.toFixed(1)} ({t.reseñas})
                        </span>
                        <span className="zona-trabajador">📍 {t.zona}</span>
                      </div>
                      <p className="descripcion-trabajador">{t.descripcion}</p>
                      <div className="acciones-tarjeta">
                        <button className="boton-ver-perfil" onClick={() => navegar(`/trabajador/${t.id}`)}>
                          Ver perfil
                        </button>
                        <button className="boton-contactar" onClick={() => navegar("/mensajes")}>
                          Contactar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PaginaBusqueda;
