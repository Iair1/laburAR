import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import { Modal } from "../componentes/ProblemasUI";
import { estilosProblemas } from "../estilosProblemas";
import { obtenerSesionUsuario, cerrarSesionCompleta } from "../sesion";
import { admin } from "../cuentaApi";

const estilos = `
  .pagina-admin { min-height: 100vh; background: #f7f4f4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #2a2222; }
  .contenido-admin { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
  .titulo-admin { font-size: 1.5rem; font-weight: 800; color: #3b1e0d; margin: 0 0 4px; }
  .subtitulo-admin { font-size: 0.85rem; color: #6b5a5a; margin: 0 0 18px; }
  .numeros-admin { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .numero-admin { background: #fff; border: 1px solid #ecdede; border-radius: 14px; padding: 14px 16px; text-align: left; cursor: pointer; font-family: inherit; }
  .numero-admin:hover { border-color: #c9a9a9; }
  .numero-admin strong { display: block; font-size: 1.6rem; color: #570101; line-height: 1.1; }
  .numero-admin span { font-size: 0.78rem; color: #6b5a5a; font-weight: 600; }
  .numero-admin.alerta strong { color: #b3261e; }
  .pestanas-admin { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .lista-errores-admin { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .error-item-admin { background: #fff; border: 1px solid #e6dcdc; border-radius: 12px; padding: 10px 12px; }
  .cabecera-error-admin { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 0.74rem; color: #555; }
  .origen-error-admin { font-weight: 800; border-radius: 999px; padding: 2px 9px; font-size: 0.66rem; background: #fbeceb; color: #a1261e; }
  .origen-error-admin.navegador { background: #e8f1fb; color: #1d4f8c; }
  .ruta-error-admin { font-size: 0.72rem; background: #f4f2f2; border-radius: 6px; padding: 1px 6px; overflow-wrap: anywhere; }
  .mensaje-error-admin { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.76rem; color: #1a1a1a; margin: 6px 0 4px; overflow-wrap: anywhere; white-space: pre-wrap; }
  .detalle-error-admin { font-size: 0.7rem; background: #f7f5f5; border-radius: 8px; padding: 8px; max-height: 240px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
  .pestana-admin, .filtro-admin {
    border: 1px solid #e3d3d3; background: #fff; color: #570101; border-radius: 999px; padding: 7px 16px;
    font-size: 0.84rem; font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .pestana-admin.activa, .filtro-admin.activo { background: #570101; color: #fff; border-color: #570101; }
  .filtro-admin { padding: 5px 12px; font-size: 0.76rem; }
  .filtros-admin { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; }
  .busqueda-admin { flex: 1; min-width: 200px; border: 1px solid #d9c9c9; border-radius: 999px; padding: 8px 14px; font-size: 0.85rem; font-family: inherit; outline: none; }
  .busqueda-admin:focus { border-color: #570101; }
  .lista-admin { display: flex; flex-direction: column; gap: 10px; }
  .tarjeta-admin { background: #fff; border: 1px solid #ecdede; border-radius: 14px; padding: 14px 16px; }
  .fila-tarjeta-admin { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .chip-admin { font-size: 0.7rem; font-weight: 700; border-radius: 999px; padding: 3px 9px; background: #f4eeee; color: #570101; }
  .chip-admin.rojo { background: #fbeceb; color: #b3261e; }
  .chip-admin.verde { background: #e8f5e9; color: #1e5e22; }
  .chip-admin.amarillo { background: #fff4e5; color: #8a4b00; }
  .fecha-admin { font-size: 0.74rem; color: #8a7a7a; margin-left: auto; }
  .personas-admin { display: flex; align-items: center; gap: 8px; margin: 10px 0 6px; flex-wrap: wrap; font-size: 0.84rem; }
  .persona-admin { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; font-size: inherit; color: #2a2222; font-weight: 700; }
  .persona-admin:hover { color: #570101; text-decoration: underline; }
  .detalle-admin { font-size: 0.84rem; color: #333; line-height: 1.5; white-space: pre-line; margin: 6px 0; }
  .cita-admin { border-left: 3px solid #d9c9c9; padding: 4px 10px; margin: 6px 0; font-size: 0.8rem; color: #555; white-space: pre-line; }
  .cita-admin img { max-width: 220px; max-height: 160px; border-radius: 8px; display: block; margin-top: 4px; }
  .acciones-admin { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .boton-admin { border-radius: 999px; padding: 7px 14px; font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid #570101; background: #fff; color: #570101; }
  .boton-admin:hover { background: #f6eeee; }
  .boton-admin.primario { background: #570101; color: #fff; }
  .boton-admin.peligro { border-color: #b3261e; color: #b3261e; }
  .boton-admin.peligro.lleno { background: #b3261e; color: #fff; }
  .boton-admin.verde { border-color: #1e7a2a; color: #1e7a2a; }
  .boton-admin:disabled { opacity: 0.6; cursor: wait; }
  .usuario-fila-admin { display: flex; align-items: center; gap: 12px; width: 100%; background: #fff; border: 1px solid #ecdede; border-radius: 14px; padding: 10px 14px; cursor: pointer; text-align: left; font-family: inherit; }
  .usuario-fila-admin:hover { border-color: #c9a9a9; }
  .datos-usuario-admin { flex: 1; min-width: 0; }
  .nombre-usuario-admin { font-weight: 800; font-size: 0.9rem; color: #2a2222; }
  .email-usuario-admin { font-size: 0.76rem; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chips-usuario-admin { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
  .vacio-admin { text-align: center; color: #6b5a5a; padding: 30px 10px; background: #fff; border-radius: 14px; border: 1px dashed #e3d3d3; font-size: 0.88rem; }
  .error-admin { color: #b3261e; font-weight: 600; font-size: 0.85rem; margin: 8px 0; }
  .enlace-admin { background: none; border: none; padding: 0; color: #570101; font-weight: 700; font-size: 0.74rem; cursor: pointer; font-family: inherit; }
  .enlace-admin:hover { text-decoration: underline; }
  .ficha-datos-admin { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; font-size: 0.82rem; margin: 10px 0; }
  .ficha-datos-admin div strong { display: block; font-size: 0.68rem; color: #7a2a2a; text-transform: uppercase; letter-spacing: 0.04em; }
  .dni-admin { border: 1px solid #ecdede; border-radius: 12px; padding: 10px; margin: 10px 0; text-align: center; }
  .dni-admin img { max-width: 100%; max-height: 300px; border-radius: 8px; }
  .titulo-seccion-admin { font-size: 0.82rem; font-weight: 800; color: #570101; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.04em; }
  .mini-denuncia-admin { font-size: 0.78rem; border-bottom: 1px solid #f0e6e6; padding: 6px 0; color: #333; }
  .mini-denuncia-admin:last-child { border-bottom: none; }
  @media (max-width: 720px) {
    .numeros-admin { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ficha-datos-admin { grid-template-columns: 1fr; }
    .usuario-fila-admin { flex-wrap: wrap; }
    .chips-usuario-admin { justify-content: flex-start; width: 100%; }
  }
`;

