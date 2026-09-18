import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { obtenerSesionUsuario } from "../sesion";
import {
  obtenerSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
} from "../api";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-solicitudes {
    min-height: 100vh;
    
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        
    background-image: url('../assets/fondo.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    margin: 0;
  }

  .contenido-solicitudes {
    max-width: 780px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
  }
  .titulo-solicitudes { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.3rem; }
  .subtitulo-solicitudes { font-size: 0.85rem; color: #666; margin-bottom: 1.75rem; }

  .estado-solicitudes { text-align: center; padding: 3rem 1rem; color: #777; font-size: 0.9rem; }
  .estado-solicitudes.error { color: #b23a1c; }

  .lista-solicitudes { display: flex; flex-direction: column; gap: 14px; }

  .tarjeta-solicitud {
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 12px;
    padding: 1.1rem 1.25rem;
    display: flex;
    gap: 14px;
  }
  .avatar-solicitud {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #eef0ee;
  }
  .cuerpo-solicitud { flex: 1; min-width: 0; }
  .encabezado-solicitud {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .nombre-contratador { font-size: 0.92rem; font-weight: 700; color: #1a1a1a; }
  .puntuacion-contratador { font-size: 0.75rem; color: #b8860b; font-weight: 600; }
  .texto-solicitud { font-size: 0.85rem; color: #333; margin: 6px 0 8px; }
  .meta-solicitud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .chip-meta-solicitud {
    font-size: 0.7rem;
    font-weight: 600;
    color: #555;
    background: #efefed;
    border-radius: 999px;
    padding: 3px 10px;
  }
  .acciones-solicitud { display: flex; gap: 8px; }
  .boton-aceptar-solicitud, .boton-rechazar-solicitud {
    font-size: 0.78rem;
    font-weight: 700;
    border-radius: 7px;
    padding: 8px 14px;
    cursor: pointer;
    border: none;
    transition: background 0.15s;
  }
  .boton-aceptar-solicitud { background: #1a2332; color: #fff; }
  .boton-aceptar-solicitud:hover { background: #0f1621; }
  .boton-rechazar-solicitud { background: #fff; border: 1px solid #ccc; color: #333; }
  .boton-rechazar-solicitud:hover { background: #f0f0ee; }
  .boton-aceptar-solicitud:disabled, .boton-rechazar-solicitud:disabled { opacity: 0.6; cursor: not-allowed; }

  .toast-solicitudes {
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
`;

export default function SolicitudesRecibidas() {
  const navegar = useNavigate();
  const usuario = obtenerSesionUsuario();

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [idsEnProceso, setIdsEnProceso] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!usuario) {
      navegar("/login");
      return;
    }
    cargarSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarSolicitudes = async () => {
    setCargando(true);
    setError("");
    try {
      const resultado = await obtenerSolicitudesRecibidas();
      setSolicitudes(resultado);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  };

  const marcarEnProceso = (id, enProceso) => {
    setIdsEnProceso((prev) =>
      enProceso ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const manejarAceptar = async (solicitud) => {
    marcarEnProceso(solicitud.id, true);
    try {
      await aceptarSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));
      setToast(`Aceptaste la solicitud de ${solicitud.nombre_completo}`);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "No se pudo aceptar la solicitud.");
    } finally {
      marcarEnProceso(solicitud.id, false);
    }
  };

  const manejarRechazar = async (solicitud) => {
    marcarEnProceso(solicitud.id, true);
    try {
      await rechazarSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));
      setToast(`Rechazaste la solicitud de ${solicitud.nombre_completo}`);
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "No se pudo rechazar la solicitud.");
    } finally {
      marcarEnProceso(solicitud.id, false);
    }
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-solicitudes">
        <BarraNav />
        <div className="contenido-solicitudes">
          <h1 className="titulo-solicitudes">Solicitudes recibidas</h1>
          <p className="subtitulo-solicitudes">
            Pedidos de cita que te mandaron. Aceptá o rechazá cada uno.
          </p>

          {cargando ? (
            <div className="estado-solicitudes">Cargando solicitudes...</div>
          ) : error ? (
            <div className="estado-solicitudes error">{error}</div>
          ) : solicitudes.length === 0 ? (
            <div className="estado-solicitudes">Todavía no te llegó ninguna solicitud.</div>
          ) : (
            <div className="lista-solicitudes">
              {solicitudes.map((s) => (
                <div className="tarjeta-solicitud" key={s.id}>
                  <img
                    className="avatar-solicitud"
                    src={s.foto_perfil || "https://cdn-icons-png.flaticon.com/128/149/149071.png"}
                    alt={s.nombre_completo}
                  />
                  <div className="cuerpo-solicitud">
                    <div className="encabezado-solicitud">
                      <span className="nombre-contratador">{s.nombre_completo}</span>
                      {s.puntuacion_contratador != null && (
                        <span className="puntuacion-contratador">★ {Number(s.puntuacion_contratador).toFixed(1)}</span>
                      )}
                    </div>
                    <p className="texto-solicitud">{s.solicitud}</p>
                    <div className="meta-solicitud">
                      {s.periodo && <span className="chip-meta-solicitud">📅 {s.periodo}</span>}
                      {s.aptitud && <span className="chip-meta-solicitud">{s.aptitud}</span>}
                      {s.aptitud_especifica && <span className="chip-meta-solicitud">{s.aptitud_especifica}</span>}
                      {s.trabajo && <span className="chip-meta-solicitud">{s.trabajo}</span>}
                    </div>
                    <div className="acciones-solicitud">
                      <button
                        className="boton-aceptar-solicitud"
                        onClick={() => manejarAceptar(s)}
                        disabled={idsEnProceso.includes(s.id)}
                      >
                        Aceptar
                      </button>
                      <button
                        className="boton-rechazar-solicitud"
                        onClick={() => manejarRechazar(s)}
                        disabled={idsEnProceso.includes(s.id)}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {toast && <div className="toast-solicitudes">{toast}</div>}
      </div>
    </>
  );
}
