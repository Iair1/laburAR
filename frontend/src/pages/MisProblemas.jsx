import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas, TarjetaProblema } from "../componentes/ProblemasUI";
import { PresupuestosModal, ConfirmarModal } from "../componentes/ProblemaModales";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { normalizarTexto } from "../constantes";
import {
  obtenerMisProblemas,
  obtenerProblema,
  aceptarPresupuesto,
  rechazarPresupuesto,
  cancelarProblema,
  USA_BACKEND,
} from "../problemasApi";
import { estadoVisible, formatearPesos, fechaLarga } from "../problemasDatos";

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
  .caja-estado-problema.nuevos { background: #e8f1fb; border-color: #bcd3ef; color: #1d4f8c; }
  .caja-estado-problema.nuevos strong { color: #1d4f8c; }
  .caja-estado-problema.agendado { background: #f1f9f2; border-color: #b7dfba; }
  .caja-estado-problema.vencido { background: #fff8e1; border-color: #ffe08a; color: #6b5300; }
  .fila-agendado { display: flex; align-items: center; gap: 8px; }
  .enlace-cancelar {
    background: none; border: none; color: #a1261e; font-size: 0.7rem; font-weight: 600; cursor: pointer; padding: 0;
    margin-top: 4px; font-family: inherit;
  }
  .enlace-cancelar:hover { text-decoration: underline; }
  .vacio-problemas { text-align: center; padding: 2.5rem 1.5rem; background: rgba(255,255,255,0.9); border: 1px solid #ddd; border-radius: 14px; }
  .vacio-problemas h2 { font-size: 1.1rem; color: #1a1a1a; margin-bottom: 6px; }
  .vacio-problemas p { font-size: 0.86rem; color: #555; margin-bottom: 1rem; }
`;

export default function MisProblemas() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  const vista = parametros.get("vista") === "historial" ? "historial" : "activos";
  const publicado = parametros.get("publicado");
  const editado = parametros.get("editado");
  const idVer = parametros.get("ver");

  const [problemas, setProblemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [consulta, setConsulta] = useState("");
  const [toast, setToast] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [problemaPresupuestos, setProblemaPresupuestos] = useState(null);
  const [problemaCancelando, setProblemaCancelando] = useState(null);

  const mostrarToast = (texto) => {
    setToast(texto);
    setTimeout(() => setToast(""), 3500);
  };

  const manejarError = useCallback((err) => {
    if (err.status === 401) {
      cerrarSesionCompleta();
      navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`);
      return;
    }
    setError(err.message || "No se pudieron cargar tus problemas.");
  }, [navegar, ubicacion]);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const lista = await obtenerMisProblemas();
      setProblemas(lista);
      return lista;
    } catch (err) {
      manejarError(err);
      return [];
    } finally {
      setCargando(false);
    }
  }, [manejarError]);

  useEffect(() => {
    if (!usuario) {
      navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`, { replace: true });
      return;
    }
    cargar();
    const refrescar = (e) => {
      if (!e.key || e.key === "laburar_problemas_v1") cargar();
    };
    window.addEventListener("storage", refrescar);
    return () => window.removeEventListener("storage", refrescar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abrir los presupuestos de un problema desde un link (?ver=ID)
  useEffect(() => {
    if (!usuario || !idVer) return;
    obtenerProblema(idVer)
      .then((p) => (p.esMio ? setProblemaPresupuestos(p) : null))
      .catch((err) => mostrarToast(err.message || "No encontramos ese problema."));
  }, [usuario, idVer]);

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
  const activos = conEstado.filter((p) => ["por revisar", "vencido", "pendiente"].includes(p.estadoMostrado));
  const historial = conEstado.filter((p) => ["terminada", "cancelado"].includes(p.estadoMostrado));
  const listaVista = (vista === "historial" ? historial : activos).filter((p) => {
    const texto = normalizarTexto(consulta.trim());
    return !texto || normalizarTexto([p.titulo, p.descripcion, p.categoria].join(" ")).includes(texto);
  });

  const presupuestosParaElegir = activos
    .filter((p) => p.estadoMostrado === "por revisar")
    .reduce((total, p) => total + (p.cantidadPresupuestos || 0), 0);
  const agendados = activos.filter((p) => p.estadoMostrado === "pendiente").length;
  const problemaPublicado = problemas.find((p) => String(p.id) === String(publicado || editado));

  const verPresupuestos = async (problema) => {
    try {
      setProblemaPresupuestos(await obtenerProblema(problema.id));
    } catch (err) {
      manejarError(err);
    }
  };

  const cerrarPresupuestos = () => {
    setProblemaPresupuestos(null);
    if (idVer) quitarParametro("ver");
  };

  const manejarAceptar = async (presupuesto) => {
    setProcesando(true);
    try {
      await aceptarPresupuesto(presupuesto);
      setProblemaPresupuestos(null);
      if (idVer) quitarParametro("ver");
      mostrarToast(`¡Listo! Agendaste con ${presupuesto.trabajador?.nombre} el ${fechaLarga(presupuesto.dia)} a las ${presupuesto.hora} hs`);
      await cargar();
    } catch (err) {
      mostrarToast(err.message || "No se pudo aceptar el presupuesto.");
    } finally {
      setProcesando(false);
    }
  };

  const manejarRechazar = async (presupuesto) => {
    setProcesando(true);
    try {
      await rechazarPresupuesto(presupuesto);
      const lista = await cargar();
      const actualizado = await obtenerProblema(problemaPresupuestos.id).catch(() => null);
      setProblemaPresupuestos(actualizado || lista.find((p) => p.id === problemaPresupuestos.id) || null);
      mostrarToast(`Rechazaste el presupuesto de ${presupuesto.trabajador?.nombre}.`);
    } catch (err) {
      mostrarToast(err.message || "No se pudo rechazar el presupuesto.");
    } finally {
      setProcesando(false);
    }
  };

  const confirmarCancelar = async () => {
    setProcesando(true);
    try {
      await cancelarProblema(problemaCancelando);
      setProblemaCancelando(null);
      mostrarToast("Cancelaste el problema. Avisamos a los trabajadores.");
      await cargar();
    } catch (err) {
      setProblemaCancelando(null);
      mostrarToast(err.message || "No se pudo cancelar.");
    } finally {
      setProcesando(false);
    }
  };

  if (!usuario) return null;

  const renderExtra = (p) => {
    const cantidad = p.cantidadPresupuestos || 0;
    switch (p.estadoMostrado) {
      case "por revisar":
        return (
          <div className={`caja-estado-problema ${cantidad > 0 ? "nuevos" : ""}`}>
            {cantidad > 0
              ? <>Tenés <strong>{cantidad} {cantidad === 1 ? "presupuesto" : "presupuestos"}</strong> para elegir{p.presupuestoMinimo ? <> · desde <strong>{formatearPesos(p.presupuestoMinimo)}</strong></> : ""}</>
              : "Esperando presupuestos. Te avisamos en la campanita 🔔"}
            <div><button className="enlace-cancelar" onClick={() => setProblemaCancelando(p)}>Cancelar publicación</button></div>
          </div>
        );
      case "vencido":
        return (
          <div className="caja-estado-problema vencido">
            Las fechas que elegiste ya pasaron. Editá las fechas para seguir recibiendo presupuestos.
          </div>
        );
      case "pendiente":
        return (
          <div className="caja-estado-problema agendado">
            <div className="fila-agendado">
              <Avatar src={p.agendado?.trabajador?.foto} nombre={p.agendado?.trabajador?.nombre} tamano={28} />
              <span>Agendado con <strong>{p.agendado?.trabajador?.nombre}</strong></span>
            </div>
            <div style={{ marginTop: 4 }}>
              {fechaLarga(p.agendado?.dia)} a las <strong>{p.agendado?.hora} hs</strong>
              {p.agendado?.monto != null ? <> · <strong>{formatearPesos(p.agendado.monto)}</strong></> : ""}
            </div>
            <div><button className="enlace-cancelar" onClick={() => setProblemaCancelando(p)}>Cancelar trabajo</button></div>
          </div>
        );
      case "terminada":
        return (
          <div className="caja-estado-problema">
            Trabajo hecho con <strong>{p.agendado?.trabajador?.nombre || "el trabajador"}</strong> el {fechaLarga(p.agendado?.dia)}.
          </div>
        );
      default:
        return <div className="caja-estado-problema">Este problema fue cancelado.</div>;
    }
  };

  const renderAcciones = (p) => {
    switch (p.estadoMostrado) {
      case "por revisar":
        return (
          <>
            <button className="boton-ver-perfil" onClick={() => navegar(`/subir-problema?editar=${encodeURIComponent(p.id)}`)}>Editar</button>
            <button className="boton-agendar" onClick={() => verPresupuestos(p)}>
              Ver presupuestos{p.cantidadPresupuestos ? ` (${p.cantidadPresupuestos})` : ""}
            </button>
          </>
        );
      case "vencido":
        return (
          <>
            <button className="boton-ver-perfil" onClick={() => setProblemaCancelando(p)}>Cancelar</button>
            <button className="boton-agendar" onClick={() => navegar(`/subir-problema?editar=${encodeURIComponent(p.id)}`)}>Editar fechas</button>
          </>
        );
      case "pendiente":
        return <button className="boton-agendar" onClick={() => verPresupuestos(p)}>Ver presupuestos</button>;
      default:
        return (
          <>
            <button className="boton-ver-perfil" onClick={() => verPresupuestos(p)}>Ver presupuestos</button>
            <button className="boton-agendar" onClick={() => navegar(`/subir-problema?copiar=${encodeURIComponent(p.id)}`)}>Volver a publicar</button>
          </>
        );
    }
  };

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav
          centro={
            <div className="buscador-nav" style={{ maxWidth: 360 }}>
              <svg className="lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <input type="text" placeholder="Buscar en mis problemas..." value={consulta} onChange={(e) => setConsulta(e.target.value)} />
            </div>
          }
        />
        {!USA_BACKEND && (
          <div className="aviso-modo-local">
            <span>Modo de prueba: los problemas y presupuestos se guardan en este navegador.</span>
          </div>
        )}

        <div className="layout-resultados">
          <aside className="panel-filtros">
            <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
              <p className="titulo-caja-filtro">MIS PROBLEMAS</p>
              <div className="contador-solicitudes">{activos.length}</div>
              <p className="ayuda-resumen">{activos.length === 1 ? "problema en curso" : "problemas en curso"}</p>
              <div className="separador-resumen" />
              <p className="ayuda-resumen">
                {presupuestosParaElegir} {presupuestosParaElegir === 1 ? "presupuesto para elegir" : "presupuestos para elegir"} · {agendados} {agendados === 1 ? "agendado" : "agendados"}
              </p>
            </div>
            <div className="caja-filtro">
              <p className="titulo-caja-filtro">¿Cómo funciona?</p>
              <p className="ayuda-resumen" style={{ textAlign: "left", fontSize: "0.72rem" }}>
                1. Publicás tu problema con los días que pueden ir.<br />
                2. Los trabajadores te mandan presupuestos con día y hora.<br />
                3. Elegís el que más te convenga y queda agendado.
              </p>
            </div>
            <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>+ Subir un problema</button>
          </aside>

          <div className="columna-resultados">
            {(publicado || editado) && (
              <div className="aviso-exito-problemas" role="status">
                <span>
                  {editado ? "Guardaste los cambios" : "¡Publicaste tu problema!"}
                  {problemaPublicado ? ` "${problemaPublicado.titulo}"` : ""}. Te avisamos cuando lleguen presupuestos.
                </span>
                <button onClick={() => quitarParametro(publicado ? "publicado" : "editado")} aria-label="Cerrar aviso">✕</button>
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
                  <p>Subí tu problema en 2 minutos y recibí presupuestos de trabajadores de tu zona.</p>
                  <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>Subir mi primer problema</button>
                </div>
              ) : (
                <div className="sin-resultados">
                  {vista === "historial" ? "Todavía no tenés problemas terminados o cancelados." : "No tenés problemas en curso."}
                </div>
              )
            ) : (
              <div className="lista-tarjetas">
                {listaVista.map((p) => (
                  <TarjetaProblema key={p.id} problema={p} mostrarEstado extra={renderExtra(p)} acciones={renderAcciones(p)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {problemaPresupuestos && (
          <PresupuestosModal
            problema={problemaPresupuestos}
            onCerrar={cerrarPresupuestos}
            onAceptar={manejarAceptar}
            onRechazar={manejarRechazar}
            procesando={procesando}
          />
        )}
        {problemaCancelando && (
          <ConfirmarModal
            titulo={problemaCancelando.estadoMostrado === "pendiente" ? "¿Cancelar el trabajo agendado?" : "¿Cancelar la publicación?"}
            texto={
              problemaCancelando.estadoMostrado === "pendiente"
                ? `Le avisamos a ${problemaCancelando.agendado?.trabajador?.nombre || "el trabajador"} que se cancela.`
                : "Los trabajadores ya no lo van a ver y los presupuestos que recibiste se cancelan."
            }
            textoConfirmar="Sí, cancelar"
            peligro
            procesando={procesando}
            onConfirmar={confirmarCancelar}
            onCerrar={() => setProblemaCancelando(null)}
          />
        )}
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