const fechaHora = (f) => (f ? new Date(f).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "");

// Pide un texto en un modal (nota al resolver, motivo de suspensión, etc.)
function PedirTextoModal({ titulo, ayuda, textoBoton, peligro, opcional = true, onConfirmar, onCerrar }) {
  const [texto, setTexto] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const confirmar = async () => {
    if (!opcional && !texto.trim()) {
      setError("Escribí un motivo.");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      await onConfirmar(texto.trim());
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
      setProcesando(false);
    }
  };
  return (
    <Modal etiqueta={titulo} onCerrar={procesando ? undefined : onCerrar} ancho={460}>
      <h2 className="titulo-modal-grande" style={{ fontSize: "1.15rem", textTransform: "none" }}>{titulo}</h2>
      {ayuda && <p className="detalle-modal">{ayuda}</p>}
      <textarea className="textarea-modal" maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={opcional ? "Nota (opcional)" : "Motivo"} aria-label={opcional ? "Nota" : "Motivo"} />
      {error && <p className="error-modal" role="alert">{error}</p>}
      <div className="acciones-modal">
        <button className="boton-pill secundario" onClick={onCerrar} disabled={procesando}>Cancelar</button>
        <button className={`boton-pill ${peligro ? "peligro" : "primario"}`} onClick={confirmar} disabled={procesando}>
          {procesando ? "Guardando..." : textoBoton}
        </button>
      </div>
    </Modal>
  );
}

