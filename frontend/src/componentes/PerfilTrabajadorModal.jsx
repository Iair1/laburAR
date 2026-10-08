import { useEffect, useState } from "react";

const estilos = `
  .fondo-modal-perfil {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
    animation: aparecer-fondo-perfil 0.15s ease-out;
  }
  @keyframes aparecer-fondo-perfil { from { opacity: 0; } to { opacity: 1; } }
  .tarjeta-modal-perfil {
    position: relative;
    background: #fff;
    border: 1.5px solid #1a1a1a;
    border-radius: 22px;
    padding: 1.75rem 2rem 1.5rem;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    animation: aparecer-tarjeta-perfil 0.18s ease-out;
  }
  @keyframes aparecer-tarjeta-perfil {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .encabezado-perfil {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 1.2rem;
    padding-right: 18px;
  }
  .fila-identidad-perfil { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .avatar-perfil {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 1px solid #555;
    overflow: hidden;
    flex-shrink: 0;
    background: #eef0ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
  }
  .avatar-perfil img { width: 100%; height: 100%; object-fit: cover; }
  .nombre-perfil { font-size: 1rem; font-weight: 600; color: #1a1a1a; }
  .calificacion-perfil { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; color: #1a1a1a; margin-top: 2px; }
  .estrellas-perfil { display: inline-flex; gap: 1px; }
  .estrellas-perfil svg { width: 11px; height: 11px; }
  .detalle-identidad-perfil {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    color: #444;
    margin-top: 4px;
  }
  .detalle-identidad-perfil svg { width: 11px; height: 11px; color: #570101; flex-shrink: 0; }
  .precio-perfil {
    background: #6b0d0d;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 9px 18px;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .precio-perfil span { font-weight: 600; font-size: 0.85rem; }
  .cerrar-modal-perfil {
    position: absolute;
    top: 12px;
    right: 14px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #666;
    line-height: 1;
    transition: background 0.15s;
  }
  .cerrar-modal-perfil:hover { background: #f0f0ee; color: #1a1a1a; }

  .chips-categoria-perfil { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.1rem; }
  .chip-categoria-perfil {
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    background: #7a2a2a;
    border-radius: 999px;
    padding: 4px 11px;
  }
  .chip-verificado-perfil {
    font-size: 0.7rem;
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
    margin-bottom: 0.35rem;
  }
  .texto-seccion-perfil {
    font-size: 0.8rem;
    color: #333;
    line-height: 1.5;
    white-space: pre-line;
  }
  .boton-leer-mas {
    background: none;
    border: none;
    color: #1a1a1a;
    font-weight: 700;
    font-size: 0.74rem;
    cursor: pointer;
    padding: 0 0 0 4px;
  }

  .lista-chips-perfil { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-perfil {
    font-size: 0.74rem;
    font-weight: 500;
    color: #3b1e0d;
    background: #f4eeee;
    border: 1px solid #e3d3d3;
    border-radius: 999px;
    padding: 4px 11px;
  }

  .boton-agendar-perfil {
    display: block;
    margin: 1.4rem auto 0;
    min-width: 200px;
    padding: 11px 36px;
    background: #6b0d0d;
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.02em;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(87,1,1,0.25);
    transition: background 0.15s, transform 0.1s;
  }
  .boton-agendar-perfil:hover { background: #570101; }
  .boton-agendar-perfil:active { transform: scale(0.98); }

  @media (max-width: 520px) {
    .tarjeta-modal-perfil { padding: 1.5rem 1.2rem 1.25rem; }
    .encabezado-perfil { flex-direction: column; align-items: flex-start; }
  }
`;

const LIMITE_DESCRIPCION = 220;

function EstrellasPerfil({ valor }) {
  const llenas = Math.round(Number(valor) || 0);
  return (
    <span className="estrellas-perfil" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= llenas ? "#e0a100" : "#cfcfcf"}>
          <path d="M12 2l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.1l7.1-.6L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Tarjeta de perfil de un trabajador (lo que se ve al tocar "Ver perfil").
 * Props:
 *  - trabajador: mismo objeto que arma mapearTrabajador() en PaginaBusqueda
 *  - onCerrar(): cierra el modal
 *  - onAgendar(trabajador): el usuario quiere agendar con este trabajador
 */
export default function PerfilTrabajadorModal({ trabajador, onCerrar, onAgendar }) {
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === "Escape") onCerrar?.();
    };
    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

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
        <div
          className="tarjeta-modal-perfil"
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${trabajador.nombre}`}
          onClick={(e) => e.stopPropagation()}
        >
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
                  {trabajador.calificacion > 0 ? trabajador.calificacion.toFixed(1) : "Nuevo"}
                  <EstrellasPerfil valor={trabajador.calificacion} />
                </div>
                {trabajador.zona && (
                  <div className="detalle-identidad-perfil">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    {trabajador.zona}, Arg.
                  </div>
                )}
                {Array.isArray(trabajador.disponibilidad) && trabajador.disponibilidad.length > 0 && (
                  <div className="detalle-identidad-perfil">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" />
                    </svg>
                    Disponible: {trabajador.disponibilidad.join(", ")}
                  </div>
                )}
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

          {descripcion && (
            <div className="seccion-perfil">
              <p className="titulo-seccion-perfil">Acerca de mí:</p>
              <p className="texto-seccion-perfil">
                {descripcionMostrada}
                {descripcionLarga && (
                  <button className="boton-leer-mas" onClick={() => setDescripcionExpandida((v) => !v)}>
                    {descripcionExpandida ? "Leer menos" : "Leer más"}
                  </button>
                )}
              </p>
            </div>
          )}

          {habilidades.length > 0 && (
            <div className="seccion-perfil">
              <p className="titulo-seccion-perfil">Habilidades y experiencias</p>
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
