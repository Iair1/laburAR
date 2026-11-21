// Aviso arriba de todo cuando la cuenta todavía no confirmó su email: con eso no se puede
// publicar, mandar solicitudes, propuestas ni mensajes. Permite pedir otro link.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesionUsuario, guardarSesionUsuario } from "../sesion";
import { reenviarLinkEmail } from "../cuentaApi";
import { obtenerMiPerfil } from "../api";

const estilos = `
  .aviso-confirmar-email {
    display: flex; align-items: center; justify-content: center; gap: 10px 14px; flex-wrap: wrap;
    background: #fff8e1; border-bottom: 1px solid #f0dc9a; color: #5c4700; padding: 9px 16px;
    font-size: 0.8rem; line-height: 1.4; text-align: center;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .aviso-confirmar-email strong { color: #3d2f00; }
  .acciones-confirmar-email { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .boton-confirmar-email {
    border-radius: 999px; padding: 5px 12px; font-size: 0.74rem; font-weight: 700; cursor: pointer; font-family: inherit;
    border: 1px solid #b38f00; background: #fff; color: #5c4700;
  }
  .boton-confirmar-email.principal { background: #5c4700; border-color: #5c4700; color: #fff; }
  .boton-confirmar-email:disabled { opacity: 0.6; cursor: wait; }
  .resultado-confirmar-email { font-weight: 700; }
  .resultado-confirmar-email.error { color: #a1261e; }
`;

export default function AvisoConfirmarEmail() {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(() => obtenerSesionUsuario());
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok, texto }

  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    window.addEventListener("storage", actualizar); // si se confirmó en otra pestaña
    return () => {
      window.removeEventListener("laburar-sesion-cambio", actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  const falta = usuario?.emailVerificado === false;

  // Por si lo confirmó desde otro dispositivo: se revisa una vez al entrar
  useEffect(() => {
    if (!falta) return undefined;
    let activo = true;
    obtenerMiPerfil()
      .then((perfil) => {
        if (!activo || !perfil || perfil.email_verificado === false) return;
        const actual = obtenerSesionUsuario();
        if (actual) guardarSesionUsuario({ ...actual, emailVerificado: perfil.email_verificado ?? null, correo: perfil.email || actual.correo });
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [falta]);

  if (!falta) return null;

  const reenviar = async () => {
    setEnviando(true);
    setResultado(null);
    try {
      await reenviarLinkEmail();
      setResultado({ ok: true, texto: "Listo: te mandamos otro link. Revisá también el correo no deseado." });
    } catch (err) {
      setResultado({ ok: false, texto: err.message || "No se pudo mandar. Probá de nuevo en un rato." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="aviso-confirmar-email" role="status">
      <style>{estilos}</style>
      <span>
        ✉️ <strong>Confirmá tu email</strong> para publicar, mandar solicitudes, propuestas y mensajes.
        {usuario.correo ? <> Te mandamos un link a <strong>{usuario.correo}</strong>.</> : null}
      </span>
      {resultado ? (
        <span className={`resultado-confirmar-email ${resultado.ok ? "" : "error"}`}>{resultado.texto}</span>
      ) : (
        <span className="acciones-confirmar-email">
          <button type="button" className="boton-confirmar-email principal" onClick={reenviar} disabled={enviando}>
            {enviando ? "Enviando..." : "Reenviar el link"}
          </button>
          <button type="button" className="boton-confirmar-email" onClick={() => navegar("/mi-cuenta#contacto")}>Cambiar email</button>
        </span>
      )}
    </div>
  );
}
