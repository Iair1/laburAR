import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { obtenerResenasPendientes, dejarResena, obtenerResenasDe, EVENTO_RESENAS } from "../resenasApi";
import { EVENTO_ABRIR_RESENA } from "../notificacionesDatos";

const estilos = `
  .estrellas-resena { display: inline-flex; gap: 1px; vertical-align: middle; }
  .estrellas-resena svg { width: var(--tam, 13px); height: var(--tam, 13px); }
  .resumen-puntaje { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #333; }
  .resumen-puntaje strong { font-size: 0.95rem; color: #1a1a1a; }
  .resumen-puntaje .cantidad-resenas { color: #777; font-size: 0.74rem; }

  .lista-resenas { display: flex; flex-direction: column; gap: 10px; }
  .item-resena { border: 1px solid #ecdede; background: #fcf8f8; border-radius: 12px; padding: 10px 12px; }
  .cabecera-item-resena { display: flex; align-items: center; gap: 8px; }
  .autor-resena { font-size: 0.8rem; font-weight: 700; color: #1a1a1a; }
  .sub-resena { font-size: 0.68rem; color: #888; }
  .texto-resena { font-size: 0.8rem; color: #333; line-height: 1.45; margin-top: 6px; white-space: pre-line; }
  .chip-rubro-resena { font-size: 0.64rem; font-weight: 700; color: #7a2a2a; background: #f4e7e7; border-radius: 999px; padding: 2px 8px; margin-left: auto; white-space: nowrap; }
  .vacio-resenas { font-size: 0.8rem; color: #777; background: #fafafa; border: 1px dashed #ddd; border-radius: 10px; padding: 12px; text-align: center; }
  .boton-texto-resenas { background: none; border: none; color: #570101; font-weight: 700; font-size: 0.76rem; cursor: pointer; padding: 0; font-family: inherit; }
  .boton-texto-resenas:hover { text-decoration: underline; }

  /* ventana */
  .fondo-resena {
    position: fixed; inset: 0; z-index: 260; background: rgba(20,20,20,0.55);
    display: flex; align-items: center; justify-content: center; padding: 1.25rem;
    animation: aparecer-fondo-resena 0.15s ease-out;
  }
  @keyframes aparecer-fondo-resena { from { opacity: 0; } to { opacity: 1; } }
  .tarjeta-resena {
    position: relative; width: 100%; max-width: 470px; max-height: 92vh; overflow-y: auto; background: #fff;
    border: 1.5px solid #1a1a1a; border-radius: 22px; padding: 1.5rem 1.6rem 1.3rem;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  }
  .cerrar-resena {
    position: absolute; top: 12px; right: 14px; width: 30px; height: 30px; border-radius: 50%;
    background: none; border: none; cursor: pointer; font-size: 1rem; color: #666;
  }
  .cerrar-resena:hover { background: #f0f0ee; color: #1a1a1a; }
  .titulo-resena { font-size: 1.25rem; font-weight: 800; color: #111; text-align: center; text-transform: uppercase; }
  .persona-resena { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 0.9rem 0 0.4rem; text-align: center; }
  .persona-resena strong { font-size: 1rem; color: #1a1a1a; }
  .persona-resena span { font-size: 0.76rem; color: #666; }
  .selector-estrellas { display: flex; justify-content: center; gap: 6px; margin: 0.6rem 0 0.2rem; }
  .selector-estrellas button { background: none; border: none; cursor: pointer; padding: 2px; transition: transform 0.1s; }
  .selector-estrellas button:hover { transform: scale(1.12); }
  .selector-estrellas svg { width: 36px; height: 36px; }
  .etiqueta-estrellas { text-align: center; font-size: 0.8rem; font-weight: 700; color: #570101; min-height: 1.2em; }
  .chips-resena { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 0.8rem 0 0.5rem; }
  .chip-resena {
    border: 1px solid #d9c8c8; background: #fff; color: #3b1e0d; border-radius: 999px; font-size: 0.72rem; font-weight: 600;
    padding: 5px 11px; cursor: pointer; font-family: inherit;
  }
  .chip-resena:hover { background: #f4eeee; }
  .textarea-resena {
    width: 100%; min-height: 96px; resize: vertical; border: 1px solid #8f8f8f; border-radius: 12px; padding: 10px 12px;
    font-size: 0.84rem; font-family: inherit; color: #222; outline: none; box-sizing: border-box; line-height: 1.4;
  }
  .textarea-resena:focus { border-color: #570101; box-shadow: 0 0 0 3px rgba(87,1,1,0.12); }
  .contador-resena { font-size: 0.68rem; color: #999; text-align: right; margin-top: 3px; }
  .error-resena { font-size: 0.8rem; color: #b3261e; font-weight: 600; text-align: center; margin: 8px 0 0; }
  .ayuda-resena { font-size: 0.7rem; color: #777; text-align: center; margin-top: 8px; }
  .boton-enviar-resena {
    display: block; width: 100%; margin-top: 0.9rem; padding: 12px; background: #6b0d0d; color: #fff; border: none; border-radius: 999px;
    font-size: 0.92rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 12px rgba(87,1,1,0.25);
  }
  .boton-enviar-resena:hover { background: #570101; }
  .boton-enviar-resena:disabled { opacity: 0.6; cursor: not-allowed; }
  .exito-resena { text-align: center; padding: 0.6rem 0 0.2rem; }
  .exito-resena .icono-exito { font-size: 2.2rem; }
  .exito-resena p { font-size: 0.86rem; color: #333; margin-top: 6px; }

  .pestanas-resenas { display: flex; gap: 6px; margin: 0.8rem 0; }
  .pestana-resenas {
    flex: 1; border: 1px solid #8f8f8f; background: #c9c9c9; color: #1a1a1a; border-radius: 999px; padding: 6px 10px;
    font-size: 0.74rem; font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .pestana-resenas.activa { background: #7a2a2a; border-color: #570101; color: #fff; }

  /* aviso flotante de reseñas pendientes */
  .toast-resena {
    position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 160; background: #1e5e22; color: #fff;
    border-radius: 999px; padding: 10px 18px; font-size: 0.82rem; font-weight: 600; box-shadow: 0 8px 22px rgba(0,0,0,0.2);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: calc(100vw - 32px); text-align: center;
  }
  .aviso-resena-pendiente {
    position: fixed; right: 18px; bottom: 18px; z-index: 150; width: 330px; max-width: calc(100vw - 24px);
    background: #fff; border: 1.5px solid #570101; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.2);
    padding: 12px 14px; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    animation: aparecer-aviso-resena 0.25s ease-out;
  }
  @keyframes aparecer-aviso-resena { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .fila-aviso-resena { display: flex; gap: 10px; align-items: center; }
  .texto-aviso-resena strong { display: block; font-size: 0.86rem; color: #1a1a1a; }
  .texto-aviso-resena span { font-size: 0.74rem; color: #555; }
  .acciones-aviso-resena { display: flex; gap: 8px; margin-top: 10px; }
  .acciones-aviso-resena button {
    flex: 1; border-radius: 999px; padding: 7px 10px; font-size: 0.76rem; font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .acciones-aviso-resena .principal { background: #570101; color: #fff; border: 1px solid #570101; }
  .acciones-aviso-resena .principal:hover { background: #3b1e0d; }
  .acciones-aviso-resena .secundario { background: #fff; color: #1a1a1a; border: 1px solid #b9a3a3; }
  .contador-aviso-resena { font-size: 0.66rem; color: #999; margin-left: auto; align-self: flex-start; white-space: nowrap; }
  @media (max-width: 520px) {
    .aviso-resena-pendiente { right: 12px; left: 12px; width: auto; bottom: 12px; }
    .tarjeta-resena { padding: 1.3rem 1rem 1.1rem; }
    .selector-estrellas svg { width: 32px; height: 32px; }
  }
`;

