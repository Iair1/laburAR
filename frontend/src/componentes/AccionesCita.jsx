import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DejarResenaModal, ResenasModal } from "./Resenas";
import { DenunciarModal } from "./Moderacion";
import { terminarTrabajo } from "../resenasApi";
import { cerrarSesionCompleta } from "../sesion";
import { hoyStr } from "../problemasDatos";

const estilos = `
  .acciones-cita { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 0; }
  .accion-cita {
    display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 5px 10px;
    font-size: 0.7rem; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid #d9c8c8;
    background: #fff; color: #3b1e0d; transition: background 0.15s;
  }
  .accion-cita:hover { background: #f4eeee; }
  .accion-cita.destacada { background: #570101; border-color: #570101; color: #fff; }
  .accion-cita.destacada:hover { background: #3b1e0d; }
  .accion-cita.hecho { border-color: #9fd3a5; color: #1e6b2d; background: #f1f9f2; }
  .accion-cita.hecho:hover { background: #e3f3e5; }
  .accion-cita:disabled { opacity: 0.6; cursor: wait; }
  .accion-cita svg { width: 13px; height: 13px; }
  .error-acciones-cita { width: 100%; font-size: 0.7rem; color: #b3261e; font-weight: 600; }
  .confirmar-terminado { width: 100%; font-size: 0.72rem; color: #333; background: #fcf8f8; border: 1px solid #ecdede; border-radius: 10px; padding: 7px 9px; }
  .confirmar-terminado div { display: flex; gap: 6px; margin-top: 6px; }
`;

function IconoChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  );
}

/**
 * Botones de una cita/trabajo con otra persona:
 *  · Mensaje (va al chat)          · Ya está hecho (desde el día de la cita, si sigue agendada)
 *  · Dejar reseña (si terminó y falta la tuya)   · Ver reseñas de la otra persona
 *
 * Props: otro { id, nombre }, solicitudid, dia ("YYYY-MM-DD"), estado ("pendiente", "terminada"...),
 *        pendiente (la reseña pendiente de este trabajo, o null), rolOtro ("trabajador" | "cliente"),
 *        onTerminado() para recargar la pantalla.
 */
export default function AccionesCita({ otro, solicitudid, dia, estado, pendiente = null, rolOtro = "trabajador", onTerminado, conMensaje = true }) {
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [resenando, setResenando] = useState(null);
  const [viendoResenas, setViendoResenas] = useState(false);
  const [reclamando, setReclamando] = useState(false);
  if (!otro?.id) return null;
  const nombre = otro.nombre?.split(" ")[0] || "la otra persona";
  const puedeTerminar = estado === "pendiente" && dia && dia <= hoyStr();
  // Desde el día de la cita (o si ya terminó) se puede reportar un problema con el trabajo
  const puedeReclamar = estado === "terminada" || (dia && dia <= hoyStr() && estado !== "cancelado");

  const terminar = async () => {
    setProcesando(true);
    setError("");
    try {
      await terminarTrabajo(solicitudid);
      setConfirmando(false);
      onTerminado?.();
    } catch (err) {
      if (err.status === 401) {
        cerrarSesionCompleta();
        navegar("/login");
        return;
      }
      setError(err.message || "No se pudo marcar como terminado.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="acciones-cita">
      <style>{estilos}</style>
      {pendiente && (
        <button type="button" className="accion-cita destacada" onClick={() => setResenando(pendiente)}>
          ⭐ Dejar reseña
        </button>
      )}
      {conMensaje && (
        <button type="button" className="accion-cita" onClick={() => navegar(`/mensajes?con=${encodeURIComponent(otro.id)}`)}>
          <IconoChat /> Escribirle a {nombre}
        </button>
      )}
      {puedeTerminar && !confirmando && (
        <button type="button" className="accion-cita hecho" onClick={() => setConfirmando(true)}>
          ✓ Ya está hecho
        </button>
      )}
      <button type="button" className="accion-cita" onClick={() => setViendoResenas(true)}>
        ★ Reseñas de {nombre}
      </button>
      {puedeReclamar && (
        <button type="button" className="accion-cita" onClick={() => setReclamando(true)}>
          ⚑ Reportar un problema
        </button>
      )}
      {confirmando && (
        <div className="confirmar-terminado" role="alert">
          ¿El trabajo ya está terminado? Después los dos pueden dejarse una reseña.
          <div>
            <button type="button" className="accion-cita" onClick={() => setConfirmando(false)} disabled={procesando}>Todavía no</button>
            <button type="button" className="accion-cita hecho" onClick={terminar} disabled={procesando}>
              {procesando ? "Guardando..." : "Sí, está terminado"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="error-acciones-cita" role="alert">{error}</p>}
      {resenando && (
        <DejarResenaModal pendiente={resenando} onCerrar={() => setResenando(null)} onListo={() => setResenando(null)} />
      )}
      {viendoResenas && (
        <ResenasModal userid={otro.id} nombre={otro.nombre} rolInicial={rolOtro} onCerrar={() => setViendoResenas(false)} />
      )}
      {reclamando && (
        <DenunciarModal usuario={otro} que="trabajo" solicitudid={solicitudid} onCerrar={() => setReclamando(false)} />
      )}
    </div>
  );
}