function FichaUsuario({ userid, onCerrar, onCambio }) {
  const [u, setU] = useState(null);
  const [error, setError] = useState("");
  const [pidiendo, setPidiendo] = useState(null); // "suspender" | "rechazar"
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(() => {
    admin.usuario(userid).then(setU).catch((err) => setError(err.message || "No se pudo cargar."));
  }, [userid]);
  useEffect(cargar, [cargar]);

  const accion = async (funcion) => {
    setProcesando(true);
    setError("");
    try {
      await funcion();
      setPidiendo(null);
      cargar();
      onCambio?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
      throw err;
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal etiqueta="Ficha del usuario" onCerrar={onCerrar} ancho={640}>
      {!u ? (
        <p className="detalle-modal">{error || "Cargando..."}</p>
      ) : (
        <>
          <div className="fila-tarjeta-admin" style={{ paddingRight: 30 }}>
            <Avatar src={u.foto_perfil} nombre={u.nombre_completo} tamano={56} />
            <div>
              <div className="nombre-usuario-admin" style={{ fontSize: "1.1rem" }}>{u.nombre_completo}</div>
              <div className="email-usuario-admin">#{u.id} · {u.email || "sin email"}</div>
              <div className="chips-usuario-admin" style={{ justifyContent: "flex-start", marginTop: 4 }}>
                {u.es_admin && <span className="chip-admin">Admin</span>}
                {u.verificado && <span className="chip-admin verde">✓ Identidad verificada</span>}
                {u.dni_estado === "pendiente" && <span className="chip-admin amarillo">DNI por revisar</span>}
                {u.dni_estado === "rechazado" && <span className="chip-admin rojo">DNI rechazado</span>}
                {u.suspendido && <span className="chip-admin rojo">Suspendido</span>}
              </div>
            </div>
          </div>

          <div className="ficha-datos-admin">
            <div><strong>Teléfono</strong>{u.telefono || "—"}</div>
            <div><strong>Zona</strong>{u.localidad || "—"}</div>
            <div><strong>DNI (número)</strong>{u.dni || "—"}</div>
            <div><strong>Alta</strong>{fechaHora(u.fecha_alta) || "—"}</div>
            <div><strong>Puntaje como trabajador</strong>{u.puntuacion_trabajador ?? "—"}</div>
            <div><strong>Puntaje como cliente</strong>{u.puntuacion_contratador ?? "—"}</div>
            {u.suspendido && <div style={{ gridColumn: "1 / -1" }}><strong>Motivo de la suspensión</strong>{u.motivo_suspension || "—"}</div>}
          </div>

          {u.dni_url && (
            <div className="dni-admin">
              <img src={u.dni_url} alt={`DNI de ${u.nombre_completo}`} />
              <p style={{ fontSize: "0.72rem", color: "#888", margin: "6px 0 0" }}>El link de la foto vence en 10 minutos.</p>
              {u.dni_estado === "pendiente" && (
                <div className="acciones-admin" style={{ justifyContent: "center" }}>
                  <button className="boton-admin verde" disabled={procesando} onClick={() => accion(() => admin.verificarDni(u.id, true)).catch(() => {})}>✓ Aprobar identidad</button>
                  <button className="boton-admin peligro" disabled={procesando} onClick={() => setPidiendo("rechazar")}>Rechazar</button>
                </div>
              )}
            </div>
          )}

          {error && <p className="error-admin" role="alert">{error}</p>}
          {!u.es_admin && (
            <div className="acciones-admin">
              {u.suspendido ? (
                <button className="boton-admin" disabled={procesando} onClick={() => accion(() => admin.suspender(u.id, false)).catch(() => {})}>Quitar suspensión</button>
              ) : (
                <button className="boton-admin peligro lleno" disabled={procesando} onClick={() => setPidiendo("suspender")}>Suspender cuenta</button>
              )}
            </div>
          )}

          <p className="titulo-seccion-admin">Denuncias recibidas ({u.denuncias_recibidas_lista.length})</p>
          {u.denuncias_recibidas_lista.length === 0 ? (
            <p className="detalle-modal" style={{ textAlign: "left" }}>Ninguna.</p>
          ) : (
            u.denuncias_recibidas_lista.map((d) => (
              <div className="mini-denuncia-admin" key={d.id}>
                <strong>{d.motivo}</strong> · {d.estado} · {fechaHora(d.fecha)} · de {d.denunciante_nombre}
                {d.detalle && <div style={{ color: "#666" }}>{d.detalle}</div>}
              </div>
            ))
          )}
          <p className="titulo-seccion-admin">Denuncias que hizo ({u.denuncias_hechas_lista.length})</p>
          {u.denuncias_hechas_lista.length === 0 ? (
            <p className="detalle-modal" style={{ textAlign: "left" }}>Ninguna.</p>
          ) : (
            u.denuncias_hechas_lista.map((d) => (
              <div className="mini-denuncia-admin" key={d.id}>
                <strong>{d.motivo}</strong> · {d.estado} · {fechaHora(d.fecha)} · a {d.denunciado_nombre}
              </div>
            ))
          )}

          {pidiendo === "suspender" && (
            <PedirTextoModal
              titulo={`Suspender a ${u.nombre_completo}`}
              ayuda="No va a poder entrar ni usar su cuenta, y no va a aparecer en las búsquedas. El motivo se le muestra al intentar entrar."
              textoBoton="Suspender"
              peligro
              opcional={false}
              onConfirmar={(motivo) => accion(() => admin.suspender(u.id, true, motivo))}
              onCerrar={() => setPidiendo(null)}
            />
          )}
          {pidiendo === "rechazar" && (
            <PedirTextoModal
              titulo="Rechazar el DNI"
              ayuda="Le avisamos para que suba otra foto. Contale qué falló (ej: la foto está borrosa)."
              textoBoton="Rechazar"
              peligro
              onConfirmar={(nota) => accion(() => admin.verificarDni(u.id, false, nota))}
              onCerrar={() => setPidiendo(null)}
            />
          )}
        </>
      )}
    </Modal>
  );
}

function PestanaDenuncias({ onVerUsuario, onCambio, version }) {
  const [estado, setEstado] = useState("pendiente");
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [resolviendo, setResolviendo] = useState(null); // { denuncia, estado }

  const cargar = useCallback(() => {
    admin.denuncias(estado)
      .then((r) => {
        setError("");
        setLista(r);
      })
      .catch((err) => setError(err.message || "No se pudieron cargar."));
  }, [estado]);
  useEffect(cargar, [cargar, version]);

  return (
    <>
      <div className="filtros-admin">
        {[["pendiente", "Pendientes"], ["resuelta", "Resueltas"], ["descartada", "Descartadas"]].map(([valor, texto]) => (
          <button key={valor} className={`filtro-admin ${estado === valor ? "activo" : ""}`} onClick={() => { setLista(null); setEstado(valor); }}>{texto}</button>
        ))}
      </div>
      {error && <p className="error-admin">{error}</p>}
      {lista === null ? (
        <p className="vacio-admin">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="vacio-admin">{estado === "pendiente" ? "No hay denuncias para revisar. 🎉" : "No hay denuncias acá."}</p>
      ) : (
        <div className="lista-admin">
          {lista.map((d) => (
            <article className="tarjeta-admin" key={d.id}>
              <div className="fila-tarjeta-admin">
                <span className="chip-admin rojo">{d.motivo}</span>
                {d.denuncias_al_denunciado > 1 && <span className="chip-admin amarillo">{d.denuncias_al_denunciado} denuncias contra esta persona</span>}
                {d.denunciado_suspendido && <span className="chip-admin">Ya suspendido</span>}
                <span className="fecha-admin">{fechaHora(d.fecha)}</span>
              </div>
              <div className="personas-admin">
                <button className="persona-admin" onClick={() => onVerUsuario(d.denuncianteid)}>
                  <Avatar src={d.denunciante_foto} nombre={d.denunciante_nombre || "?"} tamano={26} />{d.denunciante_nombre || "Usuario"}
                </button>
                <span>denunció a</span>
                <button className="persona-admin" onClick={() => onVerUsuario(d.denunciadoid)}>
                  <Avatar src={d.denunciado_foto} nombre={d.denunciado_nombre || "?"} tamano={26} />{d.denunciado_nombre || "Usuario"}
                </button>
              </div>
              {d.detalle && <p className="detalle-admin">{d.detalle}</p>}
              {(d.mensaje_texto || d.mensaje_imagen) && (
                <div className="cita-admin">
                  <strong>Mensaje denunciado:</strong> {d.mensaje_texto}
                  {d.mensaje_imagen && <img src={d.mensaje_imagen} alt="Foto del mensaje denunciado" />}
                </div>
              )}
              {d.solicitud_texto && <div className="cita-admin"><strong>Trabajo:</strong> {d.solicitud_texto}</div>}
              {d.nota_admin && <div className="cita-admin"><strong>Nota:</strong> {d.nota_admin}</div>}
              <div className="acciones-admin">
                <button className="boton-admin" onClick={() => onVerUsuario(d.denunciadoid)}>Ver denunciado</button>
                {d.estado === "pendiente" && (
                  <>
                    <button className="boton-admin primario" onClick={() => setResolviendo({ denuncia: d, estado: "resuelta" })}>Marcar resuelta</button>
                    <button className="boton-admin" onClick={() => setResolviendo({ denuncia: d, estado: "descartada" })}>Descartar</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {resolviendo && (
        <PedirTextoModal
          titulo={resolviendo.estado === "resuelta" ? "Marcar como resuelta" : "Descartar la denuncia"}
          ayuda={resolviendo.estado === "resuelta" ? "Anotá qué se hizo (ej: se suspendió la cuenta, se habló con la persona)." : "Anotá por qué no corresponde."}
          textoBoton={resolviendo.estado === "resuelta" ? "Resolver" : "Descartar"}
          onConfirmar={async (nota) => {
            await admin.resolverDenuncia(resolviendo.denuncia.id, resolviendo.estado, nota);
            setResolviendo(null);
            cargar();
            onCambio?.();
          }}
          onCerrar={() => setResolviendo(null)}
        />
      )}
    </>
  );
}

function PestanaUsuarios({ filtroInicial, onVerUsuario, version }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState(filtroInicial || "");
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const t = setTimeout(() => {
      admin.usuarios(busqueda, filtro)
        .then((r) => activo && setLista(r))
        .catch((err) => activo && setError(err.message || "No se pudieron cargar."));
    }, 250);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [busqueda, filtro, version]);

  return (
    <>
      <div className="filtros-admin">
        <input className="busqueda-admin" type="search" placeholder="Buscar por nombre, email o número" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar usuarios" />
        {[["", "Todos"], ["dni", "DNI por revisar"], ["denunciados", "Con denuncias"], ["suspendidos", "Suspendidos"]].map(([valor, texto]) => (
          <button key={valor || "todos"} className={`filtro-admin ${filtro === valor ? "activo" : ""}`} onClick={() => setFiltro(valor)}>{texto}</button>
        ))}
      </div>
      {error && <p className="error-admin">{error}</p>}
      {lista === null ? (
        <p className="vacio-admin">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="vacio-admin">No hay usuarios con ese criterio.</p>
      ) : (
        <div className="lista-admin">
          {lista.map((u) => (
            <button className="usuario-fila-admin" key={u.id} onClick={() => onVerUsuario(u.id)}>
              <Avatar src={u.foto_perfil} nombre={u.nombre_completo} tamano={40} />
              <div className="datos-usuario-admin">
                <div className="nombre-usuario-admin">{u.nombre_completo}</div>
                <div className="email-usuario-admin">#{u.id} · {u.email || "sin email"} · {u.localidad || "sin zona"}</div>
              </div>
              <div className="chips-usuario-admin">
                {u.es_admin && <span className="chip-admin">Admin</span>}
                {u.verificado && <span className="chip-admin verde">✓ Verificado</span>}
                {u.dni_estado === "pendiente" && <span className="chip-admin amarillo">DNI por revisar</span>}
                {u.denuncias_pendientes > 0 && <span className="chip-admin rojo">{u.denuncias_pendientes} denuncia{u.denuncias_pendientes === 1 ? "" : "s"}</span>}
                {u.suspendido && <span className="chip-admin rojo">Suspendido</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* Errores del servidor y del navegador (los más nuevos primero) */
function PestanaErrores({ version }) {
  const [origen, setOrigen] = useState("");
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    let activo = true;
    admin.errores(origen)
      .then((filas) => activo && setLista(filas))
      .catch((err) => activo && setError(err.message || "No se pudieron cargar los errores."));
    return () => {
      activo = false;
    };
  }, [origen, version]);

  return (
    <section aria-label="Errores">
      <div className="filtros-admin">
        {[["", "Todos"], ["servidor", "Del servidor"], ["navegador", "Del navegador"]].map(([valor, texto]) => (
          <button key={valor || "todos"} className={`filtro-admin ${origen === valor ? "activo" : ""}`} onClick={() => { setLista(null); setOrigen(valor); }}>{texto}</button>
        ))}
      </div>
      {error && <p className="error-admin">{error}</p>}
      {!lista ? (
        <p className="vacio-admin">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="vacio-admin">No hay errores anotados. ¡Bien ahí!</p>
      ) : (
        <ul className="lista-errores-admin">
          {lista.map((e) => (
            <li key={e.id} className="error-item-admin">
              <div className="cabecera-error-admin">
                <span className={`origen-error-admin ${e.origen}`}>{e.origen === "navegador" ? "Navegador" : "Servidor"}</span>
                <span className="fecha-error-admin">{new Date(e.fecha).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                {e.ruta && <code className="ruta-error-admin">{e.metodo ? `${e.metodo} ` : ""}{e.ruta}</code>}
                {e.usuario_nombre && <span className="usuario-error-admin">· {e.usuario_nombre}</span>}
              </div>
              <p className="mensaje-error-admin">{e.mensaje}</p>
              {e.detalle && (
                <>
                  <button className="enlace-admin" onClick={() => setAbierto(abierto === e.id ? null : e.id)}>
                    {abierto === e.id ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                  {abierto === e.id && <pre className="detalle-error-admin">{e.detalle}</pre>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Admin() {
  const navegar = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [error, setError] = useState("");
  // ?pestana=errores (desde el email de aviso de errores)
  const [pestana, setPestana] = useState(() =>
    new URLSearchParams(window.location.search).get("pestana") === "errores" ? "errores" : "denuncias");
  const [filtroUsuarios, setFiltroUsuarios] = useState("");
  const [usuarioAbierto, setUsuarioAbierto] = useState(null);
  const [version, setVersion] = useState(0);
  const sesion = obtenerSesionUsuario();

  const cargarResumen = useCallback(() => {
    admin.resumen()
      .then(setResumen)
      .catch((err) => {
        if (err.status === 401) {
          cerrarSesionCompleta();
          navegar("/login?volver=/admin");
        } else if (err.status === 403) setSinAcceso(true);
        else setError(err.message || "No se pudo cargar el panel.");
      });
  }, [navegar]);

  useEffect(() => {
    if (!sesion || !localStorage.getItem("token")) {
      navegar("/login?volver=/admin");
      return;
    }
    cargarResumen();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const actualizarTodo = () => {
    cargarResumen();
    setVersion((v) => v + 1);
  };

  const irA = (nuevaPestana, filtro = "") => {
    setPestana(nuevaPestana);
    setFiltroUsuarios(filtro);
  };

  return (
    <div className="pagina-admin">
      <style>{estilosProblemas}</style>
      <style>{estilos}</style>
      <BarraNav />
      <main className="contenido-admin">
        <h1 className="titulo-admin">Panel de administración</h1>
        {sinAcceso ? (
          <p className="vacio-admin">Esta página es solo para administradores.</p>
        ) : (
          <>
            <p className="subtitulo-admin">Revisá denuncias, verificá identidades y suspendé cuentas que no cumplen las reglas.</p>
            {error && <p className="error-admin">{error}</p>}
            <div className="numeros-admin">
              <button className={`numero-admin ${resumen?.denuncias_pendientes ? "alerta" : ""}`} onClick={() => irA("denuncias")}>
                <strong>{resumen?.denuncias_pendientes ?? "…"}</strong><span>Denuncias por revisar</span>
              </button>
              <button className={`numero-admin ${resumen?.dni_pendientes ? "alerta" : ""}`} onClick={() => irA("usuarios", "dni")}>
                <strong>{resumen?.dni_pendientes ?? "…"}</strong><span>DNI por verificar</span>
              </button>
              <button className="numero-admin" onClick={() => irA("usuarios", "suspendidos")}>
                <strong>{resumen?.suspendidos ?? "…"}</strong><span>Cuentas suspendidas</span>
              </button>
              <button className="numero-admin" onClick={() => irA("usuarios", "")}>
                <strong>{resumen?.usuarios ?? "…"}</strong><span>Usuarios</span>
              </button>
              <button className={`numero-admin ${resumen?.errores_24h ? "alerta" : ""}`} onClick={() => irA("errores")}>
                <strong>{resumen?.errores_24h ?? "…"}</strong><span>Errores (24 h)</span>
              </button>
            </div>
            <div className="pestanas-admin" role="tablist">
              <button role="tab" aria-selected={pestana === "denuncias"} className={`pestana-admin ${pestana === "denuncias" ? "activa" : ""}`} onClick={() => irA("denuncias")}>Denuncias</button>
              <button role="tab" aria-selected={pestana === "usuarios"} className={`pestana-admin ${pestana === "usuarios" ? "activa" : ""}`} onClick={() => irA("usuarios", filtroUsuarios)}>Usuarios</button>
              <button role="tab" aria-selected={pestana === "errores"} className={`pestana-admin ${pestana === "errores" ? "activa" : ""}`} onClick={() => irA("errores")}>Errores</button>
            </div>
            {pestana === "denuncias" ? (
              <PestanaDenuncias onVerUsuario={setUsuarioAbierto} onCambio={cargarResumen} version={version} />
            ) : pestana === "errores" ? (
              <PestanaErrores version={version} />
            ) : (
              <PestanaUsuarios key={filtroUsuarios} filtroInicial={filtroUsuarios} onVerUsuario={setUsuarioAbierto} version={version} />
            )}
          </>
        )}
      </main>
      {usuarioAbierto && (
        <FichaUsuario userid={usuarioAbierto} onCerrar={() => setUsuarioAbierto(null)} onCambio={actualizarTodo} />
      )}
    </div>
  );
}
