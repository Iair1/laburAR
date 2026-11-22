// Datos para confiar en alguien: trabajos hechos, cancelaciones, cuánto tarda en responder,
// desde cuándo está y qué tiene verificado. Se usa en el perfil del trabajador, en las
// propuestas y en el detalle de un problema.
import { useEffect, useState } from "react";
import { obtenerEstadisticas } from "../cuentaApi";

const estilos = `
  .resumen-confianza { display: flex; flex-wrap: wrap; gap: 5px 6px; margin: 2px 0; }
  .resumen-confianza.compacto { gap: 4px; }
  .dato-confianza {
    display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 600; color: #3b1e0d;
    background: #f6f1f1; border: 1px solid #ebe0e0; border-radius: 999px; padding: 3px 9px; white-space: nowrap;
  }
  .dato-confianza.bien { background: #eef8ef; border-color: #cfe9d2; color: #1e5e22; }
  .dato-confianza.atencion { background: #fff6e5; border-color: #f3dcb0; color: #7a4b00; }
`;

/** "menos de 1 hora", "unas horas"... a partir de los minutos */
function textoRespuesta(minutos) {
  if (minutos === null || minutos === undefined) return null;
  if (minutos < 60) return "Responde en menos de 1 hora";
  if (minutos < 180) return "Responde en pocas horas";
  if (minutos < 24 * 60) return "Responde en el día";
  return "Tarda más de un día en responder";
}

function mesAnio(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" }).replace(".", "");
}

/**
 * rol: "trabajador" (muestra sus trabajos y cancelaciones como trabajador) o "cliente".
 * compacto: menos datos (para tarjetas chicas).
 */
export default function ResumenConfianza({ userid, rol = "trabajador", compacto = false }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    if (!userid) return undefined;
    let activo = true;
    obtenerEstadisticas(userid)
      .then((d) => activo && setDatos(d))
      .catch(() => activo && setDatos(null));
    return () => {
      activo = false;
    };
  }, [userid]);

  if (!datos) return null;
  const esTrabajador = rol === "trabajador";
  const trabajos = esTrabajador ? datos.trabajos_como_trabajador : datos.trabajos_como_cliente;
  const citas = esTrabajador ? datos.citas_como_trabajador : datos.citas_como_cliente;
  const cancelo = esTrabajador ? datos.cancelaciones_como_trabajador : datos.cancelaciones_como_cliente;
  const respuesta = textoRespuesta(datos.respuesta_minutos);
  const items = [];

  items.push({
    clave: "trabajos",
    tono: trabajos > 0 ? "bien" : "",
    texto: trabajos > 0
      ? `${trabajos} ${trabajos === 1 ? "trabajo hecho" : "trabajos hechos"}${esTrabajador ? "" : " como cliente"}`
      : esTrabajador ? "Todavía sin trabajos en LaburAR" : "Primer pedido en LaburAR",
  });
  if (citas > 0) {
    items.push(cancelo > 0
      ? { clave: "cancelo", tono: cancelo / citas > 0.2 ? "atencion" : "", texto: `Canceló ${cancelo} de ${citas} ${citas === 1 ? "cita" : "citas"}` }
      : { clave: "cancelo", tono: "bien", texto: "Nunca canceló una cita" });
  }
  if (respuesta) items.push({ clave: "respuesta", tono: datos.respuesta_minutos < 180 ? "bien" : "", texto: respuesta });
  if (!compacto) {
    if (datos.telefono_verificado) items.push({ clave: "tel", tono: "bien", texto: "✓ Teléfono verificado" });
    if (datos.email_verificado) items.push({ clave: "email", tono: "", texto: "✓ Email confirmado" });
    if (datos.miembro_desde) items.push({ clave: "desde", tono: "", texto: `En LaburAR desde ${mesAnio(datos.miembro_desde)}` });
  }

  return (
    <div className={`resumen-confianza ${compacto ? "compacto" : ""}`} aria-label="Datos de confianza">
      <style>{estilos}</style>
      {items.map((it) => <span key={it.clave} className={`dato-confianza ${it.tono}`}>{it.texto}</span>)}
    </div>
  );
}