const RUTA_ESTRELLA = "M12 2l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.1l7.1-.6L12 2z";
const ETIQUETAS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

function Estrella({ llena, color = "#f2a900" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={RUTA_ESTRELLA} fill={llena ? color : "#e2dddd"} />
    </svg>
  );
}

/** Estrellas de solo lectura (redondea al entero más cercano). */
export function Estrellas({ valor, tamano = 13 }) {
  const n = Math.round(Number(valor) || 0);
  return (
    <span className="estrellas-resena" style={{ "--tam": `${tamano}px` }} aria-label={`${Number(valor || 0).toFixed(1)} de 5 estrellas`}>
      <style>{estilos}</style>
      {[1, 2, 3, 4, 5].map((i) => <Estrella key={i} llena={i <= n} />)}
    </span>
  );
}

/** "★★★★☆ 4.5 · 12 reseñas" o "Sin reseñas todavía" */
export function ResumenPuntaje({ promedio, cantidad }) {
  if (!cantidad) return <span className="resumen-puntaje"><style>{estilos}</style>Sin reseñas todavía</span>;
  return (
    <span className="resumen-puntaje">
      <Estrellas valor={promedio} />
      <strong>{Number(promedio).toFixed(1)}</strong>
      <span className="cantidad-resenas">· {cantidad} {cantidad === 1 ? "reseña" : "reseñas"}</span>
    </span>
  );
}

