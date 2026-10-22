import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosTarjetas } from "../estilosTarjetas";
import {
  estilosProblemas,
  TarjetaProblema,
  ChipEstado,
  Iconos,
} from "../componentes/ProblemasUI";
import { DetalleProblemaModal, PresupuestoModal, ConfirmarModal } from "../componentes/ProblemaModales";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { obtenerMisAptitudes } from "../api";
import { ZONAS, CATEGORIAS, normalizarTexto } from "../constantes";
import {
  obtenerProblemasDisponibles,
  obtenerProblema,
  obtenerMisPresupuestos,
  retirarPresupuesto,
  cancelarTrabajoAgendado,
  USA_BACKEND,
} from "../problemasApi";
import {
  URGENCIAS,
  fechasPosibles,
  hoyStr,
  sumarDias,
  formatearPesos,
  fechaCorta,
  fechaLarga,
  estadoVisible,
} from "../problemasDatos";

const estilos = `
  .tarjeta-problema { position: relative; }
  .caja-mi-presupuesto {
    border-radius: 10px; padding: 8px 10px; margin-bottom: 12px; font-size: 0.74rem; line-height: 1.45;
    background: #fcf8f8; border: 1px solid #ecdede; color: #333;
  }
  .caja-mi-presupuesto strong { color: #570101; }
  .caja-mi-presupuesto.aceptado { background: #f1f9f2; border-color: #b7dfba; }
  .fila-caja-presupuesto { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .direccion-caja { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: #1e5e22; font-weight: 600; }
  .direccion-caja svg { width: 12px; height: 12px; }
  .envoltorio-tarjeta { position: relative; display: flex; }
  .envoltorio-tarjeta > .tarjeta-problema { flex: 1; min-width: 0; }
  .marca-enviado {
    position: absolute; top: -9px; right: 14px; z-index: 1; display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.62rem; font-weight: 700; color: #1e6b2d; background: #e6f4ea; border: 1px solid #b7dfba;
    border-radius: 999px; padding: 3px 8px;
  }
  .marca-enviado svg { width: 10px; height: 10px; }
  .opcion-check { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #222; cursor: pointer; margin-top: 4px; }
  .opcion-check input { accent-color: #7a2a2a; width: 14px; height: 14px; }
  .enlace-filtro { font-size: 0.72rem; color: #570101; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; text-align: left; font-family: inherit; }
  .enlace-filtro:hover { text-decoration: underline; }
  .chips-urgencia-filtro { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .cta-vacio { margin-top: 12px; }
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

const PESO_URGENCIA = { urgente: 0, semana: 1, flexible: 2 };

export default function Problemas() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const vista = parametros.get("vista") === "presupuestos" ? "presupuestos" : "problemas";
  const idVer = parametros.get("ver");

  const [usuario] = useState(() => obtenerSesionUsuario());
  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  const [filtroZona, setFiltroZona] = useState(ZONAS.includes(parametros.get("zona")) ? parametros.get("zona") : "");
  const [filtroCategoria, setFiltroCategoria] = useState(CATEGORIAS.includes(parametros.get("categoria")) ? parametros.get("categoria") : "");
  const [soloMisRubros, setSoloMisRubros] = useState(false);
  const [misRubros, setMisRubros] = useState([]);
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [fechaManual, setFechaManual] = useState("");
  const [filtroHorario, setFiltroHorario] = useState([]);
  const [orden, setOrden] = useState("recientes");
  const [filtroPresupuestos, setFiltroPresupuestos] = useState("todos");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [problemas, setProblemas] = useState([]);
  const [misPresupuestos, setMisPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [procesando, setProcesando] = useState(false);

  const [problemaViendo, setProblemaViendo] = useState(null);
  const [problemaPresupuestando, setProblemaPresupuestando] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null); // { tipo: "retirar" | "cancelar", presupuesto }

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
    setError(err.message || "No se pudo cargar. Probá de nuevo.");
  }, [navegar, ubicacion]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [disponibles, mios] = await Promise.all([obtenerProblemasDisponibles(), obtenerMisPresupuestos()]);
      setProblemas(disponibles);
      setMisPresupuestos(mios);
    } catch (err) {
      manejarError(err);
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
    // Rubros del trabajador (los que ofrece en "Mis servicios") para el filtro
    obtenerMisAptitudes()
      .then((lista) => setMisRubros(lista.map((a) => a.aptitud)))
      .catch(() => setMisRubros([]));
    // Si otra pestaña cambia algo (modo local), refrescamos
    const refrescar = (e) => {
      if (!e.key || e.key === "laburar_problemas_v1") cargar();
    };
    window.addEventListener("storage", refrescar);
    return () => window.removeEventListener("storage", refrescar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abrir un problema desde un link (?ver=ID), por ejemplo desde una notificación
  useEffect(() => {
    if (!usuario || !idVer) return;
    obtenerProblema(idVer)
      .then(setProblemaViendo)
      .catch((err) => mostrarToast(err.message || "Ese problema ya no está disponible."));
  }, [usuario, idVer]);

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "presupuestos") siguientes.set("vista", "presupuestos");
    else siguientes.delete("vista");
    siguientes.delete("ver");
    setParametros(siguientes);
  };

  const cerrarDetalle = () => {
    setProblemaViendo(null);
    if (idVer) {
      const siguientes = new URLSearchParams(parametros);
      siguientes.delete("ver");
      setParametros(siguientes, { replace: true });
    }
  };

  const limpiarFiltros = () => {
    setConsulta("");
    setFiltroZona("");
    setFiltroCategoria("");
    setSoloMisRubros(false);
    setFiltroUrgencia("");
    setFiltroFecha("");
    setFechaManual("");
    setFiltroHorario([]);
    setOrden("recientes");
    setFiltroPresupuestos("todos");
  };

  const fechaObjetivo = () => {
    const hoy = hoyStr();
    if (filtroFecha === "hoy") return hoy;
    if (filtroFecha === "3dias") return sumarDias(hoy, 3);
    if (filtroFecha === "manual") return fechaManual || null;
    return null;
  };

  const resultados = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    const palabras = texto.split(/[^a-z0-9ñ]+/).filter((p) => p.length >= 3);
    const objetivo = fechaObjetivo();
    const hoy = hoyStr();
    const finSemana = sumarDias(hoy, 6);
    const filtrados = problemas.filter((p) => {
      if (texto) {
        const textoProblema = normalizarTexto([p.titulo, p.descripcion, p.categoria, p.barrio, p.localidad].join(" "));
        if (!textoProblema.includes(texto) && !palabras.some((w) => textoProblema.includes(w))) return false;
      }
      if (filtroZona && p.localidad !== filtroZona) return false;
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (soloMisRubros && misRubros.length > 0 && !misRubros.includes(p.categoria)) return false;
      if (filtroUrgencia && p.urgencia !== filtroUrgencia) return false;
      const fechas = fechasPosibles(p);
      if (filtroFecha === "semana" && !fechas.some((f) => f <= finSemana)) return false;
      if (objetivo && !fechas.includes(objetivo)) return false;
      if (filtroHorario.length > 0 && p.franja !== "todo" && !filtroHorario.includes(p.franja)) return false;
      return true;
    });
    const primeraFecha = (p) => fechasPosibles(p)[0] || "9999";
    return [...filtrados].sort((a, b) => {
      if (orden === "urgentes") return (PESO_URGENCIA[a.urgencia] ?? 3) - (PESO_URGENCIA[b.urgencia] ?? 3) || String(b.creado).localeCompare(String(a.creado));
      if (orden === "proximos") return primeraFecha(a).localeCompare(primeraFecha(b));
      if (orden === "presupuesto") return (b.presupuestoEstimado ?? -1) - (a.presupuestoEstimado ?? -1);
      return String(b.creado).localeCompare(String(a.creado));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemas, consulta, filtroZona, filtroCategoria, soloMisRubros, misRubros, filtroUrgencia, filtroFecha, fechaManual, filtroHorario, orden]);

  const presupuestosFiltrados = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    return misPresupuestos.filter((pr) => {
      if (filtroPresupuestos === "enviado" && pr.estado !== "enviado") return false;
      if (filtroPresupuestos === "aceptado" && pr.estado !== "aceptado") return false;
      if (filtroPresupuestos === "otros" && (pr.estado === "enviado" || pr.estado === "aceptado")) return false;
      if (texto && !normalizarTexto([pr.problema?.titulo, pr.problema?.categoria, pr.mensaje].join(" ")).includes(texto)) return false;
      if (filtroZona && pr.problema?.localidad !== filtroZona) return false;
      return true;
    });
  }, [misPresupuestos, filtroPresupuestos, consulta, filtroZona]);

  const estimadoPromedio = useMemo(() => {
    const valores = resultados.map((p) => p.presupuestoEstimado).filter((v) => v != null && v > 0);
    return valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : null;
  }, [resultados]);

  const conteoPresupuestos = useMemo(() => ({
    enviado: misPresupuestos.filter((p) => p.estado === "enviado").length,
    aceptado: misPresupuestos.filter((p) => p.estado === "aceptado").length,
  }), [misPresupuestos]);

  const abrirPresupuesto = (problema) => {
    setProblemaViendo(null);
    setProblemaPresupuestando(problema);
  };

  const manejarEnviado = async (presupuesto) => {
    const problema = problemaPresupuestando;
    setProblemaPresupuestando(null);
    mostrarToast(`¡Listo! Le mandaste tu presupuesto de ${formatearPesos(presupuesto.monto)} a ${problema.cliente?.nombre || "el cliente"} 🙌`);
    await cargar();
  };

  const manejarRetirar = (presupuesto) => setConfirmacion({ tipo: "retirar", presupuesto });
  const manejarCancelarTrabajo = (presupuesto) => setConfirmacion({ tipo: "cancelar", presupuesto });

  const confirmarAccion = async () => {
    const { tipo, presupuesto } = confirmacion;
    setProcesando(true);
    try {
      if (tipo === "retirar") {
        await retirarPresupuesto(presupuesto);
        setProblemaViendo(null);
        mostrarToast("Retiraste tu presupuesto. Si querés, podés mandar uno nuevo.");
      } else {
        await cancelarTrabajoAgendado(presupuesto);
        mostrarToast("Cancelaste el trabajo. Le avisamos al cliente.");
      }
      setConfirmacion(null);
      await cargar();
    } catch (err) {
      setConfirmacion(null);
      manejarError(err);
    } finally {
      setProcesando(false);
    }
  };

  const buscador = (
    <div className="buscador-nav">
      {Iconos.lupa}
      <input
        type="text"
        placeholder={vista === "presupuestos" ? "Buscar en mis presupuestos..." : "Buscá problemas: canilla, pintura, enchufe..."}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      />
      <select className="select-barrio-nav" value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} aria-label="Barrio o zona">
        <option value="">BARRIO</option>
        {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
      </select>
    </div>
  );

  if (!usuario) return null;

  const renderEsqueletos = () => (
    <div className="lista-tarjetas">
      {[0, 1, 2, 3, 4, 5].map((i) => <div className="esqueleto-tarjeta" key={i} />)}
    </div>
  );

  const renderProblemas = () => {
    if (cargando) return renderEsqueletos();
    if (error) return <div className="estado-error">{error}</div>;
    return (
      <>
        <p className="resumen-resultados">
          <strong>{resultados.length}</strong> {resultados.length === 1 ? "problema para resolver" : "problemas para resolver"}
          {filtroZona ? <> en <strong>{filtroZona}</strong></> : ""}
        </p>
        {resultados.length === 0 ? (
          <div className="sin-resultados">
            {problemas.length === 0
              ? "Todavía no hay problemas publicados. ¡Volvé a fijarte en un rato!"
              : "No hay problemas con esos filtros. Probá ajustarlos."}
            {problemas.length > 0 && (
              <div className="cta-vacio"><button className="boton-ver-perfil" style={{ flex: "none", padding: "7px 18px" }} onClick={limpiarFiltros}>Limpiar filtros</button></div>
            )}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {resultados.map((p) => {
              const yaEnviado = Boolean(p.miPresupuesto);
              return (
                <div key={p.id} className="envoltorio-tarjeta">
                  {yaEnviado && <span className="marca-enviado">{Iconos.check} Presupuesto enviado</span>}
                  <TarjetaProblema
                    problema={p}
                    acciones={
                      <>
                        <button className="boton-ver-perfil" onClick={() => setProblemaViendo(p)}>Ver problema</button>
                        <button className="boton-agendar" onClick={() => (yaEnviado ? setProblemaViendo(p) : abrirPresupuesto(p))}>
                          {yaEnviado ? "Ver mi presupuesto" : "Enviar presupuesto"}
                        </button>
                      </>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderPresupuestos = () => {
    if (cargando) return renderEsqueletos();
    if (error) return <div className="estado-error">{error}</div>;
    return (
      <>
        <p className="resumen-resultados">
          <strong>{presupuestosFiltrados.length}</strong> {presupuestosFiltrados.length === 1 ? "presupuesto" : "presupuestos"}
        </p>
        {presupuestosFiltrados.length === 0 ? (
          <div className="sin-resultados">
            {misPresupuestos.length === 0 ? (
              <>
                Todavía no mandaste presupuestos.
                <div className="cta-vacio">
                  <button className="boton-agendar" style={{ flex: "none", padding: "7px 18px" }} onClick={() => cambiarVista("problemas")}>
                    Ver problemas publicados
                  </button>
                </div>
              </>
            ) : "No hay presupuestos con esos filtros."}
          </div>
        ) : (
          <div className="lista-tarjetas">
            {presupuestosFiltrados.map((pr) => {
              const problema = pr.problema;
              if (!problema) return null;
              const aceptado = pr.estado === "aceptado";
              const terminado = aceptado && estadoVisible(problema) === "terminada";
              return (
                <TarjetaProblema
                  key={pr.id}
                  problema={problema}
                  extra={
                    <div className={`caja-mi-presupuesto ${aceptado ? "aceptado" : ""}`}>
                      <div className="fila-caja-presupuesto">
                        <span>Tu presupuesto: <strong>{formatearPesos(pr.monto)}</strong></span>
                        <ChipEstado estado={terminado ? "terminada" : pr.estado} tipo={terminado ? "problema" : "presupuesto"} />
                      </div>
                      <div>{aceptado ? "Agendado el " : "Propusiste el "}<strong>{aceptado ? fechaLarga(pr.dia) : fechaCorta(pr.dia)}</strong> a las <strong>{pr.hora} hs</strong></div>
                      {aceptado && problema.direccion && (
                        <div className="direccion-caja">{Iconos.ubicacion}{problema.direccion}</div>
                      )}
                      {aceptado && !problema.direccion && <div>Coordiná la dirección con {problema.cliente?.nombre}.</div>}
                    </div>
                  }
                  acciones={
                    <>
                      <button className="boton-ver-perfil" onClick={() => setProblemaViendo(problema)}>Ver problema</button>
                      {pr.estado === "enviado" && (
                        <button className="boton-agendar" onClick={() => manejarRetirar(pr)} disabled={procesando}>Retirar</button>
                      )}
                      {aceptado && !terminado && problema.estado === "pendiente" && (
                        <button className="boton-agendar" onClick={() => manejarCancelarTrabajo(pr)} disabled={procesando}>Cancelar trabajo</button>
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
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav centro={buscador} />
        {!USA_BACKEND && (
          <div className="aviso-modo-local">
            <span>Modo de prueba: los problemas y presupuestos se guardan en este navegador.</span>
          </div>
        )}

        <div className={`layout-resultados ${filtrosAbiertos ? "filtros-abiertos" : ""}`}>
          <aside className={`panel-filtros ${filtrosAbiertos ? "abierto" : ""}`}>
            {vista === "problemas" ? (
              <>
                <div className="caja-filtro caja-resumen">
                  <div className="categoria-resumen">{filtroCategoria || "Problemas publicados"}:</div>
                  <div className="precio-resumen">{resultados.length}</div>
                  <div className="detalle-resumen">
                    {estimadoPromedio ? `Presupuesto estimado promedio: ${formatearPesos(estimadoPromedio)}` : "Esperando tu presupuesto"}
                  </div>
                  <div className="separador-resumen" />
                  <p className="ayuda-resumen">Mandá tu presupuesto: el cliente elige y le llega tu propuesta de día y horario</p>
                </div>

                <div className="caja-filtro">
                  <label className="etiqueta-filtro">Categoría</label>
                  <select className="select-filtro" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                    <option value="">Todas</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {misRubros.length > 0 ? (
                    <label className="opcion-check">
                      <input type="checkbox" checked={soloMisRubros} onChange={(e) => setSoloMisRubros(e.target.checked)} />
                      Solo de mis servicios ({misRubros.join(", ")})
                    </label>
                  ) : (
                    <button className="enlace-filtro" onClick={() => navegar("/ofrecer-servicios")}>
                      Ofrecé tus servicios para filtrar por tus rubros →
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
                      <input type="date" min={hoyStr()} value={fechaManual} onChange={(e) => setFechaManual(e.target.value)} />
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
                    {[
                      { id: "recientes", etiqueta: "Más recientes" },
                      { id: "urgentes", etiqueta: "Más urgentes" },
                      { id: "proximos", etiqueta: "Fecha más próxima" },
                      { id: "presupuesto", etiqueta: "Mayor presupuesto estimado" },
                    ].map((op) => (
                      <label className="opcion-radio-filtro" key={op.id}>
                        <input type="radio" name="orden-problemas" checked={orden === op.id} onChange={() => setOrden(op.id)} />
                        <span className="marca-radio" />
                        {op.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="caja-filtro caja-resumen" style={{ textAlign: "center" }}>
                  <p className="titulo-caja-filtro">MIS PRESUPUESTOS</p>
                  <div className="contador-solicitudes">{misPresupuestos.length}</div>
                  <p className="ayuda-resumen">
                    {conteoPresupuestos.enviado} esperando respuesta · {conteoPresupuestos.aceptado} {conteoPresupuestos.aceptado === 1 ? "aceptado" : "aceptados"}
                  </p>
                  <div className="separador-resumen" />
                  <p className="ayuda-resumen">Te avisamos en la campanita cuando un cliente responda</p>
                </div>
                <div className="caja-filtro">
                  <p className="titulo-caja-filtro">Mostrar:</p>
                  <div className="opciones-radio-filtro">
                    {[
                      { id: "todos", etiqueta: "Todos" },
                      { id: "enviado", etiqueta: "Esperando respuesta" },
                      { id: "aceptado", etiqueta: "Aceptados (agendados)" },
                      { id: "otros", etiqueta: "No elegidos / cancelados" },
                    ].map((op) => (
                      <label className="opcion-radio-filtro" key={op.id}>
                        <input type="radio" name="filtro-presupuestos" checked={filtroPresupuestos === op.id} onChange={() => setFiltroPresupuestos(op.id)} />
                        <span className="marca-radio" />
                        {op.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button className="boton-limpiar-filtros" onClick={limpiarFiltros}>Limpiar filtros</button>
          </aside>

          <div className="columna-resultados">
            <div className="pestanas-busqueda" role="tablist">
              <button role="tab" aria-selected={vista === "problemas"} className={`pestana-busqueda ${vista === "problemas" ? "activa" : ""}`} onClick={() => cambiarVista("problemas")}>
                Problemas
              </button>
              <button role="tab" aria-selected={vista === "presupuestos"} className={`pestana-busqueda ${vista === "presupuestos" ? "activa" : ""}`} onClick={() => cambiarVista("presupuestos")}>
                Mis presupuestos{conteoPresupuestos.aceptado > 0 ? ` (${conteoPresupuestos.aceptado} ✓)` : ""}
              </button>
              <button className="boton-mostrar-filtros" onClick={() => setFiltrosAbiertos((v) => !v)}>
                {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
              </button>
            </div>
            {vista === "problemas" ? renderProblemas() : renderPresupuestos()}
          </div>
        </div>

        {problemaViendo && (
          <DetalleProblemaModal
            problema={problemaViendo}
            onCerrar={cerrarDetalle}
            onPresupuestar={abrirPresupuesto}
            onRetirar={manejarRetirar}
            procesando={procesando}
          />
        )}
        {problemaPresupuestando && (
          <PresupuestoModal
            problema={problemaPresupuestando}
            onCerrar={() => setProblemaPresupuestando(null)}
            onEnviado={manejarEnviado}
          />
        )}
        {confirmacion && (
          <ConfirmarModal
            titulo={confirmacion.tipo === "retirar" ? "¿Retirar tu presupuesto?" : "¿Cancelar el trabajo?"}
            texto={
              confirmacion.tipo === "retirar"
                ? "El cliente ya no lo va a ver. Después podés mandar uno nuevo si querés."
                : "El trabajo agendado se cancela y le avisamos al cliente."
            }
            textoConfirmar={confirmacion.tipo === "retirar" ? "Sí, retirar" : "Sí, cancelar"}
            peligro
            procesando={procesando}
            onConfirmar={confirmarAccion}
            onCerrar={() => setConfirmacion(null)}
          />
        )}
        {toast && <div className="toast-agendar" role="status">{toast}</div>}
      </div>
    </>
  );
}
