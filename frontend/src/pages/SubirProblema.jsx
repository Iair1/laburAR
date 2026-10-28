import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import { estilosProblemas } from "../estilosProblemas";
import { TarjetaProblema, Calendario } from "../componentes/ProblemasUI";
import { estilosTarjetas } from "../estilosTarjetas";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { ZONAS, CATEGORIAS } from "../constantes";
import { subirProblema } from "../problemasApi";
import {
  DIAS_CORTOS,
  FRANJAS,
  URGENCIAS,
  fechasPosibles,
  hoyStr,
  sumarDias,
  fechaCorta,
  indiceDiaSemana,
} from "../problemasDatos";

const estilos = `
  .contenido-subir {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.75rem 1.5rem 4rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 1.75rem;
    align-items: start;
  }
  .encabezado-subir { grid-column: 1 / -1; }
  .titulo-subir { font-size: 1.7rem; font-weight: 900; color: #111; text-transform: uppercase; letter-spacing: 0.01em; }
  .subtitulo-subir { font-size: 0.88rem; color: #444; margin-top: 4px; max-width: 640px; }

  .pasos-subir { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .paso-subir {
    display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 600; color: #444;
    background: #fff; border: 1px solid #ddd; border-radius: 999px; padding: 5px 12px;
  }
  .paso-subir b {
    width: 18px; height: 18px; border-radius: 50%; background: #7a2a2a; color: #fff; font-size: 0.66rem;
    display: inline-flex; align-items: center; justify-content: center;
  }

  .tarjeta-seccion-subir {
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 18px;
    padding: 1.3rem 1.4rem 1.2rem;
    margin-bottom: 1.1rem;
  }
  .encabezado-seccion-subir { display: flex; align-items: center; gap: 10px; margin-bottom: 0.9rem; }
  .numero-seccion {
    width: 28px; height: 28px; border-radius: 50%; background: #570101; color: #fff; font-weight: 700; font-size: 0.85rem;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .titulo-seccion-subir { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  .ayuda-seccion-subir { font-size: 0.74rem; color: #777; margin-top: 1px; }
  .campo-subir { margin-bottom: 0.95rem; }
  .campo-subir:last-child { margin-bottom: 0; }
  .contador-letras { font-size: 0.68rem; color: #999; text-align: right; margin-top: 3px; }
  .consejo-subir {
    font-size: 0.72rem; color: #5b4a2e; background: #faf5ec; border: 1px solid #efe2c8; border-radius: 10px;
    padding: 8px 12px; margin-top: 6px; line-height: 1.4;
  }

  .atajos-fecha { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .grilla-cuando { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.2rem; }
  .opciones-urgencia { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .opcion-urgencia {
    text-align: left; border: 1px solid #ccc; background: #fff; border-radius: 12px; padding: 10px 12px; cursor: pointer;
    font-family: inherit; transition: border-color 0.15s, background 0.15s;
  }
  .opcion-urgencia strong { display: block; font-size: 0.82rem; color: #1a1a1a; }
  .opcion-urgencia span { font-size: 0.7rem; color: #777; }
  .opcion-urgencia.activo { border-color: #570101; background: #f6eeee; box-shadow: inset 0 0 0 1px #570101; }

  .columna-previa { position: sticky; top: 76px; }
  .titulo-previa { font-size: 0.78rem; font-weight: 700; color: #444; margin: 0 0 8px 4px; text-transform: uppercase; letter-spacing: 0.04em; }
  .nota-previa { font-size: 0.72rem; color: #666; margin: 10px 4px 0; line-height: 1.4; }
  .acciones-subir { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  .acciones-subir .boton-grande-modal { margin: 0; width: 100%; min-width: 0; }
  .error-subir {
    background: #fbeceb; border: 1px solid #f0c2bf; color: #8f1d17; border-radius: 12px; padding: 10px 12px;
    font-size: 0.8rem; font-weight: 600;
  }

  @media (max-width: 960px) {
    .contenido-subir { grid-template-columns: 1fr; padding: 1.25rem 1rem 3rem; }
    .columna-previa { position: static; }
    .grilla-cuando { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .opciones-urgencia { grid-template-columns: 1fr; }
    .titulo-subir { font-size: 1.35rem; }
  }
`;

const TODOS_LOS_DIAS = [true, true, true, true, true, true, true];

