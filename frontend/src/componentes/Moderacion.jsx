import { useEffect, useRef, useState } from "react";
import { Modal } from "./ProblemasUI";
import { ConfirmarModal } from "./ProblemaModales";
import { estilosProblemas } from "../estilosProblemas";
import { obtenerSesionUsuario } from "../sesion";
import { MOTIVOS_DENUNCIA, denunciarUsuario, bloquearUsuario, desbloquearUsuario } from "../cuentaApi";

const estilos = `
  .menu-moderacion { position: relative; display: inline-flex; }
  .boton-menu-moderacion {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid #e3d3d3; background: #fff; color: #570101;
    font-size: 1.1rem; font-weight: 800; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    font-family: inherit;
  }
  .boton-menu-moderacion:hover { background: #f6eeee; }
  .lista-menu-moderacion {
    position: absolute; right: 0; top: calc(100% + 6px); background: #fff; border: 1px solid #e3d3d3; border-radius: 12px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.14); padding: 6px; min-width: 190px; z-index: 260;
  }
  .lista-menu-moderacion button {
    display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: none; background: none; border-radius: 8px;
    padding: 9px 10px; font-size: 0.84rem; font-weight: 600; color: #2a2222; cursor: pointer; font-family: inherit;
  }
  .lista-menu-moderacion button:hover { background: #f6eeee; }
  .lista-menu-moderacion button.peligro { color: #b3261e; }
  .motivos-denuncia { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0.9rem; }
  .motivo-denuncia {
    display: flex; align-items: center; gap: 10px; border: 1px solid #ddd; border-radius: 10px; padding: 9px 12px;
    font-size: 0.84rem; color: #222; cursor: pointer; background: #fff; text-align: left; font-family: inherit;
  }
  .motivo-denuncia input { accent-color: #570101; width: 16px; height: 16px; flex-shrink: 0; margin: 0; }
  .motivo-denuncia.activo { border-color: #570101; background: #fbf4f4; }
  .fila-bloquear-denuncia { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #333; margin: 0.6rem 0 0.2rem; cursor: pointer; }
  .fila-bloquear-denuncia input { accent-color: #570101; width: 16px; height: 16px; }
  .aviso-911 { font-size: 0.74rem; color: #6b5a5a; background: #f8f3f3; border-radius: 8px; padding: 8px 10px; margin-top: 0.7rem; line-height: 1.4; }
  .listo-denuncia { text-align: center; padding: 0.6rem 0 0.2rem; }
  .listo-denuncia .icono-listo { font-size: 2.2rem; }
  .listo-denuncia p { font-size: 0.88rem; color: #333; line-height: 1.5; margin: 0.5rem 0 0; }
`;

const TITULOS = {
  perfil: (nombre) => `Denunciar a ${nombre}`,
  mensaje: () => "Denunciar este mensaje",
  publicacion: () => "Denunciar esta publicación",
};

/**
 * Formulario para denunciar a un usuario (su perfil, un mensaje o una publicación).
 *  - usuario: { id, nombre }
 *  - que: "perfil" | "mensaje" | "publicacion"
 */
