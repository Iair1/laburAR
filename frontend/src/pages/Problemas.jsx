import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas } from "../estilosProblemas";
import { TarjetaProblema, Icono } from "../componentes/ProblemasUI";
import { DetalleProblemaModal, CancelarCitaModal } from "../componentes/ProblemaModales";
import {
  ProponerModal,
  TarjetaOferta,
  ContraofertaModal,
  RechazarOfertaModal,
  AceptarOfertaModal,
  estilosOfertas,
} from "../componentes/Ofertas";
import { obtenerSesionUsuario, cerrarSesionCompleta, obtenerNotificaciones } from "../sesion";
import { obtenerMisAptitudes, obtenerMiPerfil } from "../api";
import AccionesCita from "../componentes/AccionesCita";
import { usePendientesResenas } from "../usePendientesResenas";
import { CATEGORIAS, normalizarTexto } from "../constantes";
import SelectorZona from "../componentes/SelectorZona";
import { coincideLugar, lugarDesdeParametros, normalizarZona, textoLugar } from "../zonas";
import { obtenerProblemasDisponibles, obtenerMisCitas, cancelarCita } from "../problemasApi";
import {
  obtenerMisPropuestas,
  mandarPropuesta,
  aceptarPropuesta,
  contraofertar,
  rechazarPropuesta,
  estadoDeOferta,
  formatearPesos,
  textoCuando,
} from "../ofertasApi";
import { URGENCIAS, fechasPosibles, hoyStr, sumarDias, fechaLarga, estadoVisible } from "../problemasDatos";

const estilos = `
  .opcion-check { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #222; cursor: pointer; margin-top: 4px; }
  .opcion-check input { accent-color: #7a2a2a; width: 14px; height: 14px; }
  .enlace-filtro { font-size: 0.72rem; color: #570101; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; text-align: left; font-family: inherit; }
  .enlace-filtro:hover { text-decoration: underline; }
  .chips-urgencia-filtro { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .cta-vacio { margin-top: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
  .nota-citas { font-size: 0.74rem; color: #555; margin: -4px 0 12px; }
  .caja-propuesta-enviada {
    border-radius: 10px; padding: 8px 10px; margin-bottom: 12px; font-size: 0.74rem; line-height: 1.45;
    background: #f1f6fc; border: 1px solid #bcd3ef; color: #1d4f8c;
  }
  .caja-propuesta-enviada.responder { background: #fbf1f1; border-color: #e3bcbc; color: #8a0f0f; }
  .caja-propuesta-enviada strong { font-weight: 800; }
  .grupo-propuestas + .grupo-propuestas { margin-top: 1.4rem; }
  .titulo-grupo-propuestas { font-size: 0.78rem; font-weight: 800; color: #3b1e0d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem; }
  .lista-propuestas { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
  .lista-propuestas .oferta + .oferta { margin-top: 0; }
  .titulo-problema-oferta { font-size: 0.9rem; font-weight: 800; color: #1a1a1a; line-height: 1.3; }
  .categoria-problema-oferta { font-size: 0.7rem; color: #777; margin-top: 1px; }
`;

const OPCIONES_FECHA = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Esta Semana" },
  { id: "3dias", etiqueta: "En 3 días" },
  { id: "manual", etiqueta: "Seleccionar fecha" },
];

const OPCIONES_HORARIO = [
  { id: "manana", etiqueta: "Mañana (8:00 - 12:00)" },
  { id: "tarde", etiqueta: "Tarde (13:00 - 17:00)" },
  { id: "noche", etiqueta: "Tarde/Noche (17:00 - 21:00)" },
];

const OPCIONES_ORDEN = [
  { id: "recomendados", etiqueta: "Recomendados para vos" },
  { id: "recientes", etiqueta: "Más recientes" },
  { id: "urgentes", etiqueta: "Más urgentes" },
  { id: "proximos", etiqueta: "Fecha más próxima" },
];

