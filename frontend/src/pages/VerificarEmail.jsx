// /verificar-email?token=... → la página a la que lleva el link del email de confirmación.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { estilosAuth, LogoLaburar } from "./Login";
import { confirmarEmail, reenviarLinkEmail } from "../cuentaApi";
import { obtenerSesionUsuario, guardarSesionUsuario } from "../sesion";

const estilos = `
  .tarjeta-verificar { text-align: center; }
  .icono-verificar { font-size: 2.6rem; line-height: 1; margin: 0.6rem 0 0.4rem; }
  .titulo-verificar { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
  .texto-verificar { font-size: 0.9rem; color: #444; line-height: 1.5; margin-bottom: 1.2rem; }
  .acciones-verificar { display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .boton-verificar {
    background: #570101; color: #fff; border: none; border-radius: 999px; padding: 11px 26px; font-size: 0.92rem;
    font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block;
  }
  .boton-verificar.secundario { background: #fff; color: #570101; border: 1px solid #570101; }
  .boton-verificar:disabled { opacity: 0.6; cursor: wait; }
  .nota-verificar { font-size: 0.8rem; color: #555; margin-top: 0.4rem; }
`;

export default function VerificarEmail() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const token = parametros.get("token") || "";
  const [estado, setEstado] = useState(token ? "cargando" : "error");
  const [mensaje, setMensaje] = useState(token ? "" : "El link no es válido. Pedí uno nuevo desde Mi cuenta.");
  const [reenvio, setReenvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const hecho = useRef(false);
  const usuario = obtenerSesionUsuario();

  useEffect(() => {
    if (!token || hecho.current) return;
    hecho.current = true;
    confirmarEmail(token)
      .then((respuesta) => {
        const actual = obtenerSesionUsuario();
        if (actual && String(actual.id) === String(respuesta.result?.userid)) {
          guardarSesionUsuario({ ...actual, emailVerificado: true });
        }
        setEstado("ok");
      })
      .catch((err) => {
        setEstado("error");
        setMensaje(err.message || "No se pudo confirmar el email. Probá de nuevo.");
      });
  }, [token]);

  const reenviar = async () => {
    setEnviando(true);
    try {
      await reenviarLinkEmail();
      setReenvio("Te mandamos un link nuevo. Revisá tu casilla (y el correo no deseado).");
    } catch (err) {
      if (err.status === 401) {
        navegar("/login?volver=%2Fmi-cuenta");
        return;
      }
      setReenvio(err.message || "No se pudo mandar. Probá de nuevo en un rato.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <style>{estilosAuth}</style>
      <style>{estilos}</style>
      <div className="pagina-auth">
        <div className="contenedor-auth">
        <LogoLaburar onClick={() => navegar("/")} />
        <div className="tarjeta-auth tarjeta-verificar">
          {estado === "cargando" && (
            <>
              <div className="icono-verificar" aria-hidden="true">⏳</div>
              <h1 className="titulo-verificar">Confirmando tu email...</h1>
            </>
          )}
          {estado === "ok" && (
            <>
              <div className="icono-verificar" aria-hidden="true">✅</div>
              <h1 className="titulo-verificar">¡Listo! Confirmaste tu email</h1>
              <p className="texto-verificar">Ya podés publicar problemas, mandar solicitudes, propuestas y mensajes. Te vamos a avisar por email cuando alguien te responda.</p>
              <div className="acciones-verificar">
                {usuario ? (
                  <Link className="boton-verificar" to="/">Ir al inicio</Link>
                ) : (
                  <Link className="boton-verificar" to="/login">Iniciar sesión</Link>
                )}
              </div>
            </>
          )}
          {estado === "error" && (
            <>
              <div className="icono-verificar" aria-hidden="true">⚠️</div>
              <h1 className="titulo-verificar">No pudimos confirmar tu email</h1>
              <p className="texto-verificar">{mensaje}</p>
              <div className="acciones-verificar">
                {usuario ? (
                  <button type="button" className="boton-verificar" onClick={reenviar} disabled={enviando}>
                    {enviando ? "Enviando..." : "Mandarme un link nuevo"}
                  </button>
                ) : (
                  <Link className="boton-verificar" to="/login?volver=%2Fmi-cuenta">Iniciar sesión para pedir otro</Link>
                )}
                <Link className="boton-verificar secundario" to="/">Volver al inicio</Link>
                {reenvio && <p className="nota-verificar" role="status">{reenvio}</p>}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