export function DenunciarModal({ usuario, que = "perfil", solicitudid, mensajeid, onCerrar, onBloqueado }) {
  const [motivo, setMotivo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [tambienBloquear, setTambienBloquear] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState("");
  const nombre = usuario?.nombre?.split(" ")[0] || "esta persona";

  const enviar = async () => {
    if (!motivo) {
      setError("Elegí un motivo.");
      return;
    }
    if (motivo === "Otro" && detalle.trim().length < 10) {
      setError("Contanos un poco qué pasó (al menos 10 caracteres).");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await denunciarUsuario({ denunciadoid: usuario.id, motivo, detalle: detalle.trim(), solicitudid, mensajeid });
      setListo("Gracias por avisarnos. Vamos a revisar la denuncia y, si corresponde, tomar medidas. No le avisamos a la otra persona que la denunciaste.");
    } catch (err) {
      if (err.status !== 409) {
        setError(err.message || "No se pudo enviar la denuncia.");
        setEnviando(false);
        return;
      }
      setListo("Ya habías denunciado a esta persona y lo estamos revisando.");
    }
    if (tambienBloquear) {
      try {
        await bloquearUsuario(usuario.id);
        onBloqueado?.();
      } catch {
        /* la denuncia ya se mandó; el bloqueo se puede hacer después */
      }
    }
    setEnviando(false);
  };

  return (
    <Modal etiqueta={TITULOS[que]?.(nombre) || TITULOS.perfil(nombre)} onCerrar={enviando ? undefined : onCerrar} ancho={480}>
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      {listo ? (
        <div className="listo-denuncia" role="status">
          <div className="icono-listo" aria-hidden="true">🛡️</div>
          <h2 className="titulo-modal-grande" style={{ fontSize: "1.2rem", textTransform: "none" }}>Denuncia enviada</h2>
          <p>{listo}</p>
          {tambienBloquear && <p>También bloqueaste a {nombre}.</p>}
          <button className="boton-grande-modal" onClick={onCerrar}>Cerrar</button>
        </div>
      ) : (
        <>
          <h2 className="titulo-modal-grande" style={{ fontSize: "1.2rem", textTransform: "none" }}>
            {(TITULOS[que] || TITULOS.perfil)(nombre)}
          </h2>
          <p className="detalle-modal">Es anónimo: {nombre} no se entera de quién la hizo.</p>
          <div className="motivos-denuncia" role="radiogroup" aria-label="Motivo">
            {MOTIVOS_DENUNCIA.map((m) => (
              <label key={m} className={`motivo-denuncia ${motivo === m ? "activo" : ""}`}>
                <input type="radio" name="motivo-denuncia" value={m} checked={motivo === m} onChange={() => { setMotivo(m); setError(""); }} />
                {m}
              </label>
            ))}
          </div>
          <label className="etiqueta-modal" htmlFor="detalle-denuncia">Contanos qué pasó {motivo === "Otro" ? "" : "(opcional)"}</label>
          <textarea
            id="detalle-denuncia"
            className="textarea-modal"
            maxLength={1000}
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Cuanto más detalle, mejor podemos revisarlo."
          />
          <label className="fila-bloquear-denuncia">
            <input type="checkbox" checked={tambienBloquear} onChange={(e) => setTambienBloquear(e.target.checked)} />
            También bloquear a {nombre}
          </label>
          <p className="aviso-911">Si estás en peligro, llamá al <strong>911</strong>. Esta denuncia no reemplaza una denuncia policial.</p>
          {error && <p className="error-modal" role="alert">{error}</p>}
          <div className="acciones-modal">
            <button className="boton-pill secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
            <button className="boton-pill peligro" onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar denuncia"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/**
 * Botón "⋯" con Denunciar y Bloquear/Desbloquear.
 *  - usuario: { id, nombre }
 *  - bloqueado: si yo ya lo bloqueé (para mostrar "Desbloquear")
 *  - que / solicitudid / mensajeid: qué se denuncia (ver DenunciarModal)
 *  - onCambioBloqueo(bloqueado): después de bloquear o desbloquear
 */
export function MenuModeracion({ usuario, bloqueado = false, que = "perfil", solicitudid, mensajeid, onCambioBloqueo, etiqueta }) {
  const [abierto, setAbierto] = useState(false);
  const [denunciando, setDenunciando] = useState(false);
  const [confirmandoBloqueo, setConfirmandoBloqueo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const referencia = useRef(null);
  const yo = obtenerSesionUsuario();

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (referencia.current && !referencia.current.contains(e.target)) setAbierto(false);
    };
    const conEscape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", conEscape);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", conEscape);
    };
  }, [abierto]);

  // Sin sesión, o si es mi propio perfil, no hay nada que mostrar
  if (!usuario?.id || !yo || !localStorage.getItem("token") || String(yo.id) === String(usuario.id)) return null;
  const nombre = usuario.nombre?.split(" ")[0] || "esta persona";

  const bloquear = async () => {
    setProcesando(true);
    setError("");
    try {
      await bloquearUsuario(usuario.id);
      setConfirmandoBloqueo(false);
      onCambioBloqueo?.(true);
    } catch (err) {
      setError(err.message || "No se pudo bloquear.");
    } finally {
      setProcesando(false);
    }
  };

  const desbloquear = async () => {
    setAbierto(false);
    try {
      await desbloquearUsuario(usuario.id);
      onCambioBloqueo?.(false);
    } catch (err) {
      window.alert(err.message || "No se pudo desbloquear.");
    }
  };

  return (
    <div className="menu-moderacion" ref={referencia}>
      <style>{estilos}</style>
      <button
        type="button"
        className="boton-menu-moderacion"
        aria-label={etiqueta || `Más opciones sobre ${nombre}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(!abierto);
        }}
      >
        ⋯
      </button>
      {abierto && (
        <div className="lista-menu-moderacion" role="menu" onClick={(e) => e.stopPropagation()}>
          <button role="menuitem" className="peligro" onClick={() => { setAbierto(false); setDenunciando(true); }}>
            ⚑ {que === "publicacion" ? "Denunciar publicación" : que === "mensaje" ? "Denunciar mensaje" : "Denunciar"}
          </button>
          {bloqueado ? (
            <button role="menuitem" onClick={desbloquear}>↺ Desbloquear a {nombre}</button>
          ) : (
            <button role="menuitem" onClick={() => { setAbierto(false); setError(""); setConfirmandoBloqueo(true); }}>
              ⊘ Bloquear a {nombre}
            </button>
          )}
        </div>
      )}
      {denunciando && (
        <DenunciarModal
          usuario={usuario}
          que={que}
          solicitudid={solicitudid}
          mensajeid={mensajeid}
          onCerrar={() => setDenunciando(false)}
          onBloqueado={() => onCambioBloqueo?.(true)}
        />
      )}
      {confirmandoBloqueo && (
        <>
          <style>{estilosProblemas}</style>
          <ConfirmarModal
            titulo={`¿Bloquear a ${nombre}?`}
            texto={`No te va a poder escribir ni mandarte solicitudes, y no lo vas a ver en las búsquedas (ni ${nombre} a vos). No le avisamos. Podés desbloquearlo cuando quieras desde Mi cuenta.`}
            textoConfirmar="Bloquear"
            peligro
            procesando={procesando}
            error={error}
            onConfirmar={bloquear}
            onCerrar={() => setConfirmandoBloqueo(false)}
          />
        </>
      )}
    </div>
  );
}
