import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";

const estilos = `
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
  .nav-derecha { display: flex; align-items: center; gap: 0.4rem; }
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
  .boton-ofrecer {
    background: #1a2332;
    color: #fff;
    border: none;
    padding: 0.5rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .boton-ofrecer:hover { background: #0f1621; }
  .icono-usuario {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: 0.4rem;
  }
  .icono-usuario img {
    width: 32px;
    height: 32px;
    opacity: 0.65;
    transition: opacity 0.15s;
    border-radius: 50%;
  }
  .icono-usuario:hover img { opacity: 1; }

  .contenedor-avatar { position: relative; margin-left: 0.4rem; }
  .avatar-usuario {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid #cfcfcb;
    cursor: pointer;
    display: block;
  }
  .menu-avatar {
    position: absolute;
    top: 42px;
    right: 0;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    min-width: 170px;
    padding: 6px;
    z-index: 50;
  }
  .menu-avatar-nombre {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1a1a1a;
    padding: 8px 10px 4px;
  }
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
  .menu-avatar-item:hover { background: #f0f0ee; }
  .menu-avatar-item.salir { color: #c0392b; }
`;

export default function BarraNav() {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(obtenerSesionUsuario());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const referenciaMenu = useRef(null);

  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    return () => window.removeEventListener("laburar-sesion-cambio", actualizar);
  }, []);

  useEffect(() => {
    const manejarClickAfuera = (e) => {
      if (referenciaMenu.current && !referenciaMenu.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", manejarClickAfuera);
    return () => document.removeEventListener("mousedown", manejarClickAfuera);
  }, []);

  const manejarCerrarSesion = () => {
    cerrarSesionCompleta();
    setMenuAbierto(false);
    navegar("/");
  };

  return (
    <>
      <style>{estilos}</style>
      <header className="barra-nav">
        <div className="logotipo" onClick={() => navegar("/")}>laburAR</div>
        <nav className="nav-derecha">
          {usuario ? (
            <>
              <button className="boton-ofrecer" onClick={() => navegar("/ofrecer-servicios")}>
                Ofrecer servicios
              </button>
              <button className="enlace-nav" onClick={() => navegar("/mensajes")}>
                Bandeja de entrada
              </button>
              <div className="contenedor-avatar" ref={referenciaMenu}>
                <img
                  className="avatar-usuario"
                  src={usuario.fotoPerfilURL || "https://cdn-icons-png.flaticon.com/128/149/149071.png"}
                  alt={usuario.nombre}
                  onClick={() => setMenuAbierto((prev) => !prev)}
                />
                {menuAbierto && (
                  <div className="menu-avatar">
                    <div className="menu-avatar-nombre">{usuario.nombre}</div>
                    <button className="menu-avatar-item" onClick={() => { setMenuAbierto(false); navegar("/ofrecer-servicios"); }}>
                      Ofrecer servicios
                    </button>
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
              <button className="enlace-nav" onClick={() => navegar("/mensajes")}>
                Bandeja de entrada
              </button>
              <button className="icono-usuario" onClick={() => navegar("/login")} aria-label="Iniciar sesión">
                <img src="https://cdn-icons-png.flaticon.com/128/310/310869.png" alt="Iniciar sesión" />
              </button>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