function fechaResena(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

export function ListaResenas({ resenas, limite = 0, textoVacio = "Todavía no tiene reseñas." }) {
  const [todas, setTodas] = useState(false);
  if (!resenas || resenas.length === 0) return <p className="vacio-resenas"><style>{estilos}</style>{textoVacio}</p>;
  const visibles = limite && !todas ? resenas.slice(0, limite) : resenas;
  return (
    <div className="lista-resenas">
      <style>{estilos}</style>
      {visibles.map((r) => (
        <article className="item-resena" key={r.id}>
          <div className="cabecera-item-resena">
            <Avatar src={r.autor.foto} nombre={r.autor.nombre} tamano={30} />
            <div>
              <div className="autor-resena">{r.autor.nombre}</div>
              <div className="sub-resena">
                <Estrellas valor={r.puntuacion} tamano={11} /> {fechaResena(r.fecha)}
              </div>
            </div>
            {r.aptitud && <span className="chip-rubro-resena">{r.aptitud}</span>}
          </div>
          {r.texto && <p className="texto-resena">{r.texto}</p>}
        </article>
      ))}
      {limite > 0 && resenas.length > limite && (
        <button type="button" className="boton-texto-resenas" onClick={() => setTodas((v) => !v)}>
          {todas ? "Ver menos" : `Ver las ${resenas.length} reseñas`}
        </button>
      )}
    </div>
  );
}

/** Reseñas que recibió alguien, cargadas del backend (para perfiles). */
export function ResenasDeUsuario({ userid, rol = "trabajador", limite = 3, onDatos }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!userid) return undefined;
    let activo = true;
    obtenerResenasDe(userid)
      .then((d) => {
        if (!activo) return;
        setDatos(d);
        onDatos?.(d);
      })
      .catch((err) => activo && setError(err.message || "No se pudieron cargar las reseñas."));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userid]);
  if (error) return <p className="vacio-resenas"><style>{estilos}</style>{error}</p>;
  if (!datos) return <p className="vacio-resenas"><style>{estilos}</style>Cargando reseñas...</p>;
  const resumen = rol === "cliente" ? datos.comoCliente : datos.comoTrabajador;
  return (
    <div>
      <div style={{ marginBottom: 8 }}><ResumenPuntaje promedio={resumen.promedio} cantidad={resumen.cantidad} /></div>
      <ListaResenas
        resenas={resumen.resenas}
        limite={limite}
        textoVacio={rol === "cliente" ? "Todavía nadie dejó reseñas sobre esta persona como cliente." : "Todavía no tiene reseñas como trabajador."}
      />
    </div>
  );
}

