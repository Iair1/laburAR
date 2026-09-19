import { useState } from "react";

const estilos = `
  .fondo-modal-perfil {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
  }
  .tarjeta-modal-perfil {
    background: #fff;
    border-radius: 16px;
    padding: 1.75rem;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
  }
  .encabezado-perfil {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 1.1rem;
  }
  .fila-identidad-perfil { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .avatar-perfil {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #eef0ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
  }
  .avatar-perfil img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .nombre-perfil { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; }
  .calificacion-perfil { font-size: 0.82rem; color: #b8860b; font-weight: 600; margin-top: 2px; }
  .precio-perfil {
    background: #570101;
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 8px 14px;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .precio-perfil span { font-weight: 500; opacity: 0.85; font-size: 0.72rem; }
  .cerrar-modal-perfil {
    position: absolute;
    top: 14px;
    right: 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    color: #888;
    line-height: 1;
  }

  .chips-categoria-perfil { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.1rem; }
  .chip-categoria-perfil {
    font-size: 0.72rem;
    font-weight: 600;
    color: #555;
    background: #efefed;
    border-radius: 999px;
    padding: 4px 11px;
  }
  .chip-verificado-perfil {
    font-size: 0.72rem;
    font-weight: 700;
    color: #2e7d32;
    background: #e6f4ea;
    border-radius: 999px;
    padding: 4px 11px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .seccion-perfil { margin-bottom: 1.1rem; }
  .titulo-seccion-perfil {
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.4rem;
  }
  .texto-seccion-perfil {
    font-size: 0.85rem;
    color: #444;
    line-height: 1.5;
    white-space: pre-line;
  }
  .boton-leer-mas {
    background: none;
    border: none;
    color: #570101;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 4px 0 0;
  }

  .lista-chips-perfil { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-perfil {
    font-size: 0.76rem;
    font-weight: 600;
    color: #3b1e0d;
    background: #f2eae7;
    border: 1px solid #e6d9d4;
    border-radius: 8px;
    padding: 5px 10px;
  }

  .fila-meta-perfil {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 0.8rem;
    color: #555;
    margin-bottom: 1.3rem;
    flex-wrap: wrap;
  }

  .boton-agendar-perfil {
    width: 100%;
    padding: 13px;
    background: #570101;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background 0.15s;
  }
  .boton-agendar-perfil:hover { background: #3b1e0d; }
`;

const LIMITE_DESCRIPCION = 220;

/**
 * Tarjeta de perfil de un trabajador (lo que se ve al tocar "Ver perfil").
 * Props:
 *  - trabajador: mismo objeto que arma mapearTrabajador() en PaginaBusqueda
 *  - onCerrar(): cierra el modal
 *  - onAgendar(trabajador): el usuario quiere agendar con este trabajador
 */
export default function PerfilTrabajadorModal({ trabajador, onCerrar, onAgendar }) {
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  if (!trabajador) return null;

  const descripcion = trabajador.descripcion || "";
  const descripcionLarga = descripcion.length > LIMITE_DESCRIPCION;
  const descripcionMostrada =
    descripcionLarga && !descripcionExpandida
      ? descripcion.slice(0, LIMITE_DESCRIPCION).trim() + "…"
      : descripcion;

  const habilidades =
    trabajador.aptitudesEspecificas && trabajador.aptitudesEspecificas.length > 0
      ? trabajador.aptitudesEspecificas
      : trabajador.aptitudes || [];

  return (
    <>
      <style>{estilos}</style>
      <div className="fondo-modal-perfil" onClick={onCerrar}>
        <div className="tarjeta-modal-perfil" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <button className="cerrar-modal-perfil" onClick={onCerrar} aria-label="Cerrar">✕</button>

          <div className="encabezado-perfil">
            <div className="fila-identidad-perfil">
              <div className="avatar-perfil">
                {trabajador.fotoPerfilURL ? (
                  <img src={trabajador.fotoPerfilURL} alt={trabajador.nombre} />
                ) : (
                  trabajador.avatar || "🛠️"
                )}
              </div>
              <div>
                <div className="nombre-perfil">{trabajador.nombre}</div>
                <div className="calificacion-perfil">
                  ★ {trabajador.calificacion > 0 ? trabajador.calificacion.toFixed(1) : "Nuevo"}
                </div>
              </div>
            </div>
            {trabajador.precio != null && (
              <div className="precio-perfil">
                ${trabajador.precio.toLocaleString("es-AR")}<span>/hr</span>
              </div>
            )}
          </div>

          <div className="chips-categoria-perfil">
            {(trabajador.aptitudes || []).map((a) => (
              <span className="chip-categoria-perfil" key={a}>{a}</span>
            ))}
            {trabajador.verificado && (
              <span className="chip-verificado-perfil">✓ Trabajador verificado</span>
            )}
          </div>

          <div className="fila-meta-perfil">
            <span>📍 {trabajador.zona}</span>
          </div>

          {descripcion && (
            <div className="seccion-perfil">
              <p className="titulo-seccion-perfil">Acerca de mí</p>
              <p className="texto-seccion-perfil">{descripcionMostrada}</p>
              {descripcionLarga && (
                <button className="boton-leer-mas" onClick={() => setDescripcionExpandida((v) => !v)}>
                  {descripcionExpandida ? "Leer menos" : "Leer más"}
                </button>
              )}
            </div>
          )}

          {habilidades.length > 0 && (
            <div className="seccion-perfil">
              <p className="titulo-seccion-perfil">Habilidades y experiencia</p>
              <div className="lista-chips-perfil">
                {habilidades.map((h) => (
                  <span className="chip-perfil" key={h}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {trabajador.trabajos && trabajador.trabajos.length > 0 && (
            <div className="seccion-perfil">
              <p className="titulo-seccion-perfil">Trabajos realizados</p>
              <div className="lista-chips-perfil">
                {trabajador.trabajos.map((t) => (
                  <span className="chip-perfil" key={t}>{t}</span>
                ))}
              </div>
            </div>
          )}

          <button className="boton-agendar-perfil" onClick={() => onAgendar?.(trabajador)}>
            Agendar
          </button>
        </div>
      </div>
    </>
  );
}
