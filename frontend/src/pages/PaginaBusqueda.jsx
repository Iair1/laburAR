import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import AgendarModal from "../componentes/AgendarModal";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { buscarTrabajadores } from "../api";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-busqueda {
    min-height: 100vh;
    
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

    
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    margin: 0;
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
  .select-zona-superior {
    height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    border: none;
    background: #ccc;
    outline: none;
    text-align: center;
    font-size: 0.85rem;
    color: #222;
  }
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
  .boton-buscar-superior:disabled { opacity: 0.6; cursor: not-allowed; }

  .aviso-login-busqueda {
    max-width: 1180px;
    margin: 1.5rem auto 0;
    padding: 0 2rem;
  }
  .tarjeta-aviso-login {
    background: #fff3cd;
    border: 1px solid #ffe08a;
    border-radius: 10px;
    padding: 0.9rem 1.1rem;
    font-size: 0.85rem;
    color: #6b5300;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .boton-login-aviso {
    background: #1a2332;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 7px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

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

  .sin-resultados, .estado-carga, .estado-error {
    text-align: center;
    padding: 3rem 1rem;
    color: #777;
    font-size: 0.9rem;
  }
  .estado-error { color: #b23a1c; }

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

// Debe coincidir con las localidades que se guardan en la tabla "usuarios"
// (mismo listado que usa OfrecerServicios.jsx al registrar la zona).
const ZONAS = [
  "CABA", "GBA Norte", "GBA Sur", "GBA Oeste", "Córdoba Capital",
  "Rosario", "Mendoza Capital", "La Plata", "Mar del Plata", "Tucumán",
  "Salta Capital", "Santa Fe Capital", "Neuquén Capital", "Bahía Blanca",
];

function Estrella() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.1l7.1-.6L12 2z" />
    </svg>
  );
}

// Traduce lo que devuelve /usuarios/buscarTrabajadores al formato que usa la tarjeta
function mapearTrabajador(u) {
  const aptitudes = u.aptitudes || [];
  return {
    id: u.id,
    nombre: u.nombre_completo,
    zona: u.localidad,
    precio: u.cobro_por_hora != null ? Number(u.cobro_por_hora) : null,
    calificacion: u.puntuacion_trabajador != null ? Number(u.puntuacion_trabajador) : 0,
    fotoPerfilURL: u.foto_perfil || null,
    avatar: "🛠️",
    descripcion: u.sobre_mi || "",
    disponibilidad: u.disponibilidad,
    aptitudes,
    aptitudesEspecificas: u.aptitudes_especificas || [],
    trabajos: u.trabajos || [],
    etiquetaCategoria: aptitudes[0] || "Servicios generales",
  };
}

function PaginaBusqueda() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();

  // Ojo: obtenerSesionUsuario() devuelve un objeto NUEVO (JSON.parse) en cada
  // llamada. Si lo usáramos directo como `const usuario = obtenerSesionUsuario()`
  // y lo pusiéramos en dependencias de un efecto, React lo vería "distinto" en
  // cada render (misma data, otra referencia) y el efecto se dispararía sin
  // parar. Por eso lo guardamos en estado: se recalcula solo cuando de verdad
  // cambia la sesión (login/logout), no en cada render.
  const [usuario, setUsuario] = useState(() => obtenerSesionUsuario());
  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    return () => window.removeEventListener("laburar-sesion-cambio", actualizar);
  }, []);

  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  const zonaInicial = parametros.get("categoria") ? "" : parametros.get("zona") || "";

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [filtroZona, setFiltroZona] = useState(zonaInicial);
  const [filtroCalificacion, setFiltroCalificacion] = useState(0);
  const [toast, setToast] = useState("");

  const [trabajadoresCrudos, setTrabajadoresCrudos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [trabajadorParaAgendar, setTrabajadorParaAgendar] = useState(null);

  const buscar = useCallback(async (zona) => {
    if (!usuario) return;
    setCargando(true);
    setError("");
    try {
      const zonas = zona ? [zona] : ZONAS;
      const resultado = await buscarTrabajadores(zonas);
      setTrabajadoresCrudos(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      if (err.status === 401) {
        // El token no está, es inválido o expiró (dura 3hs). Limpiamos la
        // sesión vieja para no quedar reintentando con un token muerto.
        cerrarSesionCompleta();
        setUsuario(null);
        setError("Tu sesión expiró. Volvé a iniciar sesión para buscar trabajadores.");
      } else {
        setError(err.message || "No se pudo cargar la búsqueda. Probá de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  // Búsqueda inicial y cada vez que cambia la zona seleccionada
  useEffect(() => {
    buscar(filtroZona);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroZona, usuario]);

  const trabajadores = useMemo(
    () => trabajadoresCrudos.map(mapearTrabajador),
    [trabajadoresCrudos]
  );

  const categoriasDisponibles = useMemo(
    () => [...new Set(trabajadores.flatMap((t) => t.aptitudes))].sort(),
    [trabajadores]
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
    setConsulta("");
  };

  const manejarAgendarClick = (t) => {
    if (!usuario) {
      navegar("/login");
      return;
    }
    setTrabajadorParaAgendar(t);
  };

  const manejarSolicitudEnviada = (t) => {
    setTrabajadorParaAgendar(null);
    setToast(`Le mandaste una solicitud a ${t.nombre} 🙌`);
    setTimeout(() => setToast(""), 3000);
  };

  const resultados = useMemo(() => {
    return trabajadores.filter((t) => {
      const textoBusqueda = consulta.trim().toLowerCase();
      const textoCoincide =
        !textoBusqueda ||
        t.nombre.toLowerCase().includes(textoBusqueda) ||
        t.aptitudes.some((a) => a.toLowerCase().includes(textoBusqueda)) ||
        (t.descripcion || "").toLowerCase().includes(textoBusqueda);

      const categoriaCoincide = !filtroCategoria || t.aptitudes.includes(filtroCategoria);
      const minCoincide = !precioMin || t.precio == null || t.precio >= Number(precioMin);
      const maxCoincide = !precioMax || t.precio == null || t.precio <= Number(precioMax);
      const calificacionCoincide = t.calificacion >= filtroCalificacion;

      return textoCoincide && categoriaCoincide && minCoincide && maxCoincide && calificacionCoincide;
    });
  }, [trabajadores, consulta, filtroCategoria, precioMin, precioMax, filtroCalificacion]);

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
          <select
            className="select-zona-superior"
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
          >
            <option value="">Todas las zonas</option>
            {ZONAS.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <button className="boton-buscar-superior" onClick={() => buscar(filtroZona)} disabled={cargando}>
            {cargando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {!usuario && (
          <div className="aviso-login-busqueda">
            <div className="tarjeta-aviso-login">
              <span>Iniciá sesión para ver trabajadores y mandar solicitudes.</span>
              <button className="boton-login-aviso" onClick={() => navegar("/login")}>
                Iniciar sesión
              </button>
            </div>
          </div>
        )}

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
                {categoriasDisponibles.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Precio por hora</label>
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
            {cargando ? (
              <div className="estado-carga">Buscando trabajadores...</div>
            ) : error ? (
              <div className="estado-error">{error}</div>
            ) : (
              <>
                <p className="resumen-resultados">
                  <strong>{resultados.length}</strong> trabajador{resultados.length === 1 ? "" : "es"} encontrado{resultados.length === 1 ? "" : "s"}
                </p>

                {resultados.length === 0 ? (
                  <div className="sin-resultados">
                    {usuario
                      ? "No encontramos trabajadores con esos filtros. Probá ajustarlos."
                      : "Iniciá sesión para buscar trabajadores."}
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
                        </div>
                        <div className="info-trabajador">
                          <span className="nombre-trabajador">{t.nombre}</span>
                          <span className="categoria-trabajador">{t.etiquetaCategoria}</span>
                          <div className="fila-meta-trabajador">
                            <span className="calificacion-trabajador">
                              <Estrella /> {t.calificacion > 0 ? t.calificacion.toFixed(1) : "Nuevo"}
                            </span>
                            <span className="zona-trabajador">📍 {t.zona}</span>
                          </div>
                          <div className="precio-trabajador">
                            {t.precio != null ? (
                              <>${t.precio.toLocaleString("es-AR")} <span>/ hora</span></>
                            ) : (
                              <span>Consultar precio</span>
                            )}
                          </div>
                          <div className="acciones-tarjeta">
                            <button className="boton-ver-perfil" onClick={() => navegar(`/trabajador/${t.id}`)}>
                              Ver perfil
                            </button>
                            <button className="boton-agendar" onClick={() => manejarAgendarClick(t)}>
                              Agendar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {trabajadorParaAgendar && (
          <AgendarModal
            trabajador={trabajadorParaAgendar}
            onCerrar={() => setTrabajadorParaAgendar(null)}
            onEnviada={manejarSolicitudEnviada}
          />
        )}

        {toast && <div className="toast-agendar">{toast}</div>}
      </div>
    </>
  );
}

export default PaginaBusqueda;
