import { useEffect, useRef, useState } from "react";
import {
  subirFotoTrabajo,
  obtenerMisFotosTrabajo,
  obtenerFotosTrabajoDe,
  cambiarDescripcionFotoTrabajo,
  eliminarFotoTrabajo,
  TIPOS_FOTO_TRABAJO,
} from "../api";

// Fotos de trabajos hechos: las sube el trabajador en "Mis servicios" y se ven en su perfil.
// Los botones y ventanas usan las clases de MisServicios.jsx (boton-primario, tarjeta-modal-servicio...).
const estilos = `
  .seccion-fotos-trabajos {
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 14px;
    padding: 1.1rem 1.25rem 1.25rem;
    margin-top: 1.75rem;
  }
  .cabecera-fotos-trabajos { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .titulo-fotos-trabajos { font-size: 0.95rem; font-weight: 700; color: #1a1a1a; }
  .ayuda-fotos-trabajos { font-size: 0.74rem; color: #777; margin-top: 2px; }
  .grilla-fotos-trabajos { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
  .foto-trabajo {
    display: flex; flex-direction: column; border: 1px solid #e3d3d3; border-radius: 12px; overflow: hidden; background: #fff;
  }
  .foto-trabajo-imagen {
    border: none; padding: 0; cursor: zoom-in; aspect-ratio: 4 / 3; background: #f4eeee; overflow: hidden; display: block; width: 100%;
  }
  .foto-trabajo-imagen img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.15s; }
  .foto-trabajo-imagen:hover img { transform: scale(1.03); }
  .foto-trabajo-texto { font-size: 0.76rem; color: #333; padding: 8px 10px 4px; line-height: 1.35; flex: 1; }
  .foto-trabajo-texto.vacia { color: #999; font-style: italic; }
  .foto-trabajo-acciones { display: flex; gap: 6px; padding: 6px 10px 10px; }
  .foto-trabajo-acciones button { flex: 1; padding: 5px 8px; font-size: 0.72rem; }
  .vacio-fotos-trabajos {
    text-align: center; font-size: 0.82rem; color: #666; padding: 1.4rem 1rem; border: 2px dashed #e3d3d3; border-radius: 12px; background: #fcf8f8;
  }
  .previa-foto-nueva { width: 100%; max-height: 280px; object-fit: contain; border-radius: 12px; background: #f4eeee; margin: 0.6rem 0 0.8rem; display: block; }
  .contador-foto { font-size: 0.68rem; color: #999; text-align: right; margin-top: 3px; }

  /* galería del perfil */
  .galeria-trabajos { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .galeria-trabajos button {
    border: none; padding: 0; border-radius: 10px; overflow: hidden; cursor: zoom-in; aspect-ratio: 1 / 1; background: #eee;
  }
  .galeria-trabajos img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.15s; }
  .galeria-trabajos button:hover img { transform: scale(1.04); }

  /* visor de fotos */
  .visor-foto-trabajo {
    position: fixed; inset: 0; z-index: 400; background: rgba(10,10,10,0.9); display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 2rem 1rem; cursor: zoom-out;
  }
  .visor-foto-trabajo img { max-width: 100%; max-height: calc(100% - 60px); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); cursor: default; }
  .visor-foto-trabajo p { color: #fff; font-size: 0.9rem; margin-top: 12px; text-align: center; max-width: 640px; cursor: default; }
  .visor-foto-trabajo .navegar-foto {
    position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; border: none;
    background: rgba(255,255,255,0.9); font-size: 1.4rem; cursor: pointer; line-height: 1;
  }
  .visor-foto-trabajo .navegar-foto.anterior { left: 14px; }
  .visor-foto-trabajo .navegar-foto.siguiente { right: 14px; }
  .visor-foto-trabajo .cerrar-visor {
    position: absolute; top: 14px; right: 14px; width: 38px; height: 38px; border-radius: 50%; border: none;
    background: rgba(255,255,255,0.9); font-size: 1rem; cursor: pointer;
  }
`;