const PESO_URGENCIA = { urgente: 0, semana: 1, flexible: 2 };

export default function Problemas() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const vista = ["citas", "propuestas"].includes(parametros.get("vista")) ? parametros.get("vista") : "problemas";
  const ofertaResaltada = parametros.get("oferta");

  const [usuario] = useState(() => obtenerSesionUsuario());
  const pendientesResenas = usePendientesResenas(Boolean(usuario));
  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  // Zona y barrio elegidos (?zona=CABA&barrio=Palermo) y la zona donde trabaja la persona
  const [lugar, setLugar] = useState(() => lugarDesdeParametros(parametros));
  const filtroZona = lugar.zona;
  const [miZona, setMiZona] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState(CATEGORIAS.includes(parametros.get("categoria")) ? parametros.get("categoria") : "");
  const [soloMisServicios, setSoloMisServicios] = useState(false);
  const [misServicios, setMisServicios] = useState([]);
  const [tarifas, setTarifas] = useState({});
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [fechaManual, setFechaManual] = useState("");
  const [filtroHorario, setFiltroHorario] = useState([]);
  const [orden, setOrden] = useState("recomendados");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [problemas, setProblemas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [problemaViendo, setProblemaViendo] = useState(null);
  const [problemaAgendando, setProblemaAgendando] = useState(null);
  // Responder una propuesta: { tipo: "aceptar" | "contraoferta" | "rechazar", oferta }
  const [respondiendo, setRespondiendo] = useState(null);
  const [citaCancelando, setCitaCancelando] = useState(null);
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
      const [disponibles, misCitas, misPropuestas] = await Promise.all([
        obtenerProblemasDisponibles(),
        obtenerMisCitas(),
        obtenerMisPropuestas().catch(() => []),
      ]);
      setProblemas(disponibles);
      setCitas(misCitas);
      setPropuestas(misPropuestas);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        irAlLogin();
        return;
      }
      setError(err.message || "No se pudieron cargar los problemas. Probá de nuevo.");
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
    // Servicios que ofrece el trabajador (los de "Mis servicios"), para el filtro
    obtenerMisAptitudes()
      .then((lista) => {
        setMisServicios(lista.map((a) => a.aptitud));
        setTarifas(Object.fromEntries(lista.filter((a) => Number(a.cobro_por_hora) > 0).map((a) => [a.aptitud, Number(a.cobro_por_hora)])));
      })
      .catch(() => setMisServicios([]));
    // Su zona: para mostrar primero los problemas cerca y el filtro "Solo en mi zona"
    obtenerMiPerfil()
      .then((perfil) => setMiZona(normalizarZona(perfil?.localidad)))
      .catch(() => setMiZona(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando llega una notificación nueva (alguien respondió una propuesta), se actualiza la pantalla
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

  // Si se llega desde una notificación a una propuesta puntual, se baja hasta ella
  useEffect(() => {
    if (cargando || vista !== "propuestas" || !ofertaResaltada) return undefined;
    const temporizador = setTimeout(() => {
      document.getElementById(`oferta-${ofertaResaltada}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(temporizador);
  }, [cargando, vista, ofertaResaltada]);

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "problemas") siguientes.delete("vista");
    else siguientes.set("vista", nueva);
    siguientes.delete("oferta");
    setParametros(siguientes);
  };

  const limpiarFiltros = () => {
    setConsulta("");
    setLugar({ zona: "", barrio: "" });
    setFiltroCategoria("");
    setSoloMisServicios(false);
    setFiltroUrgencia("");
    setFiltroFecha("");
    setFechaManual("");
    setFiltroHorario([]);
    setOrden("recomendados");
  };

  const coincideTexto = (p, texto) => {
    if (!texto) return true;
    const palabras = texto.split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 3);
    const textoProblema = normalizarTexto([p.titulo, p.descripcion, p.categoria, p.barrio, p.localidad, p.cliente?.nombre].join(" "));
    return textoProblema.includes(texto) || palabras.some((w) => textoProblema.includes(w));
  };

  const resultados = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    const hoy = hoyStr();
    const finSemana = sumarDias(hoy, 6);
    const objetivo =
      filtroFecha === "hoy" ? hoy : filtroFecha === "3dias" ? sumarDias(hoy, 3) : filtroFecha === "manual" ? fechaManual || null : null;
    const filtrados = problemas.filter((p) => {
      const fechas = fechasPosibles(p);
      if (fechas.length === 0) return false; // ya no tiene días para agendar
      if (!coincideTexto(p, texto)) return false;
      if (!coincideLugar({ zona: p.localidad, barrio: p.barrio }, lugar)) return false;
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (soloMisServicios && misServicios.length > 0 && !misServicios.includes(p.categoria)) return false;
      if (filtroUrgencia && p.urgencia !== filtroUrgencia) return false;
      if (filtroFecha === "semana" && !fechas.some((f) => f <= finSemana)) return false;
      if (objetivo && !fechas.includes(objetivo)) return false;
      if (filtroHorario.length > 0 && p.franja && p.franja !== "todo" && !filtroHorario.includes(p.franja)) return false;
      return true;
    });
    const primeraFecha = (p) => fechasPosibles(p)[0] || "9999";
    // "Recomendados": el backend ya los manda por coincidencia con tus servicios; además, los de tu zona primero
    if (orden === "recomendados") {
      if (!miZona) return filtrados;
      return [...filtrados].sort((a, b) => Number(normalizarZona(a.localidad) !== miZona) - Number(normalizarZona(b.localidad) !== miZona));
    }
    return [...filtrados].sort((a, b) => {
      if (orden === "urgentes") return (PESO_URGENCIA[a.urgencia] ?? 3) - (PESO_URGENCIA[b.urgencia] ?? 3) || b.id - a.id;
      if (orden === "proximos") return primeraFecha(a).localeCompare(primeraFecha(b)) || b.id - a.id;
      return b.id - a.id;
    });
  }, [problemas, consulta, lugar, miZona, filtroCategoria, soloMisServicios, misServicios, filtroUrgencia, filtroFecha, fechaManual, filtroHorario, orden]);

  const citasFiltradas = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    return citas
      .filter((c) => coincideTexto(c, texto) && coincideLugar({ zona: c.localidad, barrio: c.barrio }, lugar))
      .sort((a, b) => String(a.dia).localeCompare(String(b.dia)));
  }, [citas, consulta, lugar]);

  const coincidenConMisServicios = problemas.filter((p) => p.coincidencias > 0 && fechasPosibles(p).length > 0).length;
  const proximaCita = citas.map((c) => c.dia).filter((d) => d && d >= hoyStr()).sort()[0];

  // Propuestas: la abierta de cada problema, y los grupos de la pestaña "Mis propuestas"
  const propuestaAbiertaDe = useMemo(
    () => new Map(propuestas.filter((o) => o.estado === "pendiente").map((o) => [o.solicitudid, o])),
    [propuestas]
  );
  const paraResponder = propuestas.filter((o) => o.estado === "pendiente" && !o.vencida && o.turno === "trabajador");
  const esperandoRespuesta = propuestas.filter((o) => o.estado === "pendiente" && !o.vencida && o.turno === "cliente");
  const propuestasAnteriores = propuestas.filter((o) => !paraResponder.includes(o) && !esperandoRespuesta.includes(o));
  const abiertas = paraResponder.length + esperandoRespuesta.length;

  const abrirAgendar = (problema) => {
    setProblemaViendo(null);
    setProblemaAgendando(problema);
  };

  const verPropuesta = (oferta) => {
    setProblemaViendo(null);
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("vista", "propuestas");
    siguientes.set("oferta", String(oferta.id));
    setParametros(siguientes);
  };

  // Los errores de "ya no está disponible" (409) recargan la pantalla
  const manejarError = (err, cerrar) => {
    if (err.status === 401) {
      cerrar?.();
      irAlLogin();
      return true;
    }
    if (err.status === 409) cargar();
    return false;
  };

  const confirmarPropuesta = async (problema, datos) => {
    try {
      await mandarPropuesta({ solicitudid: problema.id, ...datos });
    } catch (err) {
      if (manejarError(err, () => setProblemaAgendando(null))) return;
      throw err;
    }
    setProblemaAgendando(null);
    mostrarToast(`¡Listo! Le mandaste tu propuesta de ${formatearPesos(datos.precio)} a ${problema.cliente?.nombre?.split(" ")[0] || "quien lo publicó"}. Te avisamos cuando responda.`);
    await cargar();
    cambiarVista("propuestas");
  };

  const confirmarAceptar = async (oferta) => {
    try {
      await aceptarPropuesta(oferta.id);
    } catch (err) {
      if (manejarError(err, () => setRespondiendo(null))) return;
      throw err;
    }
    setRespondiendo(null);
    mostrarToast(`¡Cita agendada! ${textoCuando(oferta.dia, oferta.hora)} por ${formatearPesos(oferta.precio)}. Le avisamos a ${oferta.cliente?.nombre?.split(" ")[0] || "el cliente"}.`);
    await cargar();
    cambiarVista("citas");
  };

  const confirmarContraoferta = async (oferta, precio, mensaje) => {
    try {
      await contraofertar(oferta.id, precio, mensaje);
    } catch (err) {
      if (manejarError(err, () => setRespondiendo(null))) return;
      throw err;
    }
    setRespondiendo(null);
    mostrarToast(`Le propusiste ${formatearPesos(precio)}. Te avisamos cuando responda.`);
    await cargar();
  };

  const confirmarRechazo = async (oferta) => {
    try {
      await rechazarPropuesta(oferta.id);
    } catch (err) {
      if (manejarError(err, () => setRespondiendo(null))) return;
      throw err;
    }
    setRespondiendo(null);
    mostrarToast(oferta.turno === "cliente" ? "Retiraste tu propuesta." : "Rechazaste la contraoferta. Le avisamos al cliente.");
    await cargar();
  };

  const confirmarCancelarCita = async (motivo) => {
    setProcesando(true);
    setErrorConfirmar("");
    try {
      await cancelarCita(citaCancelando, motivo);
      setCitaCancelando(null);
      setProblemaViendo(null);
      mostrarToast("Cancelaste la cita. Le avisamos al cliente.");
      await cargar();
    } catch (err) {
      if (err.status === 401) {
        irAlLogin();
        return;
      }
      setErrorConfirmar(err.message || "No se pudo cancelar la cita. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const buscador = (
    <div className="buscador-nav">
      <Icono nombre="lupa" />
      <input
        type="text"
        placeholder={vista === "citas" ? "Buscar en mis citas..." : "Buscá problemas: canilla, pintura, enchufe..."}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      />
<SelectorZona
        valor={lugar}
        onCambio={setLugar}
        claseBoton="select-barrio-nav"
        textoTodas="BARRIO"
        placeholder="BARRIO"
        ariaLabel="Barrio o zona"
        alinearDerecha
      />
    </div>
  );

  if (!usuario) return null;

  const esqueletos = (
    <div className="lista-tarjetas">
      {[0, 1, 2, 3, 4, 5].map((i) => <div className="esqueleto-tarjeta" key={i} />)}
    </div>
  );

  const botonChico = { flex: "none", padding: "7px 18px" };

  const renderProblemas = () => {
    if (cargando) return esqueletos;
    if (error) {
      return (
        <div className="estado-error">
          {error}
          <div className="cta-vacio"><button className="boton-ver-perfil" style={botonChico} onClick={() => { setCargando(true); cargar(); }}>Reintentar</button></div>
        </div>
      );
    }
    return (
      <>
        <p className="resumen-resultados">
          <strong>{resultados.length}</strong> {resultados.length === 1 ? "problema para resolver" : "problemas para resolver"}
          {filtroZona ? <> en <strong>{textoLugar(filtroZona, lugar.barrio)}</strong></> : ""}
        </p>
        {resultados.length === 0 ? (
          <div className="sin-resultados">
            {problemas.length === 0
              ? "Todavía no hay problemas publicados. ¡Volvé a fijarte en un rato!"
              : "No hay problemas con esos filtros. Probá ajustarlos."}
            {problemas.length > 0 && (
              <div className="cta-vacio"><button className="boton-ver-perfil" style={botonChico} onClick={limpiarFiltros}>Limpiar filtros</button></div>
            )}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {resultados.map((p) => {
              const propuesta = propuestaAbiertaDe.get(p.id);
              const estado = propuesta ? estadoDeOferta(propuesta, "trabajador") : null;
              return (
                <TarjetaProblema
                  key={p.id}
                  problema={p}
                  vista="trabajador"
                  extra={
                    propuesta && (
                      <div className={`caja-propuesta-enviada ${estado.meToca ? "responder" : ""}`}>
                        Tu propuesta: <strong>{formatearPesos(propuesta.precio)}</strong> · {estado.etiqueta}
                      </div>
                    )
                  }
                  acciones={
                    <>
                      <button className="boton-ver-perfil" onClick={() => setProblemaViendo(p)}>Ver problema</button>
                      {propuesta ? (
                        <button className="boton-agendar" onClick={() => verPropuesta(propuesta)}>Ver mi propuesta</button>
                      ) : (
                        <button className="boton-agendar" onClick={() => abrirAgendar(p)}>Enviar propuesta</button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </>
    );
  };

  const tarjetaPropuesta = (o) => {
    const problema = problemas.find((p) => p.id === o.solicitudid);
    return (
      <TarjetaOferta
        key={o.id}
        oferta={o}
        rol="trabajador"
        resaltada={String(o.id) === String(ofertaResaltada)}
        titulo={
          <>
            <div className="titulo-problema-oferta">{o.titulo}</div>
            <div className="categoria-problema-oferta">
              {[o.dirigida ? "Pedido directo" : "", o.problema?.categoria, [o.problema?.barrio, o.problema?.localidad].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            </div>
          </>
        }
        onAceptar={(oferta) => setRespondiendo({ tipo: "aceptar", oferta })}
        onContraofertar={(oferta) => setRespondiendo({ tipo: "contraoferta", oferta })}
        onRechazar={(oferta) => setRespondiendo({ tipo: "rechazar", oferta })}
        onMensaje={(otro) => navegar(`/mensajes?con=${encodeURIComponent(otro.id)}`)}
        extraAcciones={
          o.estado === "aceptada" ? (
            <button type="button" className="accion-oferta suave" onClick={() => (o.dirigida ? navegar("/trabajos-pendientes") : cambiarVista("citas"))}>Ver en mis citas</button>
          ) : o.dirigida && o.estado === "pendiente" ? (
            <button type="button" className="accion-oferta suave" onClick={() => navegar("/solicitudes-recibidas")}>Ver el pedido</button>
          ) : problema ? (
            <button type="button" className="accion-oferta suave" onClick={() => setProblemaViendo(problema)}>Ver problema</button>
          ) : null
        }
      />
    );
  };

  const renderPropuestas = () => {
    if (cargando) return esqueletos;
    if (error) return <div className="estado-error">{error}</div>;
    if (propuestas.length === 0) {
      return (
        <div className="sin-resultados">
          Todavía no mandaste propuestas. Elegí un problema y proponé día, hora y precio.
          <div className="cta-vacio">
            <button className="boton-agendar" style={botonChico} onClick={() => cambiarVista("problemas")}>Ver problemas publicados</button>
          </div>
        </div>
      );
    }
    const grupos = [
      ["Te respondieron: te toca a vos", paraResponder],
      ["Esperando respuesta del cliente", esperandoRespuesta],
      ["Anteriores", propuestasAnteriores],
    ].filter(([, lista]) => lista.length > 0);
    return (
      <>
        <p className="resumen-resultados">
          <strong>{abiertas}</strong> {abiertas === 1 ? "propuesta abierta" : "propuestas abiertas"}
          {paraResponder.length > 0 && <> · <strong>{paraResponder.length}</strong> para responder</>}
        </p>
        {grupos.map(([titulo, lista]) => (
          <section className="grupo-propuestas" key={titulo} aria-label={titulo}>
            <h2 className="titulo-grupo-propuestas">{titulo}</h2>
            <div className="lista-propuestas">{lista.map(tarjetaPropuesta)}</div>
          </section>
        ))}
      </>
    );
  };

  const renderCitas = () => {
    if (cargando) return esqueletos;
    if (error) return <div className="estado-error">{error}</div>;
    return (
      <>
        <p className="resumen-resultados">
          <strong>{citasFiltradas.length}</strong> {citasFiltradas.length === 1 ? "cita agendada" : "citas agendadas"}
        </p>
        <p className="nota-citas">
          Los pedidos que te mandan directo a vos siguen en{" "}
          <button className="enlace-filtro" onClick={() => navegar("/trabajos-pendientes")}>Trabajos pendientes</button>.
        </p>
        {citasFiltradas.length === 0 ? (
          <div className="sin-resultados">
            {citas.length === 0 ? "Todavía no agendaste ninguna cita." : "No hay citas con esa búsqueda."}
            {citas.length === 0 && (
              <div className="cta-vacio">
                <button className="boton-agendar" style={botonChico} onClick={() => cambiarVista("problemas")}>Ver problemas publicados</button>
              </div>
            )}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {citasFiltradas.map((c) => {
              const yaPaso = estadoVisible(c) === "terminada";
              return (
                <TarjetaProblema
                  key={c.id}
                  problema={c}
                  vista="cita"
                  extra={
                    <AccionesCita
                      otro={c.cliente}
                      solicitudid={c.id}
                      dia={c.dia}
                      estado={c.estado}
                      pendiente={pendientesResenas.find((x) => x.trabajo === c.id) || null}
                      rolOtro="cliente"
                      onTerminado={() => cargar()}
                    />
                  }
                  acciones={
                    <>
                      <button className="boton-ver-perfil" onClick={() => setProblemaViendo(c)}>Ver problema</button>
                      {!yaPaso && (
                        <button className="boton-agendar" onClick={() => { setErrorConfirmar(""); setCitaCancelando(c); }}>
                          Cancelar cita
                        </button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilosOfertas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav centro={buscador} />

        <div className={`layout-resultados ${filtrosAbiertos ? "filtros-abiertos" : ""}`}>
          <aside className={`panel-filtros ${filtrosAbiertos ? "abierto" : ""}`}>
            {vista === "problemas" ? (
              <>
                <div className="caja-filtro caja-resumen">
                  <div className="categoria-resumen">{filtroCategoria || "Problemas publicados"}:</div>
                  <div className="precio-resumen">{cargando ? "–" : resultados.length}</div>
                  <div className="detalle-resumen">
                    {misServicios.length > 0
                      ? `${coincidenConMisServicios} ${coincidenConMisServicios === 1 ? "coincide" : "coinciden"} con tus servicios`
                      : "Esperando a alguien que los resuelva"}
                  </div>
                  <div className="separador-resumen" />
                  <p className="ayuda-resumen">Elegí un problema y proponé día, hora y precio. Si el cliente acepta, queda la cita agendada</p>
                </div>

                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Zona:</p>
                  <SelectorZona
                    valor={lugar}
                    onCambio={setLugar}
                    claseBoton="select-filtro"
                    textoTodas="Todas las zonas"
                    placeholder="Todas las zonas"
                    ariaLabel="Zona del problema"
                  />
                  {miZona && (
                    <label className="opcion-check">
                      <input
                        type="checkbox"
                        checked={lugar.zona === miZona && !lugar.barrio}
                        onChange={(e) => setLugar(e.target.checked ? { zona: miZona, barrio: "" } : { zona: "", barrio: "" })}
                      />
                      Solo en mi zona ({miZona})
                    </label>
                  )}
                </div>

                <div className="caja-filtro">
                  <label className="etiqueta-filtro" htmlFor="filtro-categoria-problemas">Categoría</label>
                  <select id="filtro-categoria-problemas" className="select-filtro" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                    <option value="">Todas</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {misServicios.length > 0 ? (
                    <label className="opcion-check">
                      <input type="checkbox" checked={soloMisServicios} onChange={(e) => setSoloMisServicios(e.target.checked)} />
                      Solo de mis servicios ({misServicios.join(", ")})
                    </label>
                  ) : (
                    <button className="enlace-filtro" onClick={() => navegar("/ofrecer-servicios")}>
                      Ofrecé tus servicios para ver primero los de tu rubro →
                    </button>
                  )}
                </div>

                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Urgencia:</p>
                  <div className="chips-urgencia-filtro">
                    {Object.entries(URGENCIAS).map(([id, u]) => (
                      <button
                        type="button"
                        key={id}
                        className={`chip-fecha-filtro ${filtroUrgencia === id ? "activo" : ""}`}
                        onClick={() => setFiltroUrgencia(filtroUrgencia === id ? "" : id)}
                      >
                        {u.etiqueta}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Fecha:</p>
                  <div className="grilla-fecha-filtro">
                    {OPCIONES_FECHA.map((op) => (
                      <button
                        type="button"
                        key={op.id}
                        className={`chip-fecha-filtro ${filtroFecha === op.id ? "activo" : ""}`}
                        onClick={() => setFiltroFecha(filtroFecha === op.id ? "" : op.id)}
                      >
                        {op.etiqueta}
                      </button>
                    ))}
                  </div>
                  {filtroFecha === "manual" && (
                    <div className="campo-fecha-manual">
                      <input type="date" min={hoyStr()} value={fechaManual} onChange={(e) => setFechaManual(e.target.value)} aria-label="Fecha" />
                    </div>
                  )}
                </div>

                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Horario de atención</p>
                  <div className="opciones-radio-filtro">
                    {OPCIONES_HORARIO.map((op) => (
                      <label className="opcion-radio-filtro" key={op.id}>
                        <input
                          type="checkbox"
                          checked={filtroHorario.includes(op.id)}
                          onChange={() => setFiltroHorario((prev) => (prev.includes(op.id) ? prev.filter((h) => h !== op.id) : [...prev, op.id]))}
                        />
                        <span className="marca-radio" />
                        {op.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Ordenar por:</p>
                  <div className="opciones-radio-filtro">
                    {OPCIONES_ORDEN.map((op) => (
                      <label className="opcion-radio-filtro" key={op.id}>
                        <input type="radio" name="orden-problemas" checked={orden === op.id} onChange={() => setOrden(op.id)} />
                        <span className="marca-radio" />
                        {op.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : vista === "propuestas" ? (
              <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
                <p className="titulo-caja-filtro">MIS PROPUESTAS</p>
                <div className="contador-solicitudes">{cargando ? "–" : abiertas}</div>
                <p className="ayuda-resumen">{abiertas === 1 ? "propuesta abierta" : "propuestas abiertas"}</p>
                <div className="separador-resumen" />
                <p className="ayuda-resumen">
                  Cuando el cliente te responde, te avisamos. Podés aceptar su precio, hacerle una contraoferta o rechazarla
                </p>
              </div>
            ) : (
              <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
                <p className="titulo-caja-filtro">MIS CITAS</p>
                <div className="contador-solicitudes">{cargando ? "–" : citas.length}</div>
                <p className="ayuda-resumen">
                  {proximaCita ? <>Próxima: <strong>{fechaLarga(proximaCita)}</strong></> : "No tenés citas próximas"}
                </p>
                <div className="separador-resumen" />
                <p className="ayuda-resumen">Si no podés ir, cancelá la cita y le avisamos al cliente</p>
              </div>
            )}

            <button className="boton-limpiar-filtros" onClick={limpiarFiltros}>Limpiar filtros</button>
          </aside>

          <div className="columna-resultados">
            <div className="pestanas-busqueda" role="tablist">
              <button role="tab" aria-selected={vista === "problemas"} className={`pestana-busqueda ${vista === "problemas" ? "activa" : ""}`} onClick={() => cambiarVista("problemas")}>
                Problemas
              </button>
              <button role="tab" aria-selected={vista === "propuestas"} className={`pestana-busqueda ${vista === "propuestas" ? "activa" : ""}`} onClick={() => cambiarVista("propuestas")}>
                Mis propuestas{abiertas > 0 ? ` (${abiertas})` : ""}
              </button>
              <button role="tab" aria-selected={vista === "citas"} className={`pestana-busqueda ${vista === "citas" ? "activa" : ""}`} onClick={() => cambiarVista("citas")}>
                Mis citas{citas.length > 0 ? ` (${citas.length})` : ""}
              </button>
              <button className="boton-mostrar-filtros" onClick={() => setFiltrosAbiertos((v) => !v)}>
                {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
              </button>
            </div>
            {vista === "problemas" ? renderProblemas() : vista === "propuestas" ? renderPropuestas() : renderCitas()}
          </div>
        </div>

        {problemaViendo && (
          <DetalleProblemaModal
            problema={problemaViendo}
            onCerrar={() => setProblemaViendo(null)}
            onAgendar={abrirAgendar}
            propuesta={propuestaAbiertaDe.get(problemaViendo.id) || null}
            onVerPropuesta={verPropuesta}
            onCancelarCita={(c) => { setErrorConfirmar(""); setCitaCancelando(c); }}
            onBloqueado={(clienteId) => setProblemas((lista) => lista.filter((p) => String(p.cliente?.id) !== String(clienteId)))}
          />
        )}
        {problemaAgendando && (
          <ProponerModal
            problema={problemaAgendando}
            tarifa={tarifas[problemaAgendando.categoria] || null}
            onCerrar={() => setProblemaAgendando(null)}
            onConfirmar={(datos) => confirmarPropuesta(problemaAgendando, datos)}
          />
        )}
        {respondiendo?.tipo === "aceptar" && (
          <AceptarOfertaModal oferta={respondiendo.oferta} rol="trabajador" onCerrar={() => setRespondiendo(null)} onConfirmar={confirmarAceptar} />
        )}
        {respondiendo?.tipo === "contraoferta" && (
          <ContraofertaModal oferta={respondiendo.oferta} rol="trabajador" onCerrar={() => setRespondiendo(null)} onConfirmar={confirmarContraoferta} />
        )}
        {respondiendo?.tipo === "rechazar" && (
          <RechazarOfertaModal oferta={respondiendo.oferta} rol="trabajador" onCerrar={() => setRespondiendo(null)} onConfirmar={confirmarRechazo} />
        )}
        {citaCancelando && (
          <CancelarCitaModal
            rol="trabajador"
            texto={`La cita del ${fechaLarga(citaCancelando.dia)}${citaCancelando.hora ? ` a las ${citaCancelando.hora} hs` : ""} se cancela y le avisamos a ${citaCancelando.cliente?.nombre || "el cliente"}.`}
            procesando={procesando}
            error={errorConfirmar}
            onConfirmar={confirmarCancelarCita}
            onCerrar={() => setCitaCancelando(null)}
          />
        )}
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
