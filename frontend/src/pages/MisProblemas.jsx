import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas } from "../estilosProblemas";
import { TarjetaProblema, Icono } from "../componentes/ProblemasUI";
import { DetalleProblemaModal, ConfirmarModal } from "../componentes/ProblemaModales";
import {
  PropuestasModal,
  ContraofertaModal,
  RechazarOfertaModal,
  AceptarOfertaModal,
  estilosOfertas,
} from "../componentes/Ofertas";
import { obtenerSesionUsuario, cerrarSesionCompleta, obtenerNotificaciones } from "../sesion";
import { normalizarTexto } from "../constantes";
import { obtenerMisProblemas, cancelarProblema } from "../problemasApi";
import { obtenerPropuestasRecibidas, aceptarPropuesta, contraofertar, rechazarPropuesta, formatearPesos, textoCuando } from "../ofertasApi";
import { FRANJAS, estadoVisible, fechaLarga } from "../problemasDatos";
import AccionesCita from "../componentes/AccionesCita";
import { usePendientesResenas } from "../usePendientesResenas";

const estilos = `
  .encabezado-mis-problemas {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;
  }
  .boton-subir-problema {
    background: #570101; color: #fff; border: 1px solid #570101; border-radius: 999px; padding: 8px 18px;
    font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .boton-subir-problema:hover { background: #3b1e0d; }
  .aviso-exito-problemas {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: #e8f5e9;
    border: 1px solid #b7dfba; color: #1e5e22; border-radius: 12px; padding: 0.75rem 1rem; font-size: 0.84rem;
    font-weight: 600; margin-bottom: 1rem;
  }
  .aviso-exito-problemas button { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; }
  .caja-estado-problema {
    border-radius: 10px; padding: 8px 10px; margin-bottom: 12px; font-size: 0.74rem; line-height: 1.45;
    background: #fcf8f8; border: 1px solid #ecdede; color: #333;
  }
  .caja-estado-problema strong { color: #570101; }
  .caja-estado-problema.esperando { background: #e8f1fb; border-color: #bcd3ef; color: #1d4f8c; }
  .caja-estado-problema.agendado { background: #f1f9f2; border-color: #b7dfba; color: #1e5e22; }
  .caja-estado-problema.agendado strong { color: #1e5e22; }
  .caja-estado-problema.vencido { background: #fff8e1; border-color: #ffe08a; color: #6b5300; }
  .caja-estado-problema.propuestas { background: #fbf1f1; border-color: #e3bcbc; color: #5a1010; }
  .caja-estado-problema.propuestas strong { color: #8a0f0f; }
  .fila-propuestas { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .boton-ver-propuestas {
    background: #570101; color: #fff; border: 1px solid #570101; border-radius: 999px; padding: 6px 14px;
    font-size: 0.74rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .boton-ver-propuestas:hover { background: #3b1e0d; }
  .boton-ver-propuestas.suave { background: #fff; color: #570101; }
  .boton-ver-propuestas.suave:hover { background: #f6eeee; }
  .insignia-responder {
    display: inline-block; background: #8a0f0f; color: #fff; border-radius: 999px; padding: 1px 8px; font-size: 0.66rem;
    font-weight: 800; margin-left: 4px;
  }
  .vacio-problemas { text-align: center; padding: 2.5rem 1.5rem; background: rgba(255,255,255,0.9); border: 1px solid #ddd; border-radius: 14px; }
  .vacio-problemas h2 { font-size: 1.1rem; color: #1a1a1a; margin-bottom: 6px; }
  .vacio-problemas p { font-size: 0.86rem; color: #555; margin-bottom: 1rem; }
`;

const EN_CURSO = ["por revisar", "vencido", "pendiente"];

