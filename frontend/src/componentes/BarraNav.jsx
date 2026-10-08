import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerSesionUsuario,
  cerrarSesionCompleta,
  obtenerNotificaciones,
  obtenerNotificacionesLeidas,
  marcarNotificacionesLeidas,
  claveNotificacion,
} from "../sesion";
import logoIcono from "../assets/logo-icono.svg";
import logoTexto from "../assets/logo-texto.svg";

const AVATAR_POR_DEFECTO = "https://cdn-icons-png.flaticon.com/128/149/149071.png";

const estilos = `
  .barra-nav {
    position: sticky;
    top: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 2rem;
    height: 60px;
    background: #a8a8a8;
    box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.06);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .logotipo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
  }
  .logo-icono-nav { width: 30px; height: auto; display: block; }
  .logo-texto-nav { width: 92px; height: auto; display: block; }

  .nav-centro { flex: 1; display: flex; justify-content: center; min-width: 0; }

  .nav-derecha { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
  .enlace-nav {
    background: none;
    border: none;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #222;
    cursor: pointer;
    border-radius: 999px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .enlace-nav:hover { background: rgba(255,255,255,0.35); }
  .boton-ofrecer {
    background: #3b1e0d;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 0.45rem 0.95rem;
    font-size: 0.76rem;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .boton-ofrecer:hover { background: #570101; }

  .contenedor-desplegable { position: relative; }

  /* --- campana --- */
  .boton-campana {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: none;
    border: none;
    cursor: pointer;
    color: #8a0f0f;
    transition: background 0.15s;
  }
  .boton-campana:hover { background: rgba(255,255,255,0.35); }
  .boton-campana svg { width: 24px; height: 24px; }
  .insignia-campana {
    position: absolute;
    top: 3px;
    right: 3px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #570101;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #a8a8a8;
  }

  .panel-desplegable {
    position: absolute;
    top: 46px;
    right: 0;
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.14);
    z-index: 70;
    animation: aparecer-desplegable 0.12s ease-out;
  }
  @keyframes aparecer-desplegable {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-notificaciones { width: 320px; max-width: calc(100vw - 24px); }
  .encabezado-notificaciones {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 10px;
    border-bottom: 1px solid #efefed;
  }
  .titulo-notificaciones { font-size: 0.85rem; font-weight: 700; color: #1a1a1a; }
  .lista-notificaciones { max-height: 340px; overflow-y: auto; padding: 6px; }
  .item-notificacion {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.78rem;
    color: #333;
    line-height: 1.4;
  }
  .item-notificacion + .item-notificacion { border-top: 1px solid #f3f3f1; }
  .item-notificacion.no-leida { background: #f8efef; }
  .punto-notificacion {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #570101;
    margin-top: 5px;
    flex-shrink: 0;
  }
  .item-notificacion:not(.no-leida) .punto-notificacion { background: #d4d4d0; }
  .texto-notificacion { white-space: pre-line; }
  .fecha-notificacion { font-size: 0.68rem; color: #999; margin-top: 3px; }
  .vacio-notificaciones {
    padding: 26px 16px;
    text-align: center;
    font-size: 0.8rem;
    color: #888;
  }

  /* --- usuario --- */
  .boton-usuario {
    display: flex;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px 4px 4px;
    border-radius: 999px;
    transition: background 0.15s;
  }
  .boton-usuario:hover { background: rgba(255,255,255,0.35); }
  .avatar-usuario {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    background: #555;
    display: block;
    font-size: 0;
    color: transparent;
  }
  .nombre-boton-usuario {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1a1a1a;
    text-transform: uppercase;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flecha-usuario { width: 10px; height: 10px; color: #1a1a1a; transition: transform 0.15s; }
  .flecha-usuario.abierta { transform: rotate(180deg); }

  .menu-avatar { min-width: 210px; padding: 6px; }
  .menu-avatar-nombre {
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a1a1a;
    padding: 8px 10px 2px;
  }
  .menu-avatar-correo { font-size: 0.72rem; color: #888; padding: 0 10px 8px; }
  .menu-avatar-separador { height: 1px; background: #efefed; margin: 4px 0; }
  .menu-avatar-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 8px 10px;
    font-size: 0.8rem;
    color: #333;
    cursor: pointer;
    border-radius: 6px;
  }
  .menu-avatar-item:hover { background: #f4eeee; }
  .menu-avatar-item.salir { color: #b3261e; }

  .boton-iniciar-sesion-nav {
    background: #570101;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .boton-iniciar-sesion-nav:hover { background: #3b1e0d; }

  @media (max-width: 860px) {
    .barra-nav { padding: 0 1rem; flex-wrap: wrap; height: auto; min-height: 60px; row-gap: 8px; padding-top: 8px; padding-bottom: 8px; }
    .nav-centro { order: 3; flex-basis: 100%; }
    .nombre-boton-usuario { display: none; }
  }
  @media (max-width: 520px) {
    .logo-texto-nav { display: none; }
    .boton-ofrecer { padding: 0.4rem 0.7rem; font-size: 0.7rem; }
  }
`;