const MAXIMO_DESCRIPCION = 200;

/** Foto en grande. Escape cierra solo la foto (no la ventana que está abajo) y las flechas pasan de foto. */
function VisorFoto({ fotos, indice, onCambiar, onCerrar }) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
      if (fotos.length > 1 && e.key === "ArrowRight") onCambiar((indice + 1) % fotos.length);
      if (fotos.length > 1 && e.key === "ArrowLeft") onCambiar((indice - 1 + fotos.length) % fotos.length);
    };
    document.addEventListener("keydown", manejar, true);
    return () => document.removeEventListener("keydown", manejar, true);
  }, [fotos.length, indice, onCambiar, onCerrar]);

  const foto = fotos[indice];
  if (!foto) return null;
  return (
    <div className="visor-foto-trabajo" onClick={onCerrar} role="dialog" aria-label="Foto ampliada">
      <img src={foto.imagen} alt={foto.descripcion || "Trabajo realizado"} onClick={(e) => e.stopPropagation()} />
      {foto.descripcion && <p onClick={(e) => e.stopPropagation()}>{foto.descripcion}</p>}
      <button className="cerrar-visor" onClick={onCerrar} aria-label="Cerrar foto">✕</button>
      {fotos.length > 1 && (
        <>
          <button
            className="navegar-foto anterior"
            onClick={(e) => { e.stopPropagation(); onCambiar((indice - 1 + fotos.length) % fotos.length); }}
            aria-label="Foto anterior"
          >‹</button>
          <button
            className="navegar-foto siguiente"
            onClick={(e) => { e.stopPropagation(); onCambiar((indice + 1) % fotos.length); }}
            aria-label="Foto siguiente"
          >›</button>
        </>
      )}
    </div>
  );
}

/**
 * Para el perfil del trabajador (PerfilTrabajadorModal): trae sus fotos y las muestra.
 * Si no tiene fotos (o falla), no muestra nada.
 */
