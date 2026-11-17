import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import AccionesCita from "../componentes/AccionesCita";
import { ConfirmarModal } from "../componentes/ProblemaModales";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas } from "../estilosProblemas";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { pedirAlServidor } from "../servidor";
import { usePendientesResenas } from "../usePendientesResenas";
import { normalizarPeriodo, textoPeriodo, textoDiasSemana, fechaLarga, horaAcordada, horaPreferida, hoyStr } from "../problemasDatos";

// "Mis pedidos": las solicitudes que el usuario (como cliente) le mandó a un trabajador.
//  · Esperando respuesta → GET /solicitudes/misSolicitudes   (cancelar = DELETE /borrarSolicitud)
//  · Aceptados           → GET /solicitudes/serviciosPendientes (cancelar = PUT /cancelarTrabajo)
// (Los problemas publicados para cualquier trabajador están en "Mis problemas".)

const estilos = `
  .contenido-pedidos { max-width: 1120px; margin: 0 auto; padding: 1.5rem 1.5rem 3rem; }
  .encabezado-pedidos { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .titulo-pedidos { font-size: 1.6rem; font-weight: 900; color: #111; text-transform: uppercase; }
  .subtitulo-pedidos { font-size: 0.86rem; color: #444; margin-top: 4px; max-width: 620px; }
  .boton-buscar-pedidos {
    background: #570101; color: #fff; border: 1px solid #570101; border-radius: 999px; padding: 8px 18px;
    font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .boton-buscar-pedidos:hover { background: #3b1e0d; }
  .caja-estado-pedido { border-radius: 10px; padding: 8px 10px; margin-bottom: 12px; font-size: 0.74rem; line-height: 1.45; }
  .caja-estado-pedido.esperando { background: #e8f1fb; border: 1px solid #bcd3ef; color: #1d4f8c; }
  .caja-estado-pedido.aceptado { background: #f1f9f2; border: 1px solid #b7dfba; color: #1e5e22; }
  .caja-estado-pedido strong { font-weight: 800; }
  .vacio-pedidos { text-align: center; padding: 2.5rem 1.5rem; background: rgba(255,255,255,0.92); border: 1px solid #ddd; border-radius: 14px; }
  .vacio-pedidos h2 { font-size: 1.05rem; color: #1a1a1a; margin-bottom: 6px; }
  .vacio-pedidos p { font-size: 0.84rem; color: #555; margin-bottom: 1rem; }
  @media (max-width: 640px) { .contenido-pedidos { padding: 1rem 1rem 2.5rem; } .titulo-pedidos { font-size: 1.3rem; } }
`;

function separarTexto(texto) {
  let resto = String(texto || "");
  const hora = horaPreferida(resto);
  resto = resto.replace(/^Horario preferido:[^.]*\.\s*/i, "");
  const barrio = (resto.match(/^Barrio:\s*([^.]*)\.\s*/i) || [])[1] || "";
  resto = resto.replace(/^Barrio:[^.]*\.\s*/i, "").replace(/\nHora acordada:.*$/m, "").trim();
  return { descripcion: resto, horaPreferida: hora, barrio };
}

function aPedido(fila) {
  const [inicio, fin] = normalizarPeriodo(fila.periodo);
  const { descripcion, horaPreferida: preferida, barrio } = separarTexto(fila.solicitud);
  return {
    id: fila.id,
    estado: fila.estado,
    dirigida: fila.dirigida,
    descripcion,
    preferida,
    hora: horaAcordada(fila.solicitud),
    barrio,
    zona: fila.localidad || "",
    inicio,
    fin,
    periodo: fila.periodo,
    diassemana: fila.diassemana,
    aptitud: fila.aptitud || "",
    trabajador: {
      id: fila.trabajadorid,
      nombre: fila.nombre_completo,
      foto: fila.foto_perfil || null,
      puntuacion: fila.puntuacion_trabajador != null ? Number(fila.puntuacion_trabajador) : null,
    },
  };
}

