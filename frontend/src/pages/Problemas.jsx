import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosTarjetas } from "../estilosTarjetas";
import { estilosProblemas } from "../estilosProblemas";
import { TarjetaProblema, Icono } from "../componentes/ProblemasUI";
import { DetalleProblemaModal, AgendarCitaModal, ConfirmarModal } from "../componentes/ProblemaModales";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { obtenerMisAptitudes } from "../api";
import { ZONAS, CATEGORIAS, normalizarTexto } from "../constantes";
import { obtenerProblemasDisponibles, obtenerMisCitas, agendarCita, cancelarCita } from "../problemasApi";
import { URGENCIAS, fechasPosibles, hoyStr, sumarDias, fechaLarga, estadoVisible } from "../problemasDatos";

const estilos = `
  .opcion-check { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #222; cursor: pointer; margin-top: 4px; }
  .opcion-check input { accent-color: #7a2a2a; width: 14px; height: 14px; }
  .enlace-filtro { font-size: 0.72rem; color: #570101; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; text-align: left; font-family: inherit; }
  .enlace-filtro:hover { text-decoration: underline; }
  .chips-urgencia-filtro { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .cta-vacio { margin-top: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
  .nota-citas { font-size: 0.74rem; color: #555; margin: -4px 0 12px; }
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
  const vista = parametros.get("vista") === "citas" ? "citas" : "problemas";

  const [usuario] = useState(() => obtenerSesionUsuario());
  const [consulta, setConsulta] = useState(parametros.get("q") || "");
  const [filtroZona, setFiltroZona] = useState(ZONAS.includes(parametros.get("zona")) ? parametros.get("zona") : "");
  const [filtroCategoria, setFiltroCategoria] = useState(CATEGORIAS.includes(parametros.get("categoria")) ? parametros.get("categoria") : "");
  const [soloMisServicios, setSoloMisServicios] = useState(false);
  const [misServicios, setMisServicios] = useState([]);
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [fechaManual, setFechaManual] = useState("");
  const [filtroHorario, setFiltroHorario] = useState([]);
  const [orden, setOrden] = useState("recomendados");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const [problemas, setProblemas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [problemaViendo, setProblemaViendo] = useState(null);
  const [problemaAgendando, setProblemaAgendando] = useState(null);
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
      const [disponibles, misCitas] = await Promise.all([obtenerProblemasDisponibles(), obtenerMisCitas()]);
      setProblemas(disponibles);
      setCitas(misCitas);
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
      .then((lista) => setMisServicios(lista.map((a) => a.aptitud)))
      .catch(() => setMisServicios([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarVista = (nueva) => {
    const siguientes = new URLSearchParams(parametros);
    if (nueva === "citas") siguientes.set("vista", "citas");
    else siguientes.delete("vista");
    setParametros(siguientes);
  };

  const limpiarFiltros = () => {
    setConsulta("");
    setFiltroZona("");
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
      if (filtroZona && p.localidad !== filtroZona) return false;
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (soloMisServicios && misServicios.length > 0 && !misServicios.includes(p.categoria)) return false;
      if (filtroUrgencia && p.urgencia !== filtroUrgencia) return false;
      if (filtroFecha === "semana" && !fechas.some((f) => f <= finSemana)) return false;
      if (objetivo && !fechas.includes(objetivo)) return false;
      if (filtroHorario.length > 0 && p.franja && p.franja !== "todo" && !filtroHorario.includes(p.franja)) return false;
      return true;
    });
    const primeraFecha = (p) => fechasPosibles(p)[0] || "9999";
    if (orden === "recomendados") return filtrados; // el backend ya los manda por coincidencia con tus servicios
    return [...filtrados].sort((a, b) => {
      if (orden === "urgentes") return (PESO_URGENCIA[a.urgencia] ?? 3) - (PESO_URGENCIA[b.urgencia] ?? 3) || b.id - a.id;
      if (orden === "proximos") return primeraFecha(a).localeCompare(primeraFecha(b)) || b.id - a.id;
      return b.id - a.id;
    });
  }, [problemas, consulta, filtroZona, filtroCategoria, soloMisServicios, misServicios, filtroUrgencia, filtroFecha, fechaManual, filtroHorario, orden]);

  const citasFiltradas = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    return citas
      .filter((c) => coincideTexto(c, texto) && (!filtroZona || c.localidad === filtroZona))
      .sort((a, b) => String(a.dia).localeCompare(String(b.dia)));
  }, [citas, consulta, filtroZona]);

  const coincidenConMisServicios = problemas.filter((p) => p.coincidencias > 0 && fechasPosibles(p).length > 0).length;
  const proximaCita = citas.map((c) => c.dia).filter((d) => d && d >= hoyStr()).sort()[0];

  const abrirAgendar = (problema) => {
    setProblemaViendo(null);
    setProblemaAgendando(problema);
  };

  const confirmarCita = async (problema, dia, hora) => {
    try {
      await agendarCita(problema.id, dia, hora);
    } catch (err) {
      if (err.status === 401) {
        setProblemaAgendando(null);
        irAlLogin();
        return;
      }
      if (err.noDisponible) cargar();
      throw err;
    }
    setProblemaAgendando(null);
    mostrarToast(`¡Cita agendada para el ${fechaLarga(dia)} a las ${hora} hs! Le avisamos a ${problema.cliente?.nombre || "quien lo publicó"}.`);
    await cargar();
    cambiarVista("citas");
  };

  const confirmarCancelarCita = async () => {
    setProcesando(true);
    setErrorConfirmar("");
    try {
      await cancelarCita(citaCancelando);
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
      <select className="select-barrio-nav" value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} aria-label="Barrio o zona">
        <option value="">BARRIO</option>
        {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
      </select>
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
          {filtroZona ? <> en <strong>{filtroZona}</strong></> : ""}
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
            {resultados.map((p) => (
              <TarjetaProblema
                key={p.id}
                problema={p}
                vista="trabajador"
                acciones={
                  <>
                    <button className="boton-ver-perfil" onClick={() => setProblemaViendo(p)}>Ver problema</button>
                    <button className="boton-agendar" onClick={() => abrirAgendar(p)}>Agendar cita</button>
                  </>
                }
              />
            ))}
          </div>
        )}
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
                  <p className="ayuda-resumen">Elegí un problema, agendá una cita en uno de los días que pidió el cliente y le llega el aviso</p>
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
              <button role="tab" aria-selected={vista === "citas"} className={`pestana-busqueda ${vista === "citas" ? "activa" : ""}`} onClick={() => cambiarVista("citas")}>
                Mis citas{citas.length > 0 ? ` (${citas.length})` : ""}
              </button>
              <button className="boton-mostrar-filtros" onClick={() => setFiltrosAbiertos((v) => !v)}>
                {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
              </button>
            </div>
            {vista === "problemas" ? renderProblemas() : renderCitas()}
          </div>
        </div>

        {problemaViendo && (
          <DetalleProblemaModal
            problema={problemaViendo}
            onCerrar={() => setProblemaViendo(null)}
            onAgendar={abrirAgendar}
            onCancelarCita={(c) => { setErrorConfirmar(""); setCitaCancelando(c); }}
          />
        )}
        {problemaAgendando && (
          <AgendarCitaModal
            problema={problemaAgendando}
            onCerrar={() => setProblemaAgendando(null)}
            onConfirmar={confirmarCita}
          />
        )}
        {citaCancelando && (
          <ConfirmarModal
            titulo="¿Cancelar la cita?"
            texto={`La cita del ${fechaLarga(citaCancelando.dia)}${citaCancelando.hora ? ` a las ${citaCancelando.hora} hs` : ""} se cancela y le avisamos a ${citaCancelando.cliente?.nombre || "el cliente"}.`}
            textoConfirmar="Sí, cancelar"
            peligro
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