/** Ventana con todas las reseñas de alguien (pestañas: como trabajador / como cliente). */
export function ResenasModal({ userid, nombre, rolInicial = "trabajador", onCerrar }) {
  const [rol, setRol] = useState(rolInicial);
  const [cantidades, setCantidades] = useState(null);
  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
    };
    document.addEventListener("keydown", manejar, true);
    return () => document.removeEventListener("keydown", manejar, true);
  }, [onCerrar]);
  return (
    <div className="fondo-resena" onClick={onCerrar}>
      <style>{estilos}</style>
      <div className="tarjeta-resena" role="dialog" aria-modal="true" aria-label={`Reseñas de ${nombre}`} onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-resena" onClick={onCerrar} aria-label="Cerrar">✕</button>
        <h2 className="titulo-resena" style={{ fontSize: "1.05rem" }}>Reseñas de {nombre}</h2>
        <div className="pestanas-resenas" role="tablist">
          <button role="tab" aria-selected={rol === "trabajador"} className={`pestana-resenas ${rol === "trabajador" ? "activa" : ""}`} onClick={() => setRol("trabajador")}>
            Como trabajador{cantidades ? ` (${cantidades.trabajador})` : ""}
          </button>
          <button role="tab" aria-selected={rol === "cliente"} className={`pestana-resenas ${rol === "cliente" ? "activa" : ""}`} onClick={() => setRol("cliente")}>
            Como cliente{cantidades ? ` (${cantidades.cliente})` : ""}
          </button>
        </div>
        <ResenasDeUsuario
          key={rol}
          userid={userid}
          rol={rol}
          limite={0}
          onDatos={(d) => setCantidades({ trabajador: d.comoTrabajador.cantidad, cliente: d.comoCliente.cantidad })}
        />
      </div>
    </div>
  );
}

const SUGERENCIAS = {
  // lo que escribe el cliente sobre el trabajador
  contratador: ["Puntual", "Prolijo", "Buen precio", "Explicó todo", "Lo recomiendo"],
  // lo que escribe el trabajador sobre el cliente
  trabajador: ["Muy amable", "Explicó bien el problema", "Pagó en tiempo", "Todo listo para trabajar", "Lo recomiendo"],
};

/**
 * Ventana para dejar una reseña.
 *  - pendiente: { trabajo, titulo, aptitud, dia, miRol, otro: { id, nombre, foto } }
 */
