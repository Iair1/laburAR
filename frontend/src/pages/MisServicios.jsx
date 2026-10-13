import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import {
  obtenerMisAptitudes,
  editarServicio,
  eliminarServicio,
  obtenerMiPerfil,
  cambiarDatos,
} from "../api";
import { ZONAS } from "../constantes";
import { ICONOS_CATEGORIAS } from "../iconosCategorias";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-mis-servicios {
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }
  .contenido-mis-servicios { max-width: 980px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

  .encabezado-mis-servicios {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .titulo-mis-servicios { font-size: 1.6rem; font-weight: 800; color: #111; letter-spacing: -0.01em; }
  .subtitulo-mis-servicios { font-size: 0.86rem; color: #555; margin-top: 4px; }

  .boton-primario, .boton-secundario, .boton-peligro {
    border-radius: 999px;
    padding: 9px 18px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .boton-primario { background: #570101; color: #fff; border: 1px solid #570101; }
  .boton-primario:hover { background: #3b1e0d; }
  .boton-secundario { background: #fff; color: #1a1a1a; border: 1px solid #570101; }
  .boton-secundario:hover { background: #f6eeee; }
  .boton-peligro { background: #fff; color: #b3261e; border: 1px solid #e3b4b0; }
  .boton-peligro:hover { background: #fbeceb; border-color: #b3261e; }
  .boton-peligro.lleno { background: #b3261e; color: #fff; border-color: #b3261e; }
  .boton-peligro.lleno:hover { background: #8f1d17; }
  .boton-primario:disabled, .boton-secundario:disabled, .boton-peligro:disabled { opacity: 0.6; cursor: not-allowed; }

  .aviso-exito {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: #e8f5e9;
    border: 1px solid #b7dfba;
    color: #1e5e22;
    border-radius: 12px;
    padding: 0.8rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
  }
  .aviso-exito button { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; }

  .tarjeta-zona {
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 14px;
    padding: 1.1rem 1.25rem;
    margin-bottom: 1.5rem;
  }
  .fila-zona { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .titulo-zona { font-size: 0.95rem; font-weight: 700; color: #1a1a1a; }
  .ayuda-zona { font-size: 0.74rem; color: #777; margin-top: 2px; }
  .datos-zona { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; font-size: 0.82rem; color: #333; }
  .chip-dia-zona {
    padding: 4px 10px;
    border-radius: 999px;
    background: #f4eeee;
    border: 1px solid #e3d3d3;
    font-size: 0.72rem;
    font-weight: 600;
    color: #3b1e0d;
  }
  .form-zona { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
  .chips-dias-editar { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-dia-editar {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    font-size: 0.74rem;
    font-weight: 600;
    color: #1a1a1a;
    cursor: pointer;
    font-family: inherit;
  }
  .chip-dia-editar.activo { background: #7a2a2a; border-color: #570101; color: #fff; }
  .acciones-form { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

  .lista-servicios {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
  .tarjeta-servicio {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #9e7d7d;
    border-radius: 14px;
    padding: 1.1rem 1.15rem 1rem;
    transition: box-shadow 0.15s, transform 0.1s;
  }
  .tarjeta-servicio:hover { box-shadow: 0 8px 22px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .cabecera-servicio { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .icono-servicio {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #f4eeee;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .icono-servicio span {
    width: 26px;
    height: 26px;
    background: #570101;
    -webkit-mask: var(--icono) center / contain no-repeat;
    mask: var(--icono) center / contain no-repeat;
  }
  .icono-servicio svg { width: 24px; height: 24px; color: #570101; }
  .nombre-servicio { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  .precio-servicio { font-size: 0.86rem; font-weight: 700; color: #570101; margin-top: 1px; }
  .precio-servicio span { font-weight: 500; color: #777; font-size: 0.74rem; }
  .experiencia-servicio { font-size: 0.74rem; color: #555; margin-bottom: 6px; }
  .descripcion-servicio {
    font-size: 0.8rem;
    color: #333;
    line-height: 1.45;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-line;
  }
  .descripcion-servicio.vacia { color: #999; font-style: italic; }
  .acciones-servicio { display: flex; gap: 8px; margin-top: auto; }
  .acciones-servicio button { flex: 1; }

  .estado-mis-servicios {
    text-align: center;
    padding: 3rem 1.5rem;
    background: rgba(255,255,255,0.85);
    border: 1px solid #ddd;
    border-radius: 14px;
    color: #555;
    font-size: 0.9rem;
  }
  .estado-mis-servicios.error { color: #b23a1c; }
  .estado-mis-servicios p { margin-bottom: 1rem; }
  .titulo-vacio { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; }
  .esqueleto-servicio {
    height: 200px;
    border-radius: 14px;
    background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%);
    background-size: 400% 100%;
    animation: brillo-servicio 1.3s ease infinite;
  }
  @keyframes brillo-servicio { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  /* --- modales --- */
  .fondo-modal-servicio {
    position: fixed;
    inset: 0;
    background: rgba(20,20,20,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
  }
  .tarjeta-modal-servicio {
    position: relative;
    background: #fff;
    border: 1.5px solid #1a1a1a;
    border-radius: 22px;
    padding: 1.6rem 1.75rem 1.4rem;
    width: 100%;
    max-width: 480px;
    max-height: 92vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  }
  .titulo-modal-servicio { font-size: 1.2rem; font-weight: 800; color: #111; margin-bottom: 0.3rem; padding-right: 24px; }
  .texto-modal-servicio { font-size: 0.84rem; color: #444; line-height: 1.5; margin-bottom: 1.1rem; }
  .cerrar-modal-servicio {
    position: absolute;
    top: 12px;
    right: 14px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    color: #666;
    font-size: 1rem;
  }
  .cerrar-modal-servicio:hover { background: #f0f0ee; }
  .campo-servicio { margin-bottom: 0.9rem; }
  .etiqueta-servicio { display: block; font-size: 0.78rem; font-weight: 600; color: #333; margin-bottom: 0.3rem; }
  .entrada-servicio, .textarea-servicio, .select-servicio {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #8f8f8f;
    border-radius: 10px;
    font-size: 0.85rem;
    color: #222;
    font-family: inherit;
    outline: none;
    background: #fff;
  }
  .entrada-servicio:focus, .textarea-servicio:focus, .select-servicio:focus {
    border-color: #570101;
    box-shadow: 0 0 0 3px rgba(87,1,1,0.12);
  }
  .textarea-servicio { min-height: 110px; resize: vertical; line-height: 1.4; }
  .fila-campos-servicio { display: flex; gap: 12px; }
  .fila-campos-servicio > div { flex: 1; }
  .error-servicio { font-size: 0.8rem; color: #b3261e; font-weight: 600; margin-bottom: 0.8rem; }

  .toast-servicios {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #570101;
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    z-index: 300;
  }

  @media (max-width: 560px) {
    .contenido-mis-servicios { padding: 1.25rem 1rem 3rem; }
    .encabezado-mis-servicios { align-items: flex-start; }
    .fila-campos-servicio { flex-direction: column; gap: 0; }
  }
`;

function IconoGenerico() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
    </svg>
  );
}

function IconoCategoria({ aptitud }) {
  const icono = ICONOS_CATEGORIAS[aptitud];
  return (
    <span className="icono-servicio">
      {icono ? <span style={{ "--icono": `url("${icono}")` }} /> : <IconoGenerico />}
    </span>
  );
}

function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? `$${numero.toLocaleString("es-AR")}` : null;
}

// Cierra con Escape (para los modales)
function useEscape(alPresionar) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") alPresionar();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [alPresionar]);
}

function ModalEditarServicio({ servicio, onCerrar, onGuardar }) {
  const [precio, setPrecio] = useState(servicio.cobro_por_hora != null ? String(Number(servicio.cobro_por_hora)) : "");
  const [experiencia, setExperiencia] = useState(servicio.anios_experiencia != null ? String(servicio.anios_experiencia) : "");
  const [descripcion, setDescripcion] = useState(servicio.descripcion || "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEscape(onCerrar);

  const guardar = async () => {
    if (!precio || Number(precio) <= 0) {
      setError("Ingresá un precio por hora válido.");
      return;
    }
    if (experiencia !== "" && (!Number.isInteger(Number(experiencia)) || Number(experiencia) < 0)) {
      setError("Los años de experiencia tienen que ser un número entero.");
      return;
    }
    if (!descripcion.trim()) {
      setError("Escribí una descripción del servicio.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await onGuardar({
        cobro_por_hora: Number(precio),
        anios_experiencia: experiencia === "" ? null : Number(experiencia),
        descripcion: descripcion.trim(),
      });
    } catch (err) {
      setError(err.message || "No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <div className="fondo-modal-servicio" onClick={onCerrar}>
      <div className="tarjeta-modal-servicio" role="dialog" aria-modal="true" aria-label={`Editar ${servicio.aptitud}`} onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal-servicio" onClick={onCerrar} aria-label="Cerrar">✕</button>
        <h2 className="titulo-modal-servicio">Editar {servicio.aptitud}</h2>
        <p className="texto-modal-servicio">Estos datos son solo de este servicio. Los demás no cambian.</p>

        <div className="fila-campos-servicio">
          <div className="campo-servicio">
            <label className="etiqueta-servicio" htmlFor="precio-servicio">Precio por hora ($)</label>
            <input id="precio-servicio" className="entrada-servicio" type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div className="campo-servicio">
            <label className="etiqueta-servicio" htmlFor="experiencia-servicio">Años de experiencia</label>
            <input id="experiencia-servicio" className="entrada-servicio" type="number" min="0" step="1" value={experiencia} onChange={(e) => setExperiencia(e.target.value)} />
          </div>
        </div>
        <div className="campo-servicio">
          <label className="etiqueta-servicio" htmlFor="descripcion-servicio">Descripción</label>
          <textarea
            id="descripcion-servicio"
            className="textarea-servicio"
            placeholder="Contá en qué te especializás y qué incluye el servicio..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {error && <p className="error-servicio">{error}</p>}
        <div className="acciones-form">
          <button className="boton-secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="boton-primario" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEliminarServicio({ servicio, esElUltimo, onCerrar, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");
  useEscape(onCerrar);

  const confirmar = async () => {
    setEliminando(true);
    setError("");
    try {
      await onConfirmar();
    } catch (err) {
      setError(err.message || "No se pudo eliminar. Probá de nuevo.");
      setEliminando(false);
    }
  };

  return (
    <div className="fondo-modal-servicio" onClick={onCerrar}>
      <div className="tarjeta-modal-servicio" role="alertdialog" aria-modal="true" aria-label={`Eliminar ${servicio.aptitud}`} onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal-servicio" onClick={onCerrar} aria-label="Cerrar">✕</button>
        <h2 className="titulo-modal-servicio">¿Eliminar {servicio.aptitud}?</h2>
        <p className="texto-modal-servicio">
          Vas a dejar de aparecer en las búsquedas de {servicio.aptitud}.
          {esElUltimo && <><br /><strong>Es tu único servicio:</strong> no vas a aparecer en ninguna búsqueda hasta que publiques otro.</>}
        </p>
        {error && <p className="error-servicio">{error}</p>}
        <div className="acciones-form">
          <button className="boton-secundario" onClick={onCerrar} disabled={eliminando}>Cancelar</button>
          <button className="boton-peligro lleno" onClick={confirmar} disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MisServicios() {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());

  const [servicios, setServicios] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [servicioEditando, setServicioEditando] = useState(null);
  const [servicioEliminando, setServicioEliminando] = useState(null);

  const [editandoZona, setEditandoZona] = useState(false);
  const [zona, setZona] = useState("");
  const [dias, setDias] = useState([]);
  const [guardandoZona, setGuardandoZona] = useState(false);
  const [errorZona, setErrorZona] = useState("");

  const publicado = parametros.get("publicado");

  const mostrarToast = (texto) => {
    setToast(texto);
    setTimeout(() => setToast(""), 3000);
  };

  const manejarError = useCallback((err, setErr) => {
    if (err.status === 401) {
      cerrarSesionCompleta();
      navegar("/login");
      return;
    }
    setErr(err.message || "Ocurrió un error. Probá de nuevo.");
  }, [navegar]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [misServicios, miPerfil] = await Promise.all([
        obtenerMisAptitudes(),
        obtenerMiPerfil().catch(() => null), // la zona es opcional para esta pantalla
      ]);
      setServicios(misServicios);
      setPerfil(miPerfil);
    } catch (err) {
      manejarError(err, setError);
    } finally {
      setCargando(false);
    }
  }, [manejarError]);

  useEffect(() => {
    if (!usuario) {
      navegar("/login");
      return;
    }
    cargar();
  }, [usuario, navegar, cargar]);

  const guardarEdicion = async (datos) => {
    const servicio = servicioEditando;
    try {
      await editarServicio(servicio.aptitud, datos);
    } catch (err) {
      if (err.status === 401) {
        manejarError(err, () => {});
        return;
      }
      throw err;
    }
    setServicios((prev) => prev.map((s) => (s.aptitud === servicio.aptitud ? { ...s, ...datos } : s)));
    setServicioEditando(null);
    mostrarToast(`Guardaste los cambios de ${servicio.aptitud}`);
  };

  const confirmarEliminar = async () => {
    const servicio = servicioEliminando;
    try {
      await eliminarServicio(servicio.aptitud);
    } catch (err) {
      if (err.status === 401) {
        manejarError(err, () => {});
        return;
      }
      throw err;
    }
    setServicios((prev) => prev.filter((s) => s.aptitud !== servicio.aptitud));
    setServicioEliminando(null);
    mostrarToast(`Eliminaste ${servicio.aptitud}`);
  };

  const diasDelPerfil = Array.isArray(perfil?.disponibilidad)
    ? DIAS.filter((_, i) => perfil.disponibilidad[i])
    : [];

  const empezarEdicionZona = () => {
    setZona(ZONAS.includes(perfil?.localidad) ? perfil.localidad : "");
    setDias(diasDelPerfil);
    setErrorZona("");
    setEditandoZona(true);
  };

  const guardarZona = async () => {
    if (!zona) {
      setErrorZona("Elegí una zona.");
      return;
    }
    setGuardandoZona(true);
    setErrorZona("");
    const disponibilidad = DIAS.map((d) => dias.includes(d));
    try {
      await cambiarDatos([
        { dato: "localidad", valor: zona },
        { dato: "disponibilidad", valor: `{${disponibilidad.join(",")}}` },
      ]);
      setPerfil((p) => ({ ...(p || {}), localidad: zona, disponibilidad }));
      setEditandoZona(false);
      mostrarToast("Guardaste tu zona y disponibilidad");
    } catch (err) {
      manejarError(err, setErrorZona);
    } finally {
      setGuardandoZona(false);
    }
  };

  const cerrarAvisoPublicado = () => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete("publicado");
    setParametros(siguientes, { replace: true });
  };

  if (!usuario) return null;

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-mis-servicios">
        <BarraNav />
        <main className="contenido-mis-servicios">
          <div className="encabezado-mis-servicios">
            <div>
              <h1 className="titulo-mis-servicios">Mis servicios</h1>
              <p className="subtitulo-mis-servicios">Editá o eliminá los servicios que tenés publicados.</p>
            </div>
            <button className="boton-primario" onClick={() => navegar("/ofrecer-servicios")}>
              + Ofrecer otro servicio
            </button>
          </div>

          {publicado && (
            <div className="aviso-exito" role="status">
              <span>¡Listo! Publicaste {publicado}. Ya aparecés en las búsquedas.</span>
              <button onClick={cerrarAvisoPublicado} aria-label="Cerrar aviso">✕</button>
            </div>
          )}

          {!cargando && !error && servicios.length > 0 && (
            <section className="tarjeta-zona">
              <div className="fila-zona">
                <div>
                  <p className="titulo-zona">Zona y disponibilidad</p>
                  <p className="ayuda-zona">Valen para todos tus servicios.</p>
                </div>
                {!editandoZona && (
                  <button className="boton-secundario" onClick={empezarEdicionZona}>Editar</button>
                )}
              </div>

              {!editandoZona ? (
                <div className="datos-zona">
                  <span>📍 {perfil?.localidad || "Sin zona"}</span>
                  <span>·</span>
                  {diasDelPerfil.length > 0
                    ? diasDelPerfil.map((d) => <span className="chip-dia-zona" key={d}>{d}</span>)
                    : <span>Sin días cargados</span>}
                </div>
              ) : (
                <div className="form-zona">
                  <select className="select-servicio" value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Zona">
                    <option value="">Elegí una zona</option>
                    {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <div className="chips-dias-editar">
                    {DIAS.map((d) => (
                      <button
                        type="button"
                        key={d}
                        className={`chip-dia-editar ${dias.includes(d) ? "activo" : ""}`}
                        onClick={() => setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {errorZona && <p className="error-servicio">{errorZona}</p>}
                  <div className="acciones-form">
                    <button className="boton-secundario" onClick={() => setEditandoZona(false)} disabled={guardandoZona}>Cancelar</button>
                    <button className="boton-primario" onClick={guardarZona} disabled={guardandoZona}>
                      {guardandoZona ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {cargando ? (
            <div className="lista-servicios">
              {[0, 1, 2].map((i) => <div className="esqueleto-servicio" key={i} />)}
            </div>
          ) : error ? (
            <div className="estado-mis-servicios error">
              <p>{error}</p>
              <button className="boton-secundario" onClick={cargar}>Reintentar</button>
            </div>
          ) : servicios.length === 0 ? (
            <div className="estado-mis-servicios">
              <p className="titulo-vacio">Todavía no ofrecés ningún servicio</p>
              <p>Publicá uno y empezá a recibir solicitudes de clientes cerca tuyo.</p>
              <button className="boton-primario" onClick={() => navegar("/ofrecer-servicios")}>Ofrecer un servicio</button>
            </div>
          ) : (
            <div className="lista-servicios">
              {servicios.map((s) => {
                const precio = formatearPrecio(s.cobro_por_hora);
                return (
                  <article className="tarjeta-servicio" key={s.aptitud}>
                    <div className="cabecera-servicio">
                      <IconoCategoria aptitud={s.aptitud} />
                      <div>
                        <h2 className="nombre-servicio">{s.aptitud}</h2>
                        <div className="precio-servicio">
                          {precio ? <>{precio} <span>/ hora</span></> : <span>Sin precio cargado</span>}
                        </div>
                      </div>
                    </div>
                    {s.anios_experiencia != null && (
                      <p className="experiencia-servicio">
                        {s.anios_experiencia} {Number(s.anios_experiencia) === 1 ? "año" : "años"} de experiencia
                      </p>
                    )}
                    <p className={`descripcion-servicio ${s.descripcion ? "" : "vacia"}`}>
                      {s.descripcion || "Sin descripción. Agregá una para que los clientes sepan qué hacés."}
                    </p>
                    <div className="acciones-servicio">
                      <button className="boton-secundario" onClick={() => setServicioEditando(s)}>Editar</button>
                      <button className="boton-peligro" onClick={() => setServicioEliminando(s)}>Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {servicioEditando && (
          <ModalEditarServicio
            servicio={servicioEditando}
            onCerrar={() => setServicioEditando(null)}
            onGuardar={guardarEdicion}
          />
        )}
        {servicioEliminando && (
          <ModalEliminarServicio
            servicio={servicioEliminando}
            esElUltimo={servicios.length === 1}
            onCerrar={() => setServicioEliminando(null)}
            onConfirmar={confirmarEliminar}
          />
        )}
        {toast && <div className="toast-servicios" role="status">{toast}</div>}
      </div>
    </>
  );
}
