import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import {
  estilosProblemas,
  TarjetaProblema,
  Calendario,
  Iconos,
} from "../componentes/ProblemasUI";
import { estilosTarjetas } from "../estilosTarjetas";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { comprimirImagen } from "../api";
import { ZONAS, CATEGORIAS } from "../constantes";
import { subirProblema, editarProblema, obtenerProblema, USA_BACKEND } from "../problemasApi";
import {
  DIAS_CORTOS,
  FRANJAS,
  URGENCIAS,
  MAXIMO_FOTOS_PROBLEMA,
  fechasPosibles,
  hoyStr,
  sumarDias,
  fechaCorta,
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

  .fotos-subir { display: flex; flex-wrap: wrap; gap: 10px; }
  .foto-subir {
    position: relative; width: 92px; height: 92px; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;
  }
  .foto-subir img { width: 100%; height: 100%; object-fit: cover; }
  .foto-subir button {
    position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; border: none;
    background: rgba(0,0,0,0.65); color: #fff; font-size: 0.7rem; cursor: pointer;
  }
  .agregar-foto {
    width: 92px; height: 92px; border-radius: 12px; border: 2px dashed #b9a3a3; background: #fcf8f8; color: #570101;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 0.7rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
  }
  .agregar-foto:hover { border-color: #570101; background: #f6eeee; }
  .agregar-foto span { font-size: 1.4rem; line-height: 1; }

  .privado-subir { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #2e6b2d; margin-top: 4px; }
  .privado-subir svg { width: 12px; height: 12px; }

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
  .fila-precio-subir { display: flex; align-items: center; gap: 8px; }
  .fila-precio-subir span { font-weight: 700; color: #570101; white-space: nowrap; }

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
    descripcion: parametros.get("descripcion") || "",
    fotos: [],
    localidad: ZONAS.includes(zona) ? zona : "",
    barrio: "",
    direccion: "",
    inicio: "",
    fin: "",
    diassemana: [...TODOS_LOS_DIAS],
    franja: "",
    urgencia: "",
    presupuesto_estimado: "",
  };
}

function formularioDesdeProblema(p, copiar) {
  const hoy = hoyStr();
  const [inicio, fin] = p.periodo || [];
  const vencido = !fin || fin < hoy;
  return {
    categoria: p.categoria,
    titulo: p.titulo,
    descripcion: p.descripcion,
    fotos: p.fotos || [],
    localidad: p.localidad,
    barrio: p.barrio || "",
    direccion: p.direccion || "",
    // Al volver a publicar, si las fechas ya pasaron, se eligen de nuevo
    inicio: copiar && vencido ? "" : inicio < hoy ? hoy : inicio,
    fin: copiar && vencido ? "" : fin,
    diassemana: p.diassemana || [...TODOS_LOS_DIAS],
    franja: p.franja,
    urgencia: p.urgencia,
    presupuesto_estimado: p.presupuestoEstimado ?? "",
  };
}

export default function SubirProblema() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const [usuario] = useState(() => obtenerSesionUsuario());
  const idEditar = parametros.get("editar");
  const idCopiar = parametros.get("copiar");

  const [form, setForm] = useState(() => formularioVacio(parametros));
  const [cargandoProblema, setCargandoProblema] = useState(Boolean(idEditar || idCopiar));
  const [procesandoFotos, setProcesandoFotos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const referenciaFotos = useRef(null);
  const referenciaError = useRef(null);

  // Cualquier cambio en el formulario borra el error anterior
  const actualizarForm = (cambio) => {
    setError("");
    setForm(cambio);
  };
  const cambiar = (campo, valor) => actualizarForm((f) => ({ ...f, [campo]: valor }));

  // Sin sesión: al login y después vuelve acá
  useEffect(() => {
    if (!usuario) navegar(`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`, { replace: true });
  }, [usuario, navegar, ubicacion]);

  // Editar o volver a publicar uno existente
  useEffect(() => {
    if (!usuario || !(idEditar || idCopiar)) return;
    let cancelado = false;
    obtenerProblema(idEditar || idCopiar)
      .then((p) => {
        if (cancelado) return;
        if (!p.esMio) throw new Error("Ese problema no es tuyo.");
        if (idEditar && p.estado !== "por revisar") throw new Error("Este problema ya no se puede editar.");
        setForm(formularioDesdeProblema(p, Boolean(idCopiar)));
      })
      .catch((err) => !cancelado && setError(err.message || "No se pudo cargar el problema."))
      .finally(() => !cancelado && setCargandoProblema(false));
    return () => {
      cancelado = true;
    };
  }, [usuario, idEditar, idCopiar]);

  const fechasValidas = useMemo(
    () => (form.inicio && form.fin ? fechasPosibles({ periodo: [form.inicio, form.fin], diassemana: form.diassemana }) : []),
    [form.inicio, form.fin, form.diassemana]
  );

  const agregarFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    const lugares = MAXIMO_FOTOS_PROBLEMA - form.fotos.length;
    if (archivos.length === 0 || lugares <= 0) return;
    const imagenes = archivos.filter((a) => a.type.startsWith("image/")).slice(0, lugares);
    if (imagenes.length < archivos.length) setError(`Podés subir hasta ${MAXIMO_FOTOS_PROBLEMA} fotos (solo imágenes).`);
    setProcesandoFotos(true);
    try {
      // En modo local se guardan en el navegador: más chicas para no llenar el espacio
      const comprimidas = await Promise.all(
        imagenes.map((a) => (USA_BACKEND ? comprimirImagen(a, 1000, 0.75) : comprimirImagen(a, 640, 0.6)))
      );
      actualizarForm((f) => ({ ...f, fotos: [...f.fotos, ...comprimidas].slice(0, MAXIMO_FOTOS_PROBLEMA) }));
    } catch {
      setError("No se pudo leer alguna de las fotos. Probá con otra.");
    } finally {
      setProcesandoFotos(false);
    }
  };

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

  const publicar = async () => {
    setError("");
    const datos = {
      ...form,
      periodo: [form.inicio, form.fin || form.inicio],
      presupuesto_estimado: form.presupuesto_estimado === "" ? null : Number(form.presupuesto_estimado),
    };
    setEnviando(true);
    try {
      const resultado = idEditar ? await editarProblema(idEditar, datos) : await subirProblema(datos);
      navegar(`/mis-problemas?${idEditar ? "editado" : "publicado"}=${encodeURIComponent(resultado.id)}`);
    } catch (err) {
      if (err.status === 401) {
        cerrarSesionCompleta();
        navegar(`/login?volver=${encodeURIComponent("/subir-problema")}`);
        return;
      }
      setError(err.message || "No se pudo publicar. Probá de nuevo.");
      setTimeout(() => referenciaError.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } finally {
      setEnviando(false);
    }
  };

  if (!usuario) return null;

  const vistaPrevia = {
    titulo: form.titulo.trim() || "Título de tu problema",
    descripcion: form.descripcion.trim(),
    categoria: form.categoria,
    fotos: form.fotos,
    localidad: form.localidad,
    barrio: form.barrio,
    periodo: form.inicio ? [form.inicio, form.fin || form.inicio] : [],
    diassemana: form.diassemana,
    franja: form.franja,
    urgencia: form.urgencia || "flexible",
    presupuestoEstimado: form.presupuesto_estimado === "" ? null : Number(form.presupuesto_estimado),
    creado: new Date().toISOString(),
    cantidadPresupuestos: 0,
  };

  const titulo = idEditar ? "Editar mi problema" : idCopiar ? "Volver a publicar" : "Subí tu problema";

  return (
    <>
      <style>{estilosTarjetas}</style>
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      <div className="pagina-problemas">
        <BarraNav />
        {!USA_BACKEND && (
          <div className="aviso-modo-local">
            <span>Modo de prueba: los problemas y presupuestos se guardan en este navegador.</span>
          </div>
        )}

        <main className="contenido-subir">
          <header className="encabezado-subir">
            <h1 className="titulo-subir">{titulo}</h1>
            <p className="subtitulo-subir">
              Contá qué necesitás arreglar y cuándo pueden ir. Los trabajadores de tu zona te van a mandar
              presupuestos y vos elegís el que más te convenga.
            </p>
            <div className="pasos-subir">
              <span className="paso-subir"><b>1</b> Publicás tu problema</span>
              <span className="paso-subir"><b>2</b> Recibís presupuestos</span>
              <span className="paso-subir"><b>3</b> Elegís uno y queda agendado</span>
            </div>
          </header>

          <div>
            {cargandoProblema ? (
              <div className="esqueleto-tarjeta" style={{ height: 420 }} />
            ) : (
              <>
                {/* 1. Qué */}
                <section className="tarjeta-seccion-subir">
                  <div className="encabezado-seccion-subir">
                    <span className="numero-seccion">1</span>
                    <div>
                      <p className="titulo-seccion-subir">¿Qué necesitás resolver?</p>
                      <p className="ayuda-seccion-subir">Cuanto más claro, mejores y más precisos van a ser los presupuestos.</p>
                    </div>
                  </div>

                  <div className="fila-modal">
                    <div className="campo-subir">
                      <label className="etiqueta-modal" htmlFor="categoria-problema">Categoría</label>
                      <select id="categoria-problema" className="select-modal" value={form.categoria} onChange={(e) => cambiar("categoria", e.target.value)}>
                        <option value="">Elegí una categoría</option>
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="campo-subir">
                      <label className="etiqueta-modal" htmlFor="titulo-problema">Título</label>
                      <input
                        id="titulo-problema"
                        className="entrada-modal"
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
                      className="textarea-modal"
                      style={{ minHeight: 120 }}
                      maxLength={1500}
                      placeholder="¿Qué pasa? ¿Desde cuándo? ¿Qué hay que hacer? Ej: Gotea la canilla de la cocina y hay humedad en el mueble de abajo. Hace una semana que empezó."
                      value={form.descripcion}
                      onChange={(e) => cambiar("descripcion", e.target.value)}
                    />
                    <p className="contador-letras">{form.descripcion.length}/1500</p>
                    <p className="consejo-subir">
                      💡 Contá medidas, marcas o el material si los sabés (ej: "termotanque a gas de 80 litros",
                      "pared de durlock de 3 x 2 m"). Así te pueden pasar un precio más justo.
                    </p>
                  </div>

                  <div className="campo-subir">
                    <label className="etiqueta-modal">Fotos (opcional, hasta {MAXIMO_FOTOS_PROBLEMA})</label>
                    <div className="fotos-subir">
                      {form.fotos.map((f, i) => (
                        <div className="foto-subir" key={i}>
                          <img src={f} alt={`Foto ${i + 1}`} />
                          <button type="button" onClick={() => cambiar("fotos", form.fotos.filter((_, j) => j !== i))} aria-label={`Quitar foto ${i + 1}`}>✕</button>
                        </div>
                      ))}
                      {form.fotos.length < MAXIMO_FOTOS_PROBLEMA && (
                        <button type="button" className="agregar-foto" onClick={() => referenciaFotos.current?.click()} disabled={procesandoFotos}>
                          <span>{procesandoFotos ? "…" : "+"}</span>
                          {procesandoFotos ? "Cargando" : "Agregar foto"}
                        </button>
                      )}
                      <input ref={referenciaFotos} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={agregarFotos} />
                    </div>
                  </div>
                </section>

                {/* 2. Dónde */}
                <section className="tarjeta-seccion-subir">
                  <div className="encabezado-seccion-subir">
                    <span className="numero-seccion">2</span>
                    <div>
                      <p className="titulo-seccion-subir">¿Dónde?</p>
                      <p className="ayuda-seccion-subir">Solo mostramos tu zona y barrio. La dirección la ve únicamente el trabajador que elijas.</p>
                    </div>
                  </div>
                  <div className="fila-modal">
                    <div className="campo-subir">
                      <label className="etiqueta-modal" htmlFor="zona-problema">Zona</label>
                      <select id="zona-problema" className="select-modal" value={form.localidad} onChange={(e) => cambiar("localidad", e.target.value)}>
                        <option value="">Elegí tu zona</option>
                        {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                    <div className="campo-subir">
                      <label className="etiqueta-modal" htmlFor="barrio-problema">Barrio (opcional)</label>
                      <input id="barrio-problema" className="entrada-modal" maxLength={60} placeholder="Ej: Palermo" value={form.barrio} onChange={(e) => cambiar("barrio", e.target.value)} />
                    </div>
                  </div>
                  <div className="campo-subir">
                    <label className="etiqueta-modal" htmlFor="direccion-problema">Dirección (opcional)</label>
                    <input id="direccion-problema" className="entrada-modal" maxLength={120} placeholder="Calle, altura, piso / depto" value={form.direccion} onChange={(e) => cambiar("direccion", e.target.value)} />
                    <p className="privado-subir">{Iconos.candado} Privada: solo la ve el trabajador que elijas.</p>
                  </div>
                </section>

                {/* 3. Cuándo */}
                <section className="tarjeta-seccion-subir">
                  <div className="encabezado-seccion-subir">
                    <span className="numero-seccion">3</span>
                    <div>
                      <p className="titulo-seccion-subir">¿Cuándo pueden ir?</p>
                      <p className="ayuda-seccion-subir">El trabajador va a proponer un día y un horario dentro de lo que elijas.</p>
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
                        onCambio={({ inicio, fin }) => actualizarForm((f) => ({ ...f, inicio, fin }))}
                        marcar={(fecha) => form.diassemana[(new Date(`${fecha}T00:00:00`).getDay() + 6) % 7]}
                      />
                      <p className="cal-resumen">
                        {form.inicio && form.fin ? (
                          <>Del <strong>{fechaCorta(form.inicio)}</strong> al <strong>{fechaCorta(form.fin)}</strong> · {fechasValidas.length} {fechasValidas.length === 1 ? "día posible" : "días posibles"}</>
                        ) : form.inicio ? (
                          <>Elegí hasta qué día (o tocá de nuevo el <strong>{fechaCorta(form.inicio)}</strong> si es solo ese)</>
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
                            <button type="button" key={d} className={`chip-modal ${form.diassemana[i] ? "activo" : ""}`} onClick={() => alternarDia(i)}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="campo-subir">
                        <label className="etiqueta-modal">En qué horario</label>
                        <div className="chips-modal">
                          {Object.entries(FRANJAS).map(([id, f]) => (
                            <button type="button" key={id} className={`chip-modal ${form.franja === id ? "activo" : ""}`} onClick={() => cambiar("franja", id)}>
                              {f.etiqueta} <small style={{ opacity: 0.8 }}>· {f.detalle}</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="campo-subir">
                        <label className="etiqueta-modal">¿Qué tan urgente es?</label>
                        <div className="opciones-urgencia">
                          {Object.entries(URGENCIAS).map(([id, u]) => (
                            <button type="button" key={id} className={`opcion-urgencia ${form.urgencia === id ? "activo" : ""}`} onClick={() => cambiar("urgencia", id)}>
                              <strong>{u.etiqueta}</strong>
                              <span>{u.detalle}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Presupuesto */}
                <section className="tarjeta-seccion-subir">
                  <div className="encabezado-seccion-subir">
                    <span className="numero-seccion">4</span>
                    <div>
                      <p className="titulo-seccion-subir">¿Cuánto pensás gastar? (opcional)</p>
                      <p className="ayuda-seccion-subir">Es solo una referencia para los trabajadores. Igual vas a recibir sus presupuestos.</p>
                    </div>
                  </div>
                  <div className="fila-precio-subir" style={{ maxWidth: 280 }}>
                    <span>Hasta $</span>
                    <input
                      className="entrada-modal"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Ej: 30000"
                      value={form.presupuesto_estimado}
                      onChange={(e) => cambiar("presupuesto_estimado", e.target.value)}
                      aria-label="Presupuesto estimado"
                    />
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className="columna-previa">
            <p className="titulo-previa">Así lo van a ver los trabajadores</p>
            <TarjetaProblema problema={vistaPrevia} />
            <p className="nota-previa">
              Los trabajadores ven tu nombre, tu zona y tu barrio. Tu dirección la ve solo el trabajador que elijas.
            </p>
            <div className="acciones-subir">
              {error && <div className="error-subir" ref={referenciaError} role="alert">{error}</div>}
              <button className="boton-grande-modal" onClick={publicar} disabled={enviando || cargandoProblema || procesandoFotos}>
                {enviando ? "Publicando..." : idEditar ? "Guardar cambios" : "Publicar problema"}
              </button>
              <button className="boton-pill secundario" onClick={() => navegar(-1)} disabled={enviando}>Cancelar</button>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
