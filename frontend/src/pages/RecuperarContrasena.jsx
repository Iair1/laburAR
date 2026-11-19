import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { estilosAuth, LogoLaburar } from "./Login";
import { pedirCodigoRecuperacion, restablecerContrasena } from "../cuentaApi";

const estilos = `
  .texto-ayuda-auth { font-size: 0.8rem; color: #2b2b2b; line-height: 1.45; margin: -6px 0 14px; text-align: center; }
  .texto-ok-auth {
    font-size: 0.78rem; color: #0f4d1f; background: rgba(255, 255, 255, 0.6); border-radius: 6px;
    padding: 8px 10px; font-weight: 600; margin-bottom: 12px; text-align: center; line-height: 1.4;
  }
  .entrada-codigo-auth { text-align: center; font-size: 1.2rem !important; letter-spacing: 0.4em !important; }
  .enlace-auth-gris { display: block; text-align: center; font-size: 0.78rem; color: #3346c9; font-weight: 600; background: none; border: none; cursor: pointer; margin: 0 auto 6px; font-family: inherit; }
  .enlace-auth-gris:hover { text-decoration: underline; }
`;

/**
 * "Olvidé mi contraseña":
 *  1) la persona pone su email y le llega un código de 6 números
 *  2) pone el código y la contraseña nueva
 */
export default function RecuperarContrasena() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  const pedirCodigo = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Escribí el email con el que te registraste.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const r = await pedirCodigoRecuperacion(email);
      setAviso(r.message || "Si el email está registrado, te mandamos un código.");
      setPaso(2);
    } catch (err) {
      setError(
        err.status === 503
          ? "Por ahora no podemos mandar emails. Escribinos y te ayudamos a recuperar tu cuenta."
          : err.message || "No se pudo mandar el código."
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiar = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) {
      setError("El código tiene 6 números.");
      return;
    }
    if (contrasena.length < 6) {
      setError("La contraseña nueva tiene que tener al menos 6 caracteres.");
      return;
    }
    if (contrasena !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      await restablecerContrasena(email, codigo, contrasena);
      navegar("/login?recuperada=1");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  const conEnter = (accion) => (e) => {
    if (e.key === "Enter" && !cargando) accion();
  };

  return (
    <>
      <style>{estilosAuth}</style>
      <style>{estilos}</style>
      <div className="pagina-auth">
        <div className="contenedor-auth">
          <LogoLaburar onClick={() => navegar("/")} />
          <div className="tarjeta-auth">
            <h1 className="titulo-auth">Recuperar <b>contraseña</b></h1>

            {paso === 1 ? (
              <>
                <p className="texto-ayuda-auth">Escribí el email de tu cuenta y te mandamos un código para crear una contraseña nueva.</p>
                <input
                  className="entrada-auth"
                  type="email"
                  placeholder="EMAIL"
                  aria-label="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={conEnter(pedirCodigo)}
                  disabled={cargando}
                />
                {error && <p className="texto-error-auth" role="alert">{error}</p>}
                <button className="boton-enviar-auth" onClick={pedirCodigo} disabled={cargando}>
                  {cargando ? "Enviando..." : "Mandarme el código"}
                </button>
              </>
            ) : (
              <>
                {aviso && <p className="texto-ok-auth" role="status">{aviso}</p>}
                <input
                  className="entrada-auth entrada-codigo-auth"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  aria-label="Código de 6 números"
                  autoComplete="one-time-code"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  disabled={cargando}
                />
                <input
                  className="entrada-auth"
                  type="password"
                  placeholder="CONTRASEÑA NUEVA (MÍNIMO 6)"
                  aria-label="Contraseña nueva"
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={cargando}
                />
                <input
                  className="entrada-auth"
                  type="password"
                  placeholder="REPETIR CONTRASEÑA"
                  aria-label="Repetir contraseña nueva"
                  autoComplete="new-password"
                  value={repetir}
                  onChange={(e) => setRepetir(e.target.value)}
                  onKeyDown={conEnter(cambiar)}
                  disabled={cargando}
                />
                {error && <p className="texto-error-auth" role="alert">{error}</p>}
                <button className="boton-enviar-auth" onClick={cambiar} disabled={cargando}>
                  {cargando ? "Guardando..." : "Cambiar contraseña"}
                </button>
                <button
                  type="button"
                  className="enlace-auth-gris"
                  onClick={() => {
                    setPaso(1);
                    setCodigo("");
                    setError("");
                  }}
                >
                  No me llegó: mandar otro código
                </button>
              </>
            )}

            <p className="enlace-centro-auth">
              <Link className="enlace-azul-auth" to="/login">Volver a iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