export function DejarResenaModal({ pendiente, onCerrar, onListo }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState(false);
  const navegar = useNavigate();
  const nombre = pendiente.otro?.nombre?.split(" ")[0] || "esta persona";
  const soyCliente = pendiente.miRol === "contratador";

  useEffect(() => {
    const manejar = (e) => {
      if (e.key === "Escape" && !enviando) {
        e.stopPropagation();
        onCerrar();
      }
    };
    document.addEventListener("keydown", manejar, true);
    return () => document.removeEventListener("keydown", manejar, true);
  }, [onCerrar, enviando]);

  const agregarSugerencia = (s) => {
    setError("");
    setTexto((t) => (t.trim() ? `${t.trim().replace(/[.]?$/, ".")} ${s}.` : `${s}.`).slice(0, 1000));
  };

  const enviar = async () => {
    if (!puntuacion) {
      setError("Elegí de 1 a 5 estrellas.");
      return;
    }
    if (texto.trim().length < 5) {
      setError(`Contá en pocas palabras cómo fue con ${nombre}.`);
      return;
    }
    setError("");
    setEnviando(true);
    try {
      await dejarResena({ trabajo: pendiente.trabajo, puntuacion, texto });
      setLista(true);
    } catch (err) {
      if (err.status === 401) {
        cerrarSesionCompleta();
        navegar("/login");
        return;
      }
      if (err.status === 409) {
        setLista(true);
        return;
      }
      setError(err.message || "No se pudo guardar la reseña. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const mostrar = hover || puntuacion;
  return (
    <div className="fondo-resena" onClick={enviando ? undefined : onCerrar}>
      <style>{estilos}</style>
      <div className="tarjeta-resena" role="dialog" aria-modal="true" aria-label="Dejar una reseña" onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-resena" onClick={onCerrar} aria-label="Cerrar" disabled={enviando}>✕</button>
        {lista ? (
          <div className="exito-resena">
            <div className="icono-exito" aria-hidden="true">⭐</div>
            <h2 className="titulo-resena">¡Gracias!</h2>
            <p>Tu reseña sobre {pendiente.otro?.nombre} ya la pueden ver todos.</p>
            <button className="boton-enviar-resena" onClick={() => onListo?.(pendiente)}>Listo</button>
          </div>
        ) : (
          <>
            <h2 className="titulo-resena">Dejá tu reseña</h2>
            <div className="persona-resena">
              <Avatar src={pendiente.otro?.foto} nombre={pendiente.otro?.nombre} tamano={56} />
              <strong>{pendiente.otro?.nombre}</strong>
              <span>
                {soyCliente ? "Te hizo el trabajo" : "Le hiciste el trabajo"}
                {pendiente.aptitud ? ` de ${pendiente.aptitud}` : ""}
                {pendiente.titulo ? `: "${pendiente.titulo}"` : ""}
              </span>
            </div>
            <div className="selector-estrellas" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Puntuación">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={puntuacion === i}
                  aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}: ${ETIQUETAS[i]}`}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => {
                    setPuntuacion(i);
                    setError("");
                  }}
                >
                  <Estrella llena={i <= mostrar} />
                </button>
              ))}
            </div>
            <p className="etiqueta-estrellas">{ETIQUETAS[mostrar] || "Tocá las estrellas"}</p>
            <div className="chips-resena">
              {SUGERENCIAS[pendiente.miRol === "trabajador" ? "trabajador" : "contratador"].map((s) => (
                <button type="button" key={s} className="chip-resena" onClick={() => agregarSugerencia(s)}>+ {s}</button>
              ))}
            </div>
            <textarea
              className="textarea-resena"
              maxLength={1000}
              placeholder={soyCliente ? `¿Cómo trabajó ${nombre}? ¿Lo recomendarías?` : `¿Cómo fue trabajar para ${nombre}?`}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setError("");
              }}
              aria-label="Tu reseña"
            />
            <p className="contador-resena">{texto.length}/1000</p>
            {error && <p className="error-resena" role="alert">{error}</p>}
            <button className="boton-enviar-resena" onClick={enviar} disabled={enviando}>
              {enviando ? "Guardando..." : "Publicar reseña"}
            </button>
            <p className="ayuda-resena">Tu reseña es pública: la ven los que entren a su perfil.</p>
          </>
        )}
      </div>
    </div>
  );
}

const CLAVE_POSPUESTAS = "laburar_resenas_pospuestas";
// En /mensajes no: taparía el campo para escribir (ahí está el botón "Calificar" en la cabecera del chat)
const RUTAS_SIN_AVISO = ["/login", "/paso1", "/paso2", "/paso3", "/mensajes"];

function leerPospuestas() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_POSPUESTAS) || "[]");
  } catch {
    return [];
  }
}

/**
 * Aviso flotante (en cualquier pantalla): cuando terminó un trabajo y falta la reseña,
 * le aparece a los dos (cliente y trabajador). "Más tarde" lo esconde hasta la próxima sesión.
 */
export function AvisoResenasPendientes() {
  const ubicacion = useLocation();
  const [usuario, setUsuario] = useState(() => obtenerSesionUsuario());
  const [pendientes, setPendientes] = useState([]);
  const [pospuestas, setPospuestas] = useState(leerPospuestas);
  const [abierta, setAbierta] = useState(null);
  const [aviso, setAviso] = useState("");

  // Desde una notificación ("Dejale una reseña"): abre la ventana de ese trabajo
  useEffect(() => {
    let temporizador;
    const alPedir = async (evento) => {
      const trabajo = evento.detail?.trabajo || null;
      let lista = [];
      try {
        lista = await obtenerResenasPendientes();
        setPendientes(lista);
      } catch {
        return;
      }
      const elegida = trabajo ? lista.find((p) => String(p.trabajo) === String(trabajo)) : lista[0];
      if (elegida) {
        setAbierta(elegida);
      } else {
        setAviso(trabajo ? "Ya dejaste la reseña de ese trabajo. ¡Gracias!" : "No tenés reseñas pendientes.");
        clearTimeout(temporizador);
        temporizador = setTimeout(() => setAviso(""), 3500);
      }
    };
    window.addEventListener(EVENTO_ABRIR_RESENA, alPedir);
    return () => {
      window.removeEventListener(EVENTO_ABRIR_RESENA, alPedir);
      clearTimeout(temporizador);
    };
  }, []);

  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    return () => window.removeEventListener("laburar-sesion-cambio", actualizar);
  }, []);

  useEffect(() => {
    if (!usuario) return undefined;
    let activo = true;
    const cargar = () =>
      obtenerResenasPendientes()
        .then((lista) => activo && setPendientes(lista))
        .catch(() => activo && setPendientes([]));
    cargar();
    window.addEventListener(EVENTO_RESENAS, cargar);
    const intervalo = setInterval(cargar, 5 * 60 * 1000);
    return () => {
      activo = false;
      window.removeEventListener(EVENTO_RESENAS, cargar);
      clearInterval(intervalo);
    };
  }, [usuario]);

  if (!usuario) return null;
  const visibles = pendientes.filter((p) => !pospuestas.includes(p.trabajo));
  const actual = visibles[0];
  const ocultar = RUTAS_SIN_AVISO.includes(ubicacion.pathname);

  const posponer = () => {
    const nuevas = [...pospuestas, actual.trabajo];
    setPospuestas(nuevas);
    try {
      sessionStorage.setItem(CLAVE_POSPUESTAS, JSON.stringify(nuevas));
    } catch {
      /* sin almacenamiento: se pospone solo mientras siga abierta la página */
    }
  };

  return (
    <>
      {actual && !abierta && !ocultar && (
        <div className="aviso-resena-pendiente" role="status" aria-live="polite">
          <style>{estilos}</style>
          <div className="fila-aviso-resena">
            <Avatar src={actual.otro.foto} nombre={actual.otro.nombre} tamano={42} />
            <div className="texto-aviso-resena">
              <strong>¿Cómo te fue con {actual.otro.nombre?.split(" ")[0]}?</strong>
              <span>
                Terminó {actual.aptitud ? `el trabajo de ${actual.aptitud}` : "el trabajo"}. Dejale una reseña: ayuda a todos a elegir mejor.
              </span>
            </div>
            {visibles.length > 1 && <span className="contador-aviso-resena">1 de {visibles.length}</span>}
          </div>
          <div className="acciones-aviso-resena">
            <button className="secundario" onClick={posponer}>Más tarde</button>
            <button className="principal" onClick={() => setAbierta(actual)}>Dejar reseña</button>
          </div>
        </div>
      )}
      {aviso && (
        <div className="toast-resena" role="status">
          <style>{estilos}</style>
          {aviso}
        </div>
      )}
      {abierta && (
        <DejarResenaModal
          pendiente={abierta}
          onCerrar={() => setAbierta(null)}
          onListo={(p) => {
            setPendientes((lista) => lista.filter((x) => x.trabajo !== p.trabajo));
            setAbierta(null);
          }}
        />
      )}
    </>
  );
}