function formularioVacio(parametros) {
  const categoria = parametros.get("categoria");
  const zona = parametros.get("zona");
  return {
    categoria: CATEGORIAS.includes(categoria) ? categoria : "",
    titulo: "",
    descripcion: (parametros.get("descripcion") || "").slice(0, 1500),
    zona: ZONAS.includes(zona) ? zona : "",
    barrio: "",
    inicio: "",
    fin: "",
    diassemana: [...TODOS_LOS_DIAS],
    franja: "",
    urgencia: "",
  };
}

// "Volver a publicar" uno que se canceló o venció: mismos datos, fechas nuevas
function formularioDesdeProblema(p) {
  return {
    categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : "",
    titulo: p.titulo || "",
    descripcion: p.descripcion || "",
    zona: ZONAS.includes(p.localidad) ? p.localidad : "",
    barrio: p.barrio || "",
    inicio: "",
    fin: "",
    diassemana: Array.isArray(p.diassemana) && p.diassemana.some(Boolean) ? [...p.diassemana] : [...TODOS_LOS_DIAS],
    franja: p.franja || "",
    urgencia: p.urgencia || "",
  };
}

// Devuelve el primer error del formulario (o "" si está todo bien)
function validar(form, fechasValidas) {
  if (!form.categoria) return { campo: "categoria", mensaje: "Elegí la categoría del problema." };
  if (form.titulo.trim().length < 5) return { campo: "titulo", mensaje: "Poné un título de al menos 5 letras (ej: \"Pérdida de agua en la cocina\")." };
  if (form.descripcion.trim().length < 15) return { campo: "descripcion", mensaje: "Contá un poco más del problema (al menos 15 letras)." };
  if (!form.zona) return { campo: "zona", mensaje: "Elegí tu zona." };
  if (!form.inicio) return { campo: "fechas", mensaje: "Elegí entre qué fechas pueden ir." };
  if (!form.diassemana.some(Boolean)) return { campo: "fechas", mensaje: "Elegí al menos un día de la semana." };
  if (fechasValidas.length === 0) return { campo: "fechas", mensaje: "Entre esas fechas no cae ninguno de los días de la semana que elegiste." };
  if (!form.franja) return { campo: "franja", mensaje: "Elegí en qué horario pueden ir." };
  return null;
}