export default function MisPedidos() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  const vista = parametros.get("vista") === "aceptados" ? "aceptados" : "esperando";
  const [esperando, setEsperando] = useState([]);
  const [aceptados, setAceptados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState("");
  const [toast, setToast] = useState("");
  const pendientesResenas = usePendientesResenas(Boolean(usuario));

  const irAlLogin = useCallback(() => {
    cerrarSesionCompleta();
    navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`);
  }, [navegar, ubicacion]);

  const cargar = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        pedirAlServidor("/solicitudes/misSolicitudes"),
        pedirAlServidor("/solicitudes/serviciosPendientes"),
      ]);
      setEsperando((a.result || []).map(aPedido));
      // Los problemas abiertos que agendó un trabajador se ven en "Mis problemas"
      setAceptados((b.result || []).filter((f) => f.dirigida !== false).map(aPedido));
      setError("");
    } catch (err) {
      if (err.status === 401) irAlLogin();
      else setError(err.message || "No se pudieron cargar tus pedidos.");
    } finally {
      setCargando(false);
    }
  }, [irAlLogin]);

  useEffect(() => {
    if (!usuario) {
      navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`, { replace: true });
      return;
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "aceptados") siguientes.set("vista", "aceptados");
    else siguientes.delete("vista");
    setParametros(siguientes);
  };

  const confirmarCancelar = async () => {
    const p = cancelando;
    setProcesando(true);
    setErrorConfirmar("");
    try {
      if (p.estado === "pendiente") await pedirAlServidor("/solicitudes/cancelarTrabajo", "PUT", { solicitudid: p.id });
      else await pedirAlServidor("/solicitudes/borrarSolicitud", "DELETE", { solicitudid: p.id });
      setCancelando(null);
      setToast(p.estado === "pendiente" ? `Cancelaste la cita. Le avisamos a ${p.trabajador.nombre}.` : "Cancelaste el pedido.");
      setTimeout(() => setToast(""), 3500);
      await cargar();
    } catch (err) {
      if (err.status === 401) {
        irAlLogin();
        return;
      }
      setErrorConfirmar(err.message || "No se pudo cancelar. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  if (!usuario) return null;
  const lista = vista === "aceptados" ? aceptados : esperando;

  const renderTarjeta = (p) => {
    const aceptado = p.estado === "pendiente";
    const yaPaso = aceptado && p.fin && p.fin < hoyStr();
    return (
      <div className="tarjeta-trabajador" key={p.id}>
        <div className="cabecera-tarjeta">
          <div className="imagen-trabajador"><Avatar src={p.trabajador.foto} nombre={p.trabajador.nombre} /></div>
          <div className="identidad-trabajador">
            <span className="nombre-trabajador" title={p.trabajador.nombre}>{p.trabajador.nombre}</span>
            <div className="fila-calificacion">
              <span className="numero-calificacion">{p.trabajador.puntuacion > 0 ? `★ ${p.trabajador.puntuacion.toFixed(1)}` : "Nuevo"}</span>
            </div>
            <div className="subtexto-calificacion">{p.aptitud || "Servicio"}</div>
          </div>
        </div>
        <ul className="lista-meta-tarjeta">
          <li className="item-meta-tarjeta" title={p.descripcion}><span className="texto-recortado">{p.descripcion || "Sin descripción"}</span></li>
          <li className="item-meta-tarjeta">📍 {[p.barrio, p.zona].filter(Boolean).join(", ") || "Sin zona"}</li>
          {!aceptado && (
            <li className="item-meta-tarjeta">
              📅 {textoPeriodo(p.periodo)} · {textoDiasSemana(p.diassemana)}{p.preferida ? ` · prefiere ${p.preferida} hs` : ""}
            </li>
          )}
        </ul>
        {aceptado ? (
          <div className="caja-estado-pedido aceptado">
            {p.inicio === p.fin ? (
              <>
                {yaPaso ? "Fue el " : "Va a ir el "}<strong>{fechaLarga(p.inicio)}</strong>
                {p.hora ? <> a las <strong>{p.hora} hs</strong></> : null}
              </>
            ) : (
              <>Aceptó tu pedido: va entre el <strong>{fechaLarga(p.inicio)}</strong> y el <strong>{fechaLarga(p.fin)}</strong></>
            )}
            <AccionesCita
              otro={p.trabajador}
              solicitudid={p.id}
              dia={p.inicio}
              estado={p.estado}
              pendiente={pendientesResenas.find((x) => x.trabajo === p.id) || null}
              rolOtro="trabajador"
              onTerminado={cargar}
            />
          </div>
        ) : (
          <div className="caja-estado-pedido esperando">
            Esperando que {p.trabajador.nombre?.split(" ")[0]} acepte y elija el día.
            <AccionesCita otro={p.trabajador} solicitudid={p.id} estado={p.estado} rolOtro="trabajador" />
          </div>
        )}
        <div className="acciones-tarjeta">
          <button className="boton-agendar" onClick={() => { setErrorConfirmar(""); setCancelando(p); }}>
            {aceptado ? "Cancelar cita" : "Cancelar pedido"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav />
        <main className="contenido-pedidos">
          <div className="encabezado-pedidos">
            <div>
              <h1 className="titulo-pedidos">Mis pedidos</h1>
              <p className="subtitulo-pedidos">
                Las solicitudes que le mandaste a un trabajador. Cuando acepta, elige el día y la hora y te llega el aviso.
                Los problemas que publicaste para cualquier trabajador están en <button className="boton-texto-resenas" style={{ background: "none", border: "none", color: "#570101", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={() => navegar("/mis-problemas")}>Mis problemas</button>.
              </p>
            </div>
            <button className="boton-buscar-pedidos" onClick={() => navegar("/buscar")}>+ Buscar un trabajador</button>
          </div>

          <div className="pestanas-busqueda" role="tablist" style={{ marginBottom: "1rem" }}>
            <button role="tab" aria-selected={vista === "esperando"} className={`pestana-busqueda ${vista === "esperando" ? "activa" : ""}`} onClick={() => cambiarVista("esperando")}>
              Esperando respuesta ({esperando.length})
            </button>
            <button role="tab" aria-selected={vista === "aceptados"} className={`pestana-busqueda ${vista === "aceptados" ? "activa" : ""}`} onClick={() => cambiarVista("aceptados")}>
              Aceptados ({aceptados.length})
            </button>
          </div>

          {cargando ? (
            <div className="lista-tarjetas">{[0, 1, 2].map((i) => <div className="esqueleto-tarjeta" key={i} />)}</div>
          ) : error ? (
            <div className="estado-error">{error}</div>
          ) : lista.length === 0 ? (
            <div className="vacio-pedidos">
              <h2>{vista === "aceptados" ? "Todavía no te aceptaron ningún pedido" : "No tenés pedidos esperando respuesta"}</h2>
              <p>Buscá un trabajador, mirá su perfil y sus reseñas, y tocá "Agendar" para mandarle tu pedido.</p>
              <button className="boton-buscar-pedidos" onClick={() => navegar("/buscar")}>Buscar trabajadores</button>
            </div>
          ) : (
            <div className="lista-tarjetas">{lista.map(renderTarjeta)}</div>
          )}
        </main>

        {cancelando && (
          <ConfirmarModal
            titulo={cancelando.estado === "pendiente" ? "¿Cancelar la cita?" : "¿Cancelar el pedido?"}
            texto={
              cancelando.estado === "pendiente"
                ? `Le avisamos a ${cancelando.trabajador.nombre} que no vaya.`
                : `${cancelando.trabajador.nombre} ya no lo va a ver.`
            }
            textoConfirmar="Sí, cancelar"
            peligro
            procesando={procesando}
            error={errorConfirmar}
            onConfirmar={confirmarCancelar}
            onCerrar={() => setCancelando(null)}
          />
        )}
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
