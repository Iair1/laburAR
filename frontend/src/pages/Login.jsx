import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../api";
import { guardarSesionUsuario, iniciarSesionConGoogleSimulado } from "../sesion";
import logoIcono from "../assets/logo-icono.svg";
import logoTexto from "../assets/logo-texto.svg";

const estilos = `
  * { box-sizing: border-box; }

  .pagina-auth {
    position: relative;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
  }

  /* --- contenedor (logo a la izquierda, tarjeta al lado) --- */
  .contenedor-auth {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 28px;
    width: 100%;
    max-width: 620px;
  }

  /* --- logo --- */
  .logo-laburar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
  }
  .logo-icono { width: 64px; height: auto; display: block; }
  .logo-texto { width: 140px; height: auto; display: block; }

  /* --- tarjeta --- */
  .tarjeta-auth {
    background: #a8a8a8;
    border-radius: 18px;
    padding: 34px 38px 30px;
    width: 420px;
    max-width: 100%;
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .titulo-auth {
    font-size: 1.05rem;
    font-weight: 600;
    color: #232323;
    text-align: center;
    margin: 0 0 20px;
  }
  .titulo-auth b { font-weight: 800; }

  .boton-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 11px 14px;
    background: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #3c3c3c;
    cursor: pointer;
    margin-bottom: 12px;
    transition: background 0.15s;
  }
  .boton-google:hover { background: #f2f2f2; }
  .boton-google:disabled { opacity: 0.6; cursor: not-allowed; }

  .divisor-auth {
    text-align: center;
    font-size: 0.8rem;
    color: #3a3a3a;
    font-weight: 700;
    margin: 0 0 14px;
  }

  .entrada-auth {
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 10px;
    background: #fff;
    border: 1.5px solid transparent;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #4a4a4a;
    letter-spacing: 0.06em;
    outline: none;
    box-sizing: border-box;
  }
  .entrada-auth::placeholder { color: #8a8a8a; }
  .entrada-auth:focus { border-color: #570101; }
  .entrada-auth:disabled { opacity: 0.7; }

  .boton-enviar-auth {
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
    margin: 6px 0 16px;
    transition: background 0.15s;
  }
  .boton-enviar-auth:hover { background: #3b1e0d; }
  .boton-enviar-auth:disabled { opacity: 0.6; cursor: not-allowed; }

  .texto-error-auth {
    font-size: 0.78rem;
    color: #5a0000;
    background: rgba(255, 255, 255, 0.45);
    border-radius: 6px;
    padding: 6px 10px;
    font-weight: 700;
    margin-bottom: 10px;
    text-align: center;
  }

  .enlace-centro-auth { text-align: center; margin: 0 0 6px; font-size: 0.78rem; }
  .enlace-azul-auth { color: #3346c9; font-weight: 600; cursor: pointer; }
  .enlace-azul-auth:hover { text-decoration: underline; }
  .texto-gris-auth { color: #2b2b2b; }
  .enlace-azul-bold-auth { color: #3346c9; font-weight: 800; cursor: pointer; }
  .enlace-azul-bold-auth:hover { text-decoration: underline; }

  @media (max-width: 620px) {
    .contenedor-auth { flex-direction: column; gap: 14px; }
    .logo-icono { width: 44px; }
    .logo-texto { width: 96px; }
    .tarjeta-auth { width: 100%; }
    .pagina-auth { padding-top: 40px; }
  }
`;

function LogoLaburar({ onClick }) {
  return (
    <div className="logo-laburar" onClick={onClick}>
      <img src={logoIcono} alt="" className="logo-icono" />
      <img src={logoTexto} alt="LABURAR" className="logo-texto" />
    </div>
  );
}

export default function Login() {
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();

  const manejarLogin = async () => {
    if (!nombre || !contrasena) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setCargando(true);

    try {
      const respuesta = await iniciarSesion(nombre, contrasena);

      // El backend puede devolver el perfil dentro de "usuario" -- si no,
      // usamos lo que el usuario tipeó para no dejar la sesión incompleta.
      guardarSesionUsuario({
        id: respuesta?.usuario?.id ?? Date.now(),
        nombre: respuesta?.usuario?.nombre_completo || nombre,
        correo: respuesta?.usuario?.correo || "",
        fotoPerfilURL: respuesta?.usuario?.foto_perfil || null,
      });

      navegar("/");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const manejarGoogle = async () => {
    setCargando(true);
    try {
      const perfil = await iniciarSesionConGoogleSimulado();
      guardarSesionUsuario({
        id: `google_${Date.now()}`,
        nombre: perfil.nombre,
        correo: perfil.correo,
        fotoPerfilURL: perfil.fotoPerfilURL,
      });
      navegar("/");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-auth">
        <div className="contenedor-auth">
          <LogoLaburar onClick={() => navegar("/")} />

          <div className="tarjeta-auth">
          <h1 className="titulo-auth">Iniciar sesion en <b>LABURAR</b></h1>

          <button className="boton-google" onClick={manejarGoogle} disabled={cargando}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5c-7.6 0-14.1 4.3-17.4 10.6z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5c-2 1.5-4.6 2.4-7.6 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
            </svg>
            Continuar con Google
          </button>

          <p className="divisor-auth">O</p>

          <input
            className="entrada-auth"
            type="text"
            placeholder="EMAIL/USUARIO"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={cargando}
          />
          <input
            className="entrada-auth"
            type="password"
            placeholder="CONTRASEÑA"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={cargando}
          />

          {error && <p className="texto-error-auth">{error}</p>}

          <button
            className="boton-enviar-auth"
            onClick={manejarLogin}
            disabled={cargando}
          >
            {cargando ? "Iniciando sesión..." : "Iniciar Sesion"}
          </button>

          <p className="enlace-centro-auth">
            <span className="enlace-azul-auth" onClick={() => navegar("/recuperar-contrasena")}>
              Olvide mi contraseña
            </span>
          </p>
          <p className="enlace-centro-auth">
            <span className="texto-gris-auth">No tengo una cuenta </span>
            <span className="enlace-azul-bold-auth" onClick={() => navegar("/paso1")}>
              REGISTARME
            </span>
          </p>
          </div>
        </div>
      </div>
    </>
  );
}
