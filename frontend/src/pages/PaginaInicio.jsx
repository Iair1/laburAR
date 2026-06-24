import { useState } from "react";
import { useNavigate } from "react-router-dom";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-inicio {
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
  .nav-derecha {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
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
  .icono-usuario {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: 0.5rem;
  }
  .icono-usuario img {
    width: 32px;
    height: 32px;
    opacity: 0.65;
    transition: opacity 0.15s;
  }
  .icono-usuario:hover img { opacity: 1; }

  .hero-inicio {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1.5rem 4rem;
  }
  .eslogan-inicio {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin: 0 0 2rem;
    text-align: center;
  }

  .contenedor-busqueda {
    width: 100%;
    max-width: 720px;
  }
  .barra-busqueda {
    display: flex;
    align-items: center;
    background: #ccc;
    border-radius: 999px;
    padding: 0 6px 0 16px;
    height: 52px;
    gap: 8px;
  }
  .icono-lupa {
    width: 18px;
    height: 18px;
    color: #555;
    flex-shrink: 0;
  }
  .campo-busqueda {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.9rem;
    color: #222;
    min-width: 0;
  }
  .campo-busqueda::placeholder { color: #666; }
  .divisor-busqueda {
    width: 1px;
    height: 24px;
    background: #aaa;
    flex-shrink: 0;
  }
  .campo-codigo-postal {
    background: none;
    border: none;
    outline: none;
    font-size: 0.9rem;
    color: #222;
    width: 90px;
    text-align: center;
  }
  .campo-codigo-postal::placeholder { color: #666; }
  .boton-buscar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #888;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .boton-buscar:hover { background: #666; }
  .boton-buscar svg { width: 18px; height: 18px; color: #fff; }

  .seccion-recientes {
    margin-top: 1.25rem;
    width: 100%;
    max-width: 720px;
  }
  .etiqueta-recientes {
    font-size: 0.8rem;
    color: #555;
    margin: 0 0 0.6rem 0.25rem;
  }
  .tarjetas-recientes {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .tarjeta-reciente {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 10px 14px;
    min-width: 180px;
  }
  .icono-tarjeta { font-size: 1.4rem; flex-shrink: 0; }
  .titulo-tarjeta {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  .ubicacion-tarjeta { font-size: 0.75rem; color: #777; }

  .seccion-categorias {
    margin-top: 2.5rem;
    background: #e0e0de;
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    width: 100%;
    max-width: 720px;
  }
  .grilla-categorias {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .boton-categoria {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #d0d0ce;
    border-radius: 10px;
    padding: 16px 20px;
    cursor: pointer;
    min-width: 90px;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }
  .boton-categoria:hover { background: #f0f0ee; border-color: #aaa; }
  .boton-categoria:active { transform: scale(0.97); }
  .icono-categoria {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #1a1a1a;
  }
  .icono-categoria svg { width: 36px; height: 36px; }
  .etiqueta-categoria {
    font-size: 0.78rem;
    font-weight: 500;
    color: #1a1a1a;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .eslogan-inicio { font-size: 1.4rem; }
    .campo-busqueda { font-size: 0.82rem; }
    .tarjetas-recientes { flex-direction: column; }
    .grilla-categorias { gap: 8px; }
    .enlace-nav:first-child { display: none; }
  }
`;

const categorias = [
  {
    id: "jardineria",
    etiqueta: "Jardinería",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 7 7 4 3 6c3 0 5 2 9 6z" />
        <path d="M12 12C12 7 17 4 21 6c-3 0-5 2-9 6z" />
      </svg>
    ),
  },
  {
    id: "mudanza",
    etiqueta: "Mudanza",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: "electricidad",
    etiqueta: "Electricidad",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: "pintura",
    etiqueta: "Pintura",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 0 0-3-3z" />
        <path d="M9 8c-2 2.5-2 5-1 7.5C4.72 7.5 3 5.5 5 3" />
        <path d="M6.56 14.7a2.12 2.12 0 0 0-3 3c-.36 1.5 1 3 2.5 3s3-1.5 3-3a2.12 2.12 0 0 0-2.5-3z" />
      </svg>
    ),
  },
  {
    id: "piletero",
    etiqueta: "Piletero",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 5-3" />
        <path d="M2 12c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 5-3" />
        <path d="M2 18c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 5-3" />
      </svg>
    ),
  },
];

const trabajosRecientes = [
  { id: 1, titulo: "Limpieza de casa", ubicacion: "Acassuso, San Isidro", icono: "🏠" },
  { id: 2, titulo: "Arreglo de plomería", ubicacion: "Belgrano, CABA", icono: "🔧" },
  { id: 3, titulo: "Pintar una casa", ubicacion: "Piñeyro, Avellaneda", icono: "🖌️" },
];

function PaginaInicio() {
  const navegar = useNavigate();
  const [consulta, setConsulta] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const manejarBusqueda = () => {
    if (!consulta.trim()) return;
    navegar(`/buscar?q=${encodeURIComponent(consulta)}&cp=${encodeURIComponent(codigoPostal)}`);
  };

  const manejarTecla = (e) => {
    if (e.key === "Enter") manejarBusqueda();
  };

  const manejarCategoria = (id) => {
    navegar(`/buscar?categoria=${id}`);
  };

  return (
    <>
      <style>{estilos}</style>

      <div className="pagina-inicio">
        <header className="barra-nav">
          <div className="logotipo" onClick={() => navegar("/")}>laburAR</div>
          <nav className="nav-derecha">
            <button className="enlace-nav" onClick={() => navegar("/paso1")}>
              Registrarme como trabajador
            </button>
            <button className="enlace-nav" onClick={() => navegar("/mensajes")}>
              Bandeja de entrada
            </button>
            <button
              className="icono-usuario"
              onClick={() => navegar("/login")}
              aria-label="Iniciar sesión"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/310/310869.png"
                alt="Iniciar sesión"
              />
            </button>
          </nav>
        </header>

        <main className="hero-inicio">
          <h1 className="eslogan-inicio">slogan</h1>

          <div className="contenedor-busqueda">
            <div className="barra-busqueda">
              <svg className="icono-lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="campo-busqueda"
                placeholder="Describí tu proyecto o problema; ¡sé tan detallado como quieras!"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                onKeyDown={manejarTecla}
              />
              <div className="divisor-busqueda" />
              <input
                type="text"
                className="campo-codigo-postal"
                placeholder="Cod. Postal"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                onKeyDown={manejarTecla}
                maxLength={8}
              />
              <button className="boton-buscar" onClick={manejarBusqueda} aria-label="Buscar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </div>

          <div className="seccion-recientes">
            <p className="etiqueta-recientes">Retomá donde lo dejaste:</p>
            <div className="tarjetas-recientes">
              {trabajosRecientes.map((trabajo) => (
                <div key={trabajo.id} className="tarjeta-reciente">
                  <span className="icono-tarjeta">{trabajo.icono}</span>
                  <div>
                    <p className="titulo-tarjeta">{trabajo.titulo}</p>
                    <p className="ubicacion-tarjeta">{trabajo.ubicacion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="seccion-categorias">
            <div className="grilla-categorias">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  className="boton-categoria"
                  onClick={() => manejarCategoria(cat.id)}
                >
                  <span className="icono-categoria">{cat.icono}</span>
                  <span className="etiqueta-categoria">{cat.etiqueta}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default PaginaInicio;