function IconoCampana() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" />
    </svg>
  );
}

function IconoFlecha({ abierta }) {
  return (
    <svg className={`flecha-usuario ${abierta ? "abierta" : ""}`} viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M0 2.5h10L5 8.5z" />
    </svg>
  );
}

function formatearFechaNotificacion(n) {
  const valor = n?.fecha || n?.created_at || n?.creado || n?.fecha_creacion;
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fechaCorta(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// El backend arma el texto con saltos de línea + sangría y el período como
// array de Postgres ("{2026-10-01,2026-10-03}"); lo dejamos legible.
function limpiarTexto(texto) {
  return String(texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/[{[(]?\s*(\d{4}-\d{2}-\d{2})\s*,\s*(\d{4}-\d{2}-\d{2})\s*[}\])]?/g, (_, a, b) =>
      a === b ? fechaCorta(a) : `${fechaCorta(a)} – ${fechaCorta(b)}`
    );
}

// Cierra el desplegable cuando se hace click afuera.
function useClickAfuera(referencia, alClickAfuera) {
  useEffect(() => {
    const manejar = (e) => {
      if (referencia.current && !referencia.current.contains(e.target)) alClickAfuera();
    };
    document.addEventListener("mousedown", manejar);
    return () => document.removeEventListener("mousedown", manejar);
  }, [referencia, alClickAfuera]);
}

/**
 * Barra de navegación superior.
 * Props:
 *  - centro (opcional): contenido que se muestra en el medio (ej: el buscador).
 */
export default function BarraNav({ centro = null }) {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(obtenerSesionUsuario());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [campanaAbierta, setCampanaAbierta] = useState(false);
  const [notificaciones, setNotificaciones] = useState(obtenerNotificaciones());
  const [leidas, setLeidas] = useState(obtenerNotificacionesLeidas());
  // Las que estaban sin leer al abrir la campana (para resaltarlas mientras está abierta)
  const [noLeidasAlAbrir, setNoLeidasAlAbrir] = useState([]);

  const referenciaMenu = useRef(null);
  const referenciaCampana = useRef(null);

  useEffect(() => {
    const actualizarSesion = () => setUsuario(obtenerSesionUsuario());
    const actualizarNotificaciones = () => {
      setNotificaciones(obtenerNotificaciones());
      setLeidas(obtenerNotificacionesLeidas());
    };
    window.addEventListener("laburar-sesion-cambio", actualizarSesion);
    window.addEventListener("laburar-notificaciones-cambio", actualizarNotificaciones);
    return () => {
      window.removeEventListener("laburar-sesion-cambio", actualizarSesion);
      window.removeEventListener("laburar-notificaciones-cambio", actualizarNotificaciones);
    };
  }, []);

  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const cerrarCampana = useCallback(() => setCampanaAbierta(false), []);
  useClickAfuera(referenciaMenu, cerrarMenu);
  useClickAfuera(referenciaCampana, cerrarCampana);

  const clavesNotificaciones = notificaciones.map((n, i) => claveNotificacion(n, i));
  const cantidadNoLeidas = clavesNotificaciones.filter((c) => !leidas.includes(c)).length;

  const alternarCampana = () => {
    if (!campanaAbierta) {
      setNoLeidasAlAbrir(clavesNotificaciones.filter((c) => !leidas.includes(c)));
      if (cantidadNoLeidas > 0) marcarNotificacionesLeidas(clavesNotificaciones);
    }
    setCampanaAbierta((prev) => !prev);
    setMenuAbierto(false);
  };

  const ir = (ruta) => {
    setMenuAbierto(false);
    navegar(ruta);
  };

  const manejarCerrarSesion = () => {
    cerrarSesionCompleta();
    setMenuAbierto(false);
    navegar("/");
  };

  const primerNombre = (usuario?.nombre || "Usuario").split(" ")[0];

  return (
    <>
      <style>{estilos}</style>
      <header className="barra-nav">
        <div className="logotipo" onClick={() => navegar("/")}>
          <img src={logoIcono} alt="" className="logo-icono-nav" />
          <img src={logoTexto} alt="LABURAR" className="logo-texto-nav" />
        </div>

        {centro && <div className="nav-centro">{centro}</div>}

        <nav className="nav-derecha">
          {usuario ? (
            <>
              <button className="boton-ofrecer" onClick={() => navegar("/ofrecer-servicios")}>
                Ofrecer mi servicio
              </button>

              <div className="contenedor-desplegable" ref={referenciaCampana}>
                <button
                  className="boton-campana"
                  onClick={alternarCampana}
                  aria-label={`Notificaciones${cantidadNoLeidas ? ` (${cantidadNoLeidas} sin leer)` : ""}`}
                >
                  <IconoCampana />
                  {cantidadNoLeidas > 0 && (
                    <span className="insignia-campana">{cantidadNoLeidas > 9 ? "9+" : cantidadNoLeidas}</span>
                  )}
                </button>
                {campanaAbierta && (
                  <div className="panel-desplegable panel-notificaciones">
                    <div className="encabezado-notificaciones">
                      <span className="titulo-notificaciones">Notificaciones</span>
                    </div>
                    {notificaciones.length === 0 ? (
                      <div className="vacio-notificaciones">No tenés notificaciones por ahora.</div>
                    ) : (
                      <div className="lista-notificaciones">
                        {[...notificaciones].reverse().map((n, iInvertido) => {
                          const indice = notificaciones.length - 1 - iInvertido;
                          const clave = clavesNotificaciones[indice];
                          const fecha = formatearFechaNotificacion(n);
                          return (
                            <div
                              key={clave}
                              className={`item-notificacion ${noLeidasAlAbrir.includes(clave) ? "no-leida" : ""}`}
                            >
                              <span className="punto-notificacion" />
                              <div>
                                <div className="texto-notificacion">{limpiarTexto(n.contenido)}</div>
                                {fecha && <div className="fecha-notificacion">{fecha}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="contenedor-desplegable" ref={referenciaMenu}>
                <button
                  className="boton-usuario"
                  onClick={() => {
                    setMenuAbierto((prev) => !prev);
                    setCampanaAbierta(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menuAbierto}
                >
                  <img
                    className="avatar-usuario"
                    src={usuario.fotoPerfilURL || AVATAR_POR_DEFECTO}
                    alt=""
                  />
                  <span className="nombre-boton-usuario">{primerNombre}</span>
                  <IconoFlecha abierta={menuAbierto} />
                </button>
                {menuAbierto && (
                  <div className="panel-desplegable menu-avatar" role="menu">
                    <div className="menu-avatar-nombre">{usuario.nombre}</div>
                    {usuario.correo && <div className="menu-avatar-correo">{usuario.correo}</div>}
                    <div className="menu-avatar-separador" />
                    <button className="menu-avatar-item" onClick={() => ir("/buscar")}>
                      Buscar trabajadores
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/buscar?vista=solicitudes")}>
                      Mis solicitudes
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/solicitudes-recibidas")}>
                      Solicitudes recibidas
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/trabajos-pendientes")}>
                      Trabajos pendientes
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/mensajes")}>
                      Bandeja de entrada
                    </button>
                    <button className="menu-avatar-item" onClick={() => ir("/ofrecer-servicios")}>
                      Ofrecer servicios
                    </button>
                    <div className="menu-avatar-separador" />
                    <button className="menu-avatar-item salir" onClick={manejarCerrarSesion}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="enlace-nav" onClick={() => navegar("/paso1")}>
                Registrarme
              </button>
              <button className="boton-iniciar-sesion-nav" onClick={() => navegar("/login")}>
                Iniciar sesión
              </button>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