export function FotosDelTrabajador({ userid, titulo = "Fotos de trabajos realizados", claseSeccion = "", claseTitulo = "" }) {
  const [fotos, setFotos] = useState([]);
  const [abierta, setAbierta] = useState(null);

  useEffect(() => {
    if (!userid) return undefined;
    let activo = true;
    obtenerFotosTrabajoDe(userid)
      .then((lista) => activo && setFotos(lista))
      .catch(() => activo && setFotos([]));
    return () => {
      activo = false;
    };
  }, [userid]);

  if (fotos.length === 0) return null;
  return (
    <div className={claseSeccion}>
      <style>{estilos}</style>
      <p className={claseTitulo}>{titulo} ({fotos.length})</p>
      <div className="galeria-trabajos">
        {fotos.map((f, i) => (
          <button type="button" key={f.id} onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}`} title={f.descripcion || ""}>
            <img src={f.imagen} alt={f.descripcion || `Trabajo ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
      {abierta !== null && (
        <VisorFoto fotos={fotos} indice={abierta} onCambiar={setAbierta} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  );
}

function VentanaFoto({ titulo, children, onCerrar }) {
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") onCerrar?.();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [onCerrar]);
  return (
    <div className="fondo-modal-servicio" onClick={onCerrar}>
      <div className="tarjeta-modal-servicio" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal-servicio" onClick={onCerrar} aria-label="Cerrar">✕</button>
        <h2 className="titulo-modal-servicio">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

/**
 * Para "Mis servicios": el trabajador sube, edita la descripción y borra fotos de sus trabajos.
 *  - onToast(texto): aviso abajo de la pantalla
 *  - onSesionVencida(): cuando el backend responde 401
 */
export default function MisFotosTrabajos({ onToast, onSesionVencida }) {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [abierta, setAbierta] = useState(null);

  const [nueva, setNueva] = useState(null); // { archivo, previa, descripcion }
  const [editando, setEditando] = useState(null); // { foto, descripcion }
  const [eliminando, setEliminando] = useState(null); // foto
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const referenciaArchivo = useRef(null);

  useEffect(() => {
    let activo = true;
    obtenerMisFotosTrabajo()
      .then((lista) => activo && setFotos(lista))
      .catch((err) => {
        if (!activo) return;
        if (err.status === 401) onSesionVencida?.();
        else setErrorCarga(err.message || "No se pudieron cargar tus fotos.");
      })
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Libera la vista previa cuando se cierra la ventana
  useEffect(() => {
    if (!nueva?.previa) return undefined;
    return () => URL.revokeObjectURL(nueva.previa);
  }, [nueva?.previa]);

  const manejarError = (err, mensaje) => {
    if (err.status === 401) {
      onSesionVencida?.();
      return;
    }
    setError(err.message || mensaje);
  };

  const elegirArchivo = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite elegir la misma foto otra vez
    if (!archivo) return;
    setError("");
    if (!TIPOS_FOTO_TRABAJO.includes(archivo.type)) {
      setNueva({ archivo: null, previa: null, descripcion: "" });
      setError("La foto tiene que ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setNueva({ archivo, previa: URL.createObjectURL(archivo), descripcion: "" });
  };

  const subir = async () => {
    if (!nueva?.archivo) return;
    setProcesando(true);
    setError("");
    try {
      const foto = await subirFotoTrabajo(nueva.archivo, nueva.descripcion);
      setFotos((prev) => [foto, ...prev]);
      setNueva(null);
      onToast?.("Subiste la foto. Ya se ve en tu perfil.");
    } catch (err) {
      manejarError(err, "No se pudo subir la foto. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const guardarDescripcion = async () => {
    const texto = editando.descripcion.trim();
    if (!texto) {
      setError("Escribí una descripción.");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      await cambiarDescripcionFotoTrabajo(editando.foto.id, texto);
      setFotos((prev) => prev.map((f) => (f.id === editando.foto.id ? { ...f, descripcion: texto } : f)));
      setEditando(null);
      onToast?.("Guardaste la descripción.");
    } catch (err) {
      manejarError(err, "No se pudo guardar. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    setProcesando(true);
    setError("");
    try {
      await eliminarFotoTrabajo(eliminando.id);
      setFotos((prev) => prev.filter((f) => f.id !== eliminando.id));
      setEliminando(null);
      onToast?.("Eliminaste la foto.");
    } catch (err) {
      manejarError(err, "No se pudo eliminar. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const cerrarVentanas = () => {
    if (procesando) return;
    setNueva(null);
    setEditando(null);
    setEliminando(null);
    setError("");
  };

  return (
    <section className="seccion-fotos-trabajos" aria-label="Fotos de mis trabajos">
      <style>{estilos}</style>
      <div className="cabecera-fotos-trabajos">
        <div>
          <p className="titulo-fotos-trabajos">Fotos de mis trabajos</p>
          <p className="ayuda-fotos-trabajos">Mostrá trabajos que hiciste: los clientes las ven cuando abren tu perfil.</p>
        </div>
        <button className="boton-primario" onClick={() => referenciaArchivo.current?.click()} disabled={cargando}>
          + Agregar foto
        </button>
        <input
          ref={referenciaArchivo}
          type="file"
          accept={TIPOS_FOTO_TRABAJO.join(",")}
          style={{ display: "none" }}
          onChange={elegirArchivo}
          aria-label="Elegir foto de un trabajo"
        />
      </div>

      {cargando ? (
        <div className="grilla-fotos-trabajos">
          {[0, 1, 2].map((i) => <div className="esqueleto-servicio" style={{ height: 180 }} key={i} />)}
        </div>
      ) : errorCarga ? (
        <p className="error-servicio">{errorCarga}</p>
      ) : fotos.length === 0 ? (
        <div className="vacio-fotos-trabajos">
          Todavía no subiste fotos. Las fotos de trabajos terminados le dan confianza a los clientes.
        </div>
      ) : (
        <div className="grilla-fotos-trabajos">
          {fotos.map((f, i) => (
            <article className="foto-trabajo" key={f.id}>
              <button type="button" className="foto-trabajo-imagen" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}`}>
                <img src={f.imagen} alt={f.descripcion || `Trabajo ${i + 1}`} loading="lazy" />
              </button>
              <p className={`foto-trabajo-texto ${f.descripcion ? "" : "vacia"}`}>{f.descripcion || "Sin descripción"}</p>
              <div className="foto-trabajo-acciones">
                <button className="boton-secundario" onClick={() => { setError(""); setEditando({ foto: f, descripcion: f.descripcion || "" }); }}>
                  Editar
                </button>
                <button className="boton-peligro" onClick={() => { setError(""); setEliminando(f); }}>Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {abierta !== null && (
        <VisorFoto fotos={fotos} indice={abierta} onCambiar={setAbierta} onCerrar={() => setAbierta(null)} />
      )}

      {nueva && (
        <VentanaFoto titulo="Agregar foto" onCerrar={cerrarVentanas}>
          {nueva.previa && <img className="previa-foto-nueva" src={nueva.previa} alt="Vista previa" />}
          {nueva.archivo && (
            <div className="campo-servicio">
              <label className="etiqueta-servicio" htmlFor="descripcion-foto-nueva">Descripción (opcional)</label>
              <textarea
                id="descripcion-foto-nueva"
                className="textarea-servicio"
                maxLength={MAXIMO_DESCRIPCION}
                placeholder="Ej: Cambio de cañerías en un baño completo"
                value={nueva.descripcion}
                onChange={(e) => setNueva((n) => ({ ...n, descripcion: e.target.value }))}
              />
              <p className="contador-foto">{nueva.descripcion.length}/{MAXIMO_DESCRIPCION}</p>
            </div>
          )}
          {error && <p className="error-servicio">{error}</p>}
          <div className="acciones-form">
            <button className="boton-secundario" onClick={cerrarVentanas} disabled={procesando}>Cancelar</button>
            {nueva.archivo && (
              <button className="boton-primario" onClick={subir} disabled={procesando}>
                {procesando ? "Subiendo..." : "Subir foto"}
              </button>
            )}
          </div>
        </VentanaFoto>
      )}

      {editando && (
        <VentanaFoto titulo="Editar descripción" onCerrar={cerrarVentanas}>
          <img className="previa-foto-nueva" src={editando.foto.imagen} alt="" />
          <div className="campo-servicio">
            <label className="etiqueta-servicio" htmlFor="descripcion-foto-editar">Descripción</label>
            <textarea
              id="descripcion-foto-editar"
              className="textarea-servicio"
              maxLength={MAXIMO_DESCRIPCION}
              value={editando.descripcion}
              onChange={(e) => { setError(""); setEditando((ed) => ({ ...ed, descripcion: e.target.value })); }}
            />
          </div>
          {error && <p className="error-servicio">{error}</p>}
          <div className="acciones-form">
            <button className="boton-secundario" onClick={cerrarVentanas} disabled={procesando}>Cancelar</button>
            <button className="boton-primario" onClick={guardarDescripcion} disabled={procesando}>
              {procesando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </VentanaFoto>
      )}

      {eliminando && (
        <VentanaFoto titulo="¿Eliminar esta foto?" onCerrar={cerrarVentanas}>
          <img className="previa-foto-nueva" src={eliminando.imagen} alt="" />
          <p className="texto-modal-servicio">Va a dejar de verse en tu perfil.</p>
          {error && <p className="error-servicio">{error}</p>}
          <div className="acciones-form">
            <button className="boton-secundario" onClick={cerrarVentanas} disabled={procesando}>Cancelar</button>
            <button className="boton-peligro lleno" onClick={eliminar} disabled={procesando}>
              {procesando ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
        </VentanaFoto>
      )}
    </section>
  );
}
