import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas } from "../estilosProblemas";
import { TarjetaProblema, Icono } from "../componentes/ProblemasUI";
import { DetalleProblemaModal, ConfirmarModal } from "../componentes/ProblemaModales";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { normalizarTexto } from "../constantes";
import { obtenerMisProblemas, cancelarProblema } from "../problemasApi";
import { FRANJAS, estadoVisible, fechaLarga } from "../problemasDatos";

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
  const vista = parametros.get("vista") === "historial" ? "historial" : "activos";
  const publicado = parametros.get("publicado");

  const [problemas, setProblemas] = useState([]);
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
      setProblemas(await obtenerMisProblemas());
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
      case "por revisar":
        return (
          <div className="caja-estado-problema esperando">
            Esperando que un trabajador agende una cita. Te avisamos en la campanita 🔔
          </div>
        );
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
            {franja ? ` · ${franja.etiqueta} (${franja.detalle})` : ""}
          </div>
        );
      case "terminada":
        return (
          <div className="caja-estado-problema">
            Trabajo hecho con <strong>{p.trabajador?.nombre || "el trabajador"}</strong> el {fechaLarga(p.dia)}.
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
                {esperando} esperando un trabajador · {agendados} {agendados === 1 ? "cita agendada" : "citas agendadas"}
              </p>
            </div>
            <div className="caja-filtro">
              <p className="titulo-caja-filtro">¿Cómo funciona?</p>
              <p className="ayuda-resumen" style={{ textAlign: "left", fontSize: "0.72rem" }}>
                1. Publicás tu problema con los días que pueden ir.<br />
                2. Un trabajador elige uno de esos días y agenda una cita.<br />
                3. Te llega el aviso y lo ves acá.
              </p>
            </div>
            <button className="boton-subir-problema" onClick={() => navegar("/subir-problema")}>+ Subir un problema</button>
          </aside>

          <div className="columna-resultados">
            {publicado && (
              <div className="aviso-exito-problemas" role="status">
                <span>
                  ¡Publicaste tu problema{problemaPublicado ? ` "${problemaPublicado.titulo}"` : ""}! Ya lo ven los trabajadores.
                  Te avisamos cuando alguien agende una cita.
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
                  <p>Subí tu problema en 2 minutos y un trabajador de la categoría agenda una cita para arreglarlo.</p>
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
                  <TarjetaProblema key={p.id} problema={p} vista="cliente" extra={renderExtra(p)} acciones={renderAcciones(p)} />
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
                ? `Le avisamos a ${problemaCancelando.trabajador?.nombre || "el trabajador"} que no vaya el ${fechaLarga(problemaCancelando.dia)}.`
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
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