export default function SubirProblema() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  const copiado = ubicacion.state?.copiar || null;

  const [form, setForm] = useState(() => (copiado ? formularioDesdeProblema(copiado) : formularioVacio(parametros)));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const referenciaError = useRef(null);

  // Cualquier cambio en el formulario borra el error anterior
  const actualizarForm = (cambio) => {
    setError(null);
    setForm(cambio);
  };
  const cambiar = (campo, valor) => actualizarForm((f) => ({ ...f, [campo]: valor }));

  // Sin sesión: al login y después vuelve acá
  useEffect(() => {
    if (!usuario) navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`, { replace: true });
  }, [usuario, navegar, ubicacion]);

  const fin = form.fin || form.inicio;
  const fechasValidas = useMemo(
    () => (form.inicio ? fechasPosibles({ periodo: [form.inicio, fin], diassemana: form.diassemana }) : []),
    [form.inicio, fin, form.diassemana]
  );

  const alternarDia = (i) => {
    actualizarForm((f) => {
      const dias = [...f.diassemana];
      dias[i] = !dias[i];
      return { ...f, diassemana: dias };
    });
  };

  const atajoFechas = (dias) => {
    const hoy = hoyStr();
    actualizarForm((f) => ({ ...f, inicio: hoy, fin: sumarDias(hoy, dias) }));
  };

  const mostrarError = (nuevoError) => {
    setError(nuevoError);
    setTimeout(() => referenciaError.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const publicar = async () => {
    const problemaForm = validar(form, fechasValidas);
    if (problemaForm) {
      mostrarError(problemaForm);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const resultado = await subirProblema({
        categoria: form.categoria,
        titulo: form.titulo.replace(/\s+/g, " ").trim(),
        descripcion: form.descripcion.trim(),
        zona: form.zona,
        barrio: form.barrio.replace(/\s+/g, " ").trim(),
        franja: form.franja,
        urgencia: form.urgencia,
        inicio: form.inicio,
        fin,
        diassemana: form.diassemana,
      });
      navegar(`/mis-problemas?publicado=${encodeURIComponent(resultado?.id ?? "")}`);
    } catch (err) {
      if (err.status === 401) {
        cerrarSesionCompleta();
        navegar(`/login?volver=${encodeURIComponent("/subir-problema")}`);
        return;
      }
      mostrarError({ campo: "", mensaje: err.message || "No se pudo publicar. Probá de nuevo." });
    } finally {
      setEnviando(false);
    }
  };

  if (!usuario) return null;

  const conError = (campo) => (error?.campo === campo ? "con-error" : "");

  const vistaPrevia = {
    titulo: form.titulo.trim() || "Título de tu problema",
    descripcion: form.descripcion.trim(),
    categoria: form.categoria,
    localidad: form.zona,
    barrio: form.barrio.trim(),
    periodo: form.inicio ? [form.inicio, fin] : [],
    diassemana: form.diassemana,
    franja: form.franja,
    urgencia: form.urgencia,
    estado: "por revisar",
    cliente: { nombre: usuario.nombre || "Vos", foto: usuario.fotoPerfilURL },
  };

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav />

        <main className="contenido-subir">
          <header className="encabezado-subir">
            <h1 className="titulo-subir">{copiado ? "Volver a publicar" : "Subí tu problema"}</h1>
            <p className="subtitulo-subir">
              Contá qué necesitás arreglar y qué días pueden ir. Un trabajador de la categoría va a agendar una cita
              en uno de esos días y te llega el aviso.
            </p>
            <div className="pasos-subir">
              <span className="paso-subir"><b>1</b> Publicás tu problema</span>
              <span className="paso-subir"><b>2</b> Un trabajador agenda una cita</span>
              <span className="paso-subir"><b>3</b> Va ese día y lo arregla</span>
            </div>
          </header>

          <div>
            {/* 1. Qué */}
            <section className="tarjeta-seccion-subir">
              <div className="encabezado-seccion-subir">
                <span className="numero-seccion">1</span>
                <div>
                  <p className="titulo-seccion-subir">¿Qué necesitás resolver?</p>
                  <p className="ayuda-seccion-subir">Cuanto más claro, más fácil es que un trabajador lo tome.</p>
                </div>
              </div>

              <div className="fila-modal">
                <div className="campo-subir">
                  <label className="etiqueta-modal" htmlFor="categoria-problema">Categoría</label>
                  <select
                    id="categoria-problema"
                    className={`select-modal ${conError("categoria")}`}
                    value={form.categoria}
                    onChange={(e) => cambiar("categoria", e.target.value)}
                  >
                    <option value="">Elegí una categoría</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="campo-subir">
                  <label className="etiqueta-modal" htmlFor="titulo-problema">Título</label>
                  <input
                    id="titulo-problema"
                    className={`entrada-modal ${conError("titulo")}`}
                    maxLength={80}
                    placeholder="Ej: Pérdida de agua debajo de la bacha"
                    value={form.titulo}
                    onChange={(e) => cambiar("titulo", e.target.value)}
                  />
                </div>
              </div>

              <div className="campo-subir">
                <label className="etiqueta-modal" htmlFor="descripcion-problema">Describí el problema</label>
                <textarea
                  id="descripcion-problema"
                  className={`textarea-modal ${conError("descripcion")}`}
                  style={{ minHeight: 120 }}
                  maxLength={1500}
                  placeholder="¿Qué pasa? ¿Desde cuándo? ¿Qué hay que hacer? Ej: Gotea la canilla de la cocina y hay humedad en el mueble de abajo. Hace una semana que empezó."
                  value={form.descripcion}
                  onChange={(e) => cambiar("descripcion", e.target.value)}
                />
                <p className="contador-letras">{form.descripcion.length}/1500</p>
                <p className="consejo-subir">
                  💡 Contá medidas, marcas o el material si los sabés (ej: "termotanque a gas de 80 litros",
                  "pared de durlock de 3 x 2 m"). Así el trabajador sabe qué llevar.
                </p>
              </div>
            </section>

            {/* 2. Dónde */}
            <section className="tarjeta-seccion-subir">
              <div className="encabezado-seccion-subir">
                <span className="numero-seccion">2</span>
                <div>
                  <p className="titulo-seccion-subir">¿Dónde?</p>
                  <p className="ayuda-seccion-subir">Los trabajadores ven tu zona y tu barrio.</p>
                </div>
              </div>
              <div className="fila-modal">
                <div className="campo-subir">
                  <label className="etiqueta-modal" htmlFor="zona-problema">Zona</label>
                  <select
                    id="zona-problema"
                    className={`select-modal ${conError("zona")}`}
                    value={form.zona}
                    onChange={(e) => cambiar("zona", e.target.value)}
                  >
                    <option value="">Elegí tu zona</option>
                    {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="campo-subir">
                  <label className="etiqueta-modal" htmlFor="barrio-problema">Barrio (opcional)</label>
                  <input
                    id="barrio-problema"
                    className="entrada-modal"
                    maxLength={60}
                    placeholder="Ej: Palermo"
                    value={form.barrio}
                    onChange={(e) => cambiar("barrio", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* 3. Cuándo */}
            <section className="tarjeta-seccion-subir">
              <div className="encabezado-seccion-subir">
                <span className="numero-seccion">3</span>
                <div>
                  <p className="titulo-seccion-subir">¿Cuándo pueden ir?</p>
                  <p className="ayuda-seccion-subir">El trabajador va a elegir uno de estos días para la cita.</p>
                </div>
              </div>

              <div className="grilla-cuando">
                <div>
                  <label className="etiqueta-modal">Entre qué fechas</label>
                  <div className="atajos-fecha">
                    <button type="button" className="chip-modal" onClick={() => atajoFechas(0)}>Solo hoy</button>
                    <button type="button" className="chip-modal" onClick={() => atajoFechas(6)}>Próximos 7 días</button>
                    <button type="button" className="chip-modal" onClick={() => atajoFechas(14)}>Próximos 15 días</button>
                    <button type="button" className="chip-modal" onClick={() => atajoFechas(29)}>Próximo mes</button>
                  </div>
                  <Calendario
                    modo="rango"
                    inicio={form.inicio}
                    fin={form.fin}
                    onCambio={({ inicio, fin: nuevoFin }) => actualizarForm((f) => ({ ...f, inicio, fin: nuevoFin }))}
                    marcar={(fecha) => form.diassemana[indiceDiaSemana(fecha)]}
                  />
                  <p className="cal-resumen">
                    {form.inicio && form.fin ? (
                      <>Del <strong>{fechaCorta(form.inicio)}</strong> al <strong>{fechaCorta(form.fin)}</strong> · {fechasValidas.length} {fechasValidas.length === 1 ? "día posible" : "días posibles"}</>
                    ) : form.inicio ? (
                      <>Solo el <strong>{fechaCorta(form.inicio)}</strong>. Si querés más días, tocá hasta cuál.</>
                    ) : (
                      "Tocá el primer y el último día"
                    )}
                  </p>
                </div>

                <div>
                  <div className="campo-subir">
                    <label className="etiqueta-modal">Qué días de la semana</label>
                    <div className="chips-modal">
                      <button
                        type="button"
                        className={`chip-modal ${form.diassemana.every(Boolean) ? "activo" : ""}`}
                        onClick={() => cambiar("diassemana", form.diassemana.every(Boolean) ? [false, false, false, false, false, false, false] : [...TODOS_LOS_DIAS])}
                      >
                        Todos
                      </button>
                      {DIAS_CORTOS.map((d, i) => (
                        <button
                          type="button"
                          key={d}
                          className={`chip-modal ${form.diassemana[i] ? "activo" : ""}`}
                          onClick={() => alternarDia(i)}
                          aria-pressed={form.diassemana[i]}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="campo-subir">
                    <label className="etiqueta-modal">En qué horario</label>
                    <div className="chips-modal">
                      {Object.entries(FRANJAS).map(([id, f]) => (
                        <button
                          type="button"
                          key={id}
                          className={`chip-modal ${form.franja === id ? "activo" : ""}`}
                          onClick={() => cambiar("franja", id)}
                          aria-pressed={form.franja === id}
                        >
                          {f.etiqueta} <small style={{ opacity: 0.8 }}>· {f.detalle}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="campo-subir">
                    <label className="etiqueta-modal">¿Qué tan urgente es? (opcional)</label>
                    <div className="opciones-urgencia">
                      {Object.entries(URGENCIAS).map(([id, u]) => (
                        <button
                          type="button"
                          key={id}
                          className={`opcion-urgencia ${form.urgencia === id ? "activo" : ""}`}
                          onClick={() => cambiar("urgencia", form.urgencia === id ? "" : id)}
                          aria-pressed={form.urgencia === id}
                        >
                          <strong>{u.etiqueta}</strong>
                          <span>{u.detalle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="columna-previa">
            <p className="titulo-previa">Así lo van a ver los trabajadores</p>
            <TarjetaProblema problema={vistaPrevia} vista="trabajador" />
            <p className="nota-previa">
              Cuando un trabajador agende la cita te llega un aviso, y lo ves en "Mis problemas".
            </p>
            <div className="acciones-subir">
              {error && <div className="error-subir" ref={referenciaError} role="alert">{error.mensaje}</div>}
              <button className="boton-grande-modal" onClick={publicar} disabled={enviando}>
                {enviando ? "Publicando..." : "Publicar problema"}
              </button>
              <button
                className="boton-pill secundario"
                onClick={() => (ubicacion.key !== "default" ? navegar(-1) : navegar("/"))}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