export default function MisProblemas() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  // Reseñas que faltan dejar (por id de trabajo)
  const pendientesResenas = usePendientesResenas(Boolean(usuario));
  const vista = parametros.get("vista") === "historial" ? "historial" : "activos";
  const publicado = parametros.get("publicado");
  // ?problema=ID (desde una notificación): abre las propuestas de ese problema
  const problemaPedido = parametros.get("problema");

  const [problemas, setProblemas] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [viendoPropuestasDe, setViendoPropuestasDe] = useState(null);
  // Responder una propuesta: { tipo: "aceptar" | "contraoferta" | "rechazar", oferta }
  const [respondiendo, setRespondiendo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [consulta, setConsulta] = useState("");
  const [toast, setToast] = useState("");
  const [problemaViendo, setProblemaViendo] = useState(null);
  const [problemaCancelando, setProblemaCancelando] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState("");

  const mostrarToast = (texto) => {
    setToast(texto);
    setTimeout(() => setToast(""), 4000);
  };

  const irAlLogin = useCallback(() => {
    cerrarSesionCompleta();
    navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`);
  }, [navegar, ubicacion]);

  const cargar = useCallback(async () => {
    try {
      const [mios, recibidas] = await Promise.all([obtenerMisProblemas(), obtenerPropuestasRecibidas().catch(() => [])]);
      setProblemas(mios);
      setOfertas(recibidas);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        irAlLogin();
        return;
      }
      setError(err.message || "No se pudieron cargar tus problemas.");
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

  // Cuando llega una notificación nueva (una propuesta, una respuesta), se actualiza la pantalla
  useEffect(() => {
    if (!usuario) return undefined;
    let ultima = obtenerNotificaciones().at(-1)?.id;
    const alCambiar = () => {
      const nueva = obtenerNotificaciones().at(-1)?.id;
      if (nueva !== ultima) {
        ultima = nueva;
        cargar();
      }
    };
    window.addEventListener("laburar-notificaciones-cambio", alCambiar);
    return () => window.removeEventListener("laburar-notificaciones-cambio", alCambiar);
  }, [usuario, cargar]);

  // Desde una notificación: si el problema sigue publicado se abren sus propuestas; si no, se baja hasta él
  useEffect(() => {
    if (cargando || !problemaPedido) return undefined;
    const p = problemas.find((x) => String(x.id) === String(problemaPedido));
    if (!p) return undefined;
    const estado = estadoVisible(p);
    if (estado === "por revisar") return undefined; // se abren sus propuestas (ver idPropuestas)
    if (!EN_CURSO.includes(estado) && vista !== "historial") {
      const siguientes = new URLSearchParams(parametros);
      siguientes.set("vista", "historial");
      setParametros(siguientes, { replace: true });
    }
    const temporizador = setTimeout(() => {
      document.getElementById(`problema-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, problemaPedido, problemas]);

  const quitarParametro = (clave) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete(clave);
    setParametros(siguientes, { replace: true });
  };

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "historial") siguientes.set("vista", "historial");
    else siguientes.delete("vista");
    setParametros(siguientes);
  };

  const conEstado = useMemo(() => problemas.map((p) => ({ ...p, estadoMostrado: estadoVisible(p) })), [problemas]);
  const activos = conEstado.filter((p) => EN_CURSO.includes(p.estadoMostrado));
  const historial = conEstado.filter((p) => !EN_CURSO.includes(p.estadoMostrado));
  const texto = normalizarTexto(consulta.trim());
  const listaVista = (vista === "historial" ? historial : activos).filter(
    (p) => !texto || normalizarTexto([p.titulo, p.descripcion, p.categoria, p.trabajador?.nombre].join(" ")).includes(texto)
  );
  const esperando = activos.filter((p) => p.estadoMostrado === "por revisar").length;
  const agendados = activos.filter((p) => p.estadoMostrado === "pendiente").length;
  const problemaPublicado = problemas.find((p) => String(p.id) === String(publicado));

  const volverAPublicar = (p) => navegar("/subir-problema", { state: { copiar: p } });

  const ofertasDe = (problemaId) => ofertas.filter((o) => o.solicitudid === problemaId);
  const abiertasDe = (problemaId) => ofertasDe(problemaId).filter((o) => o.estado === "pendiente" && !o.vencida);
  // Las propuestas abiertas en pantalla: las que se tocaron, o las del problema que pidió la notificación
  const pedido = !cargando && problemaPedido ? problemas.find((p) => String(p.id) === String(problemaPedido)) : null;
  const idPropuestas = viendoPropuestasDe ?? (pedido && estadoVisible(pedido) === "por revisar" ? pedido.id : null);
  const problemaConPropuestas = problemas.find((p) => p.id === idPropuestas) || null;

  const cerrarPropuestas = () => {
    setViendoPropuestasDe(null);
    if (problemaPedido) quitarParametro("problema");
  };

  const manejarError = (err) => {
    if (err.status === 401) {
      setRespondiendo(null);
      irAlLogin();
      return true;
    }
    if (err.status === 409) cargar();
    return false;
  };

  const confirmarAceptar = async (oferta) => {
    try {
      await aceptarPropuesta(oferta.id);
    } catch (err) {
      if (manejarError(err)) return;
      throw err;
    }
    setRespondiendo(null);
    cerrarPropuestas();
    mostrarToast(`¡Listo! Cita agendada con ${oferta.trabajador?.nombre?.split(" ")[0] || "el trabajador"}: ${textoCuando(oferta.dia, oferta.hora)} por ${formatearPesos(oferta.precio)}.`);
    await cargar();
  };

  const confirmarContraoferta = async (oferta, precio, mensaje) => {
    try {
      await contraofertar(oferta.id, precio, mensaje);
    } catch (err) {
      if (manejarError(err)) return;
      throw err;
    }
    setRespondiendo(null);
    mostrarToast(`Le propusiste ${formatearPesos(precio)} a ${oferta.trabajador?.nombre?.split(" ")[0] || "el trabajador"}. Te avisamos cuando responda.`);
    await cargar();
  };

  const confirmarRechazo = async (oferta, eliminarPublicacion) => {
    try {
      await rechazarPropuesta(oferta.id, { eliminarPublicacion });
    } catch (err) {
      if (manejarError(err)) return;
      throw err;
    }
    setRespondiendo(null);
    if (eliminarPublicacion) {
      cerrarPropuestas();
      mostrarToast("Rechazaste la propuesta y eliminaste la publicación.");
    } else {
      mostrarToast("Rechazaste la propuesta. Tu problema sigue publicado.");
    }
    await cargar();
  };

  const pedirCancelar = (p) => {
    setErrorConfirmar("");
    setProblemaCancelando(p);
  };

  const confirmarCancelar = async () => {
    const p = problemaCancelando;
    setProcesando(true);
    setErrorConfirmar("");
    try {
      await cancelarProblema(p);
      setProblemaCancelando(null);
      setProblemaViendo(null);
      mostrarToast(
        p.estado === "pendiente"
          ? `Cancelaste la cita. Le avisamos a ${p.trabajador?.nombre || "el trabajador"}.`
          : "Borraste la publicación. Los trabajadores ya no la ven."
      );
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

  const renderExtra = (p) => {
    const franja = FRANJAS[p.franja];
    switch (p.estadoMostrado) {
      case "por revisar": {
        const abiertas = abiertasDe(p.id);
        const paraResponder = abiertas.filter((o) => o.turno === "cliente").length;
        if (abiertas.length === 0) {
          const anteriores = ofertasDe(p.id).length;
          return (
            <div className="caja-estado-problema esperando">
              <div className="fila-propuestas">
                <span>Esperando propuestas de trabajadores. Te avisamos en la campanita 🔔</span>
                {anteriores > 0 && (
                  <button type="button" className="boton-ver-propuestas suave" onClick={() => setViendoPropuestasDe(p.id)}>
                    Ver anteriores ({anteriores})
                  </button>
                )}
              </div>
            </div>
          );
        }
        const desde = Math.min(...abiertas.map((o) => o.precio));
        return (
          <div className="caja-estado-problema propuestas">
            <div className="fila-propuestas">
              <span>
                <strong>{abiertas.length === 1 ? "1 propuesta" : `${abiertas.length} propuestas`}</strong>
                {abiertas.length > 1 ? ` · desde ${formatearPesos(desde)}` : ` · ${formatearPesos(desde)}`}
                {paraResponder > 0 && <span className="insignia-responder">{paraResponder === 1 ? "1 para responder" : `${paraResponder} para responder`}</span>}
              </span>
              <button type="button" className="boton-ver-propuestas" onClick={() => setViendoPropuestasDe(p.id)}>Ver propuestas</button>
            </div>
          </div>
        );
      }
      case "vencido":
        return (
          <div className="caja-estado-problema vencido">
            Las fechas que elegiste ya pasaron y nadie agendó. Podés volver a publicarlo con fechas nuevas.
          </div>
        );
      case "pendiente":
        return (
          <div className="caja-estado-problema agendado">
            <strong>{p.trabajador?.nombre || "Un trabajador"}</strong> va a ir el <strong>{fechaLarga(p.dia)}</strong>
            {p.hora ? <> a las <strong>{p.hora} hs</strong></> : franja ? ` · ${franja.etiqueta} (${franja.detalle})` : ""}
            {p.precio > 0 && <> · <strong>{formatearPesos(p.precio)}</strong></>}
            <AccionesCita
              otro={p.trabajador}
              solicitudid={p.id}
              dia={p.dia}
              estado={p.estado}
              rolOtro="trabajador"
              onTerminado={cargar}
            />
          </div>
        );
      case "terminada":
        return (
          <div className="caja-estado-problema">
            Trabajo hecho con <strong>{p.trabajador?.nombre || "el trabajador"}</strong> el {fechaLarga(p.dia)}.
            <AccionesCita
              otro={p.trabajador}
              solicitudid={p.id}
              dia={p.dia}
              estado="terminada"
              pendiente={pendientesResenas.find((x) => x.trabajo === p.id) || null}
              rolOtro="trabajador"
            />
          </div>
        );
      default:
        return (
          <div className="caja-estado-problema">
            {p.trabajador ? <>La cita con <strong>{p.trabajador.nombre}</strong> se canceló.</> : "Este problema se canceló."}
          </div>
        );
    }
  };

  const renderAcciones = (p) => {
    const ver = <button className="boton-ver-perfil" onClick={() => setProblemaViendo(p)}>Ver problema</button>;
    switch (p.estadoMostrado) {
      case "por revisar":
        return <>{ver}<button className="boton-agendar" onClick={() => pedirCancelar(p)}>Cancelar publicación</button></>;
      case "pendiente":
        return <>{ver}<button className="boton-agendar" onClick={() => pedirCancelar(p)}>Cancelar cita</button></>;
      case "vencido":
        return (
          <>
            <button className="boton-ver-perfil" onClick={() => pedirCancelar(p)}>Borrar</button>
            <button className="boton-agendar" onClick={() => volverAPublicar(p)}>Volver a publicar</button>
          </>
        );
      default:
        return <>{ver}<button className="boton-agendar" onClick={() => volverAPublicar(p)}>Volver a publicar</button></>;
    }
  };

  const cancelandoCita = problemaCancelando?.estado === "pendiente";

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilosOfertas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav
          centro={
            <div className="buscador-nav" style={{ maxWidth: 360 }}>
              <Icono nombre="lupa" />
              <input type="text" placeholder="Buscar en mis problemas..." value={consulta} onChange={(e) => setConsulta(e.target.value)} />
            </div>
          }
        />

        <div className="layout-resultados">
          <aside className="panel-filtros">
            <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
              <p className="titulo-caja-filtro">MIS PROBLEMAS</p>
              <div className="contador-solicitudes">{cargando ? "–" : activos.length}</div>
              <p className="ayuda-resumen">{activos.length === 1 ? "problema en curso" : "problemas en curso"}</p>
              <div className="separador-resumen" />
              <p className="ayuda-resumen">
                {esperando} esperando propuestas · {agendados} {agendados === 1 ? "cita agendada" : "citas agendadas"}
              </p>
            </div>
            <div className="caja-filtro">
              <p className="titulo-caja-filtro">¿Cómo funciona?</p>
              <p className="ayuda-resumen" style={{ textAlign: "left", fontSize: "0.72rem" }}>
                1. Publicás tu problema con los días que pueden ir.<br />
                2. Los trabajadores te mandan propuestas con día, hora y precio.<br />
                3. Aceptás la que más te sirva, le hacés una contraoferta o la rechazás.<br />
                4. Al aceptar, queda la cita agendada. El pago lo arreglan entre ustedes.
              </p>
            </div>
            <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>+ Subir un problema</button>
          </aside>

          <div className="columna-resultados">
            {publicado && (
              <div className="aviso-exito-problemas" role="status">
                <span>
                  ¡Publicaste tu problema{problemaPublicado ? ` "${problemaPublicado.titulo}"` : ""}! Ya lo ven los trabajadores.
                  Te avisamos cuando te lleguen propuestas.
                </span>
                <button onClick={() => quitarParametro("publicado")} aria-label="Cerrar aviso">✕</button>
              </div>
            )}

            <div className="encabezado-mis-problemas">
              <div className="pestanas-busqueda" role="tablist" style={{ marginBottom: 0 }}>
                <button role="tab" aria-selected={vista === "activos"} className={`pestana-busqueda ${vista === "activos" ? "activa" : ""}`} onClick={() => cambiarVista("activos")}>
                  En curso ({activos.length})
                </button>
                <button role="tab" aria-selected={vista === "historial"} className={`pestana-busqueda ${vista === "historial" ? "activa" : ""}`} onClick={() => cambiarVista("historial")}>
                  Historial ({historial.length})
                </button>
              </div>
              <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>+ Subir un problema</button>
            </div>

            {cargando ? (
              <div className="lista-tarjetas">{[0, 1, 2].map((i) => <div className="esqueleto-tarjeta" key={i} />)}</div>
            ) : error ? (
              <div className="estado-error">{error}</div>
            ) : listaVista.length === 0 ? (
              problemas.length === 0 ? (
                <div className="vacio-problemas">
                  <h2>¿Algo para arreglar en casa?</h2>
                  <p>Subí tu problema en 2 minutos y los trabajadores de la categoría te mandan propuestas con día y precio.</p>
                  <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>Subir mi primer problema</button>
                </div>
              ) : (
                <div className="sin-resultados">
                  {texto
                    ? "No hay problemas con esa búsqueda."
                    : vista === "historial" ? "Todavía no tenés problemas terminados o cancelados." : "No tenés problemas en curso."}
                </div>
              )
            ) : (
              <div className="lista-tarjetas">
                {listaVista.map((p) => (
                  <TarjetaProblema key={p.id} id={`problema-${p.id}`} problema={p} vista="cliente" extra={renderExtra(p)} acciones={renderAcciones(p)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {problemaViendo && (
          <DetalleProblemaModal
            problema={problemaViendo}
            paraCliente
            onCerrar={() => setProblemaViendo(null)}
            onCancelarCita={pedirCancelar}
          />
        )}
        {problemaCancelando && (
          <ConfirmarModal
            titulo={cancelandoCita ? "¿Cancelar la cita?" : "¿Borrar la publicación?"}
            texto={
              cancelandoCita
                ? `Le avisamos a ${problemaCancelando.trabajador?.nombre || "el trabajador"} que no vaya el ${fechaLarga(problemaCancelando.dia)}${problemaCancelando.hora ? ` a las ${problemaCancelando.hora} hs` : ""}.`
                : abiertasDe(problemaCancelando.id).length > 0
                  ? `Los trabajadores ya no lo van a ver y se cierran las ${abiertasDe(problemaCancelando.id).length === 1 ? "propuesta que recibiste" : `${abiertasDe(problemaCancelando.id).length} propuestas que recibiste`}.`
                  : "Los trabajadores ya no lo van a ver."
            }
            textoConfirmar={cancelandoCita ? "Sí, cancelar" : "Sí, borrar"}
            peligro
            procesando={procesando}
            error={errorConfirmar}
            onConfirmar={confirmarCancelar}
            onCerrar={() => setProblemaCancelando(null)}
          />
        )}
        {problemaConPropuestas && (
          <PropuestasModal
            problema={problemaConPropuestas}
            ofertas={ofertasDe(problemaConPropuestas.id)}
            resaltada={null}
            onCerrar={cerrarPropuestas}
            onAceptar={(oferta) => setRespondiendo({ tipo: "aceptar", oferta })}
            onContraofertar={(oferta) => setRespondiendo({ tipo: "contraoferta", oferta })}
            onRechazar={(oferta) => setRespondiendo({ tipo: "rechazar", oferta })}
            onMensaje={(otro) => navegar(`/mensajes?con=${encodeURIComponent(otro.id)}`)}
          />
        )}
        {respondiendo?.tipo === "aceptar" && (
          <AceptarOfertaModal
            oferta={respondiendo.oferta}
            rol="cliente"
            otrasAbiertas={abiertasDe(respondiendo.oferta.solicitudid).length - 1}
            onCerrar={() => setRespondiendo(null)}
            onConfirmar={confirmarAceptar}
          />
        )}
        {respondiendo?.tipo === "contraoferta" && (
          <ContraofertaModal oferta={respondiendo.oferta} rol="cliente" onCerrar={() => setRespondiendo(null)} onConfirmar={confirmarContraoferta} />
        )}
        {respondiendo?.tipo === "rechazar" && (
          <RechazarOfertaModal
            oferta={respondiendo.oferta}
            rol="cliente"
            otrasAbiertas={abiertasDe(respondiendo.oferta.solicitudid).length - 1}
            onCerrar={() => setRespondiendo(null)}
            onConfirmar={confirmarRechazo}
          />
        )}
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
