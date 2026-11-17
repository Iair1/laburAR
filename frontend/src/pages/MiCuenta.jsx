import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import Avatar from "../componentes/Avatar";
import SelectorZona from "../componentes/SelectorZona";
import { ResenasDeUsuario, ResumenPuntaje } from "../componentes/Resenas";
import { obtenerSesionUsuario, cerrarSesionCompleta, actualizarFotoSesion } from "../sesion";
import { obtenerMiPerfil, cambiarDatos, cambiarContrasena, subirFotoPerfil, TIPOS_FOTO_PERFIL } from "../api";
import { obtenerResenasDe } from "../resenasApi";
import { normalizarZona } from "../zonas";

const estilos = `
  .pagina-cuenta { min-height: 100vh; background: #f3f1ef; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .contenido-cuenta { max-width: 920px; margin: 0 auto; padding: 1.75rem 1.5rem 3rem; }
  .titulo-cuenta { font-size: 1.6rem; font-weight: 900; color: #111; text-transform: uppercase; }
  .subtitulo-cuenta { font-size: 0.86rem; color: #555; margin: 4px 0 1.2rem; }
  .grilla-cuenta { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.1rem; }
  .tarjeta-cuenta { background: #fff; border: 1px solid #ddd3d3; border-radius: 16px; padding: 1.2rem 1.3rem; }
  .tarjeta-cuenta.ancha { grid-column: 1 / -1; }
  .titulo-tarjeta-cuenta { font-size: 0.98rem; font-weight: 800; color: #1a1a1a; margin-bottom: 2px; }
  .ayuda-tarjeta-cuenta { font-size: 0.74rem; color: #777; margin-bottom: 0.9rem; line-height: 1.45; }
  .perfil-cuenta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .nombre-cuenta { font-size: 1.15rem; font-weight: 800; color: #1a1a1a; }
  .puntajes-cuenta { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; font-size: 0.76rem; color: #555; }
  .puntajes-cuenta span.rol { font-weight: 700; color: #3b1e0d; min-width: 108px; display: inline-block; }
  .etiqueta-cuenta { display: block; font-size: 0.78rem; font-weight: 600; color: #333; margin: 0.7rem 0 0.3rem; }
  .entrada-cuenta, .textarea-cuenta, .boton-zona-cuenta {
    width: 100%; box-sizing: border-box; border: 1px solid #b9a9a9; border-radius: 10px; padding: 9px 12px; font-size: 0.85rem;
    font-family: inherit; color: #222; background: #fff; outline: none;
  }
  .entrada-cuenta:focus, .textarea-cuenta:focus { border-color: #570101; box-shadow: 0 0 0 3px rgba(87,1,1,0.1); }
  .textarea-cuenta { min-height: 96px; resize: vertical; line-height: 1.45; }
  .fila-cuenta { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; }
  .acciones-cuenta { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 0.9rem; flex-wrap: wrap; }
  .boton-cuenta {
    background: #570101; color: #fff; border: 1px solid #570101; border-radius: 999px; padding: 8px 18px; font-size: 0.8rem;
    font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .boton-cuenta:hover { background: #3b1e0d; }
  .boton-cuenta:disabled { opacity: 0.6; cursor: not-allowed; }
  .boton-cuenta.secundario { background: #fff; color: #1a1a1a; border-color: #b9a3a3; }
  .boton-cuenta.secundario:hover { background: #f4eeee; }
  .ok-cuenta { font-size: 0.76rem; color: #1e6b2d; font-weight: 700; }
  .error-cuenta { font-size: 0.76rem; color: #b3261e; font-weight: 700; }
  .privado-cuenta { font-size: 0.7rem; color: #2e6b2d; margin-top: 6px; }
  .pestanas-cuenta { display: flex; gap: 6px; margin-bottom: 0.8rem; }
  .pestana-cuenta {
    border: 1px solid #8f8f8f; background: #c9c9c9; color: #1a1a1a; border-radius: 999px; padding: 6px 14px; font-size: 0.74rem;
    font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .pestana-cuenta.activa { background: #7a2a2a; border-color: #570101; color: #fff; }
  .esqueleto-cuenta { height: 160px; border-radius: 16px; background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%); background-size: 400% 100%; animation: brillo-cuenta 1.3s ease infinite; }
  @keyframes brillo-cuenta { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
  @media (max-width: 760px) {
    .grilla-cuenta { grid-template-columns: 1fr; }
    .contenido-cuenta { padding: 1.1rem 1rem 2.5rem; }
    .fila-cuenta { grid-template-columns: 1fr 1fr; }
    .fila-cuenta > :first-child { grid-column: 1 / -1; }
  }
`;

function Aviso({ estado }) {
  if (!estado) return null;
  return estado.ok ? <span className="ok-cuenta" role="status">✓ {estado.texto}</span> : <span className="error-cuenta" role="alert">{estado.texto}</span>;
}

export default function MiCuenta() {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState(() => obtenerSesionUsuario());
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [resumenResenas, setResumenResenas] = useState(null);

  const [zona, setZona] = useState("");
  const [direccion, setDireccion] = useState({ calle: "", altura: "", cp: "" });
  const [sobreMi, setSobreMi] = useState("");
  const [contrasenas, setContrasenas] = useState({ actual: "", nueva: "", repetir: "" });
  const [guardando, setGuardando] = useState("");
  const [estados, setEstados] = useState({});
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [rolResenas, setRolResenas] = useState("trabajador");
  const elegirFoto = useRef(null);

  const vencida = (err) => {
    if (err?.status === 401) {
      cerrarSesionCompleta();
      navegar("/login?volver=%2Fmi-cuenta");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!usuario) {
      navegar("/login?volver=%2Fmi-cuenta", { replace: true });
      return undefined;
    }
    let activo = true;
    obtenerMiPerfil()
      .then((p) => {
        if (!activo || !p) return;
        setPerfil(p);
        setZona(normalizarZona(p.localidad));
        setDireccion({ calle: p.direccion_calle || "", altura: p.direccion_altura || "", cp: p.codigo_postal || "" });
        setSobreMi(p.sobre_mi || "");
      })
      .catch((err) => {
        if (!activo || vencida(err)) return;
        setError(err.message || "No se pudo cargar tu cuenta.");
      });
    obtenerResenasDe(usuario.id)
      .then((d) => activo && setResumenResenas(d))
      .catch(() => {});
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const actualizar = () => setUsuario(obtenerSesionUsuario());
    window.addEventListener("laburar-sesion-cambio", actualizar);
    return () => window.removeEventListener("laburar-sesion-cambio", actualizar);
  }, []);

  const marcar = (clave, estado) => setEstados((e) => ({ ...e, [clave]: estado }));

  const guardar = async (clave, inf, textoOk) => {
    setGuardando(clave);
    marcar(clave, null);
    try {
      await cambiarDatos(inf);
      marcar(clave, { ok: true, texto: textoOk });
    } catch (err) {
      if (!vencida(err)) marcar(clave, { ok: false, texto: err.message || "No se pudo guardar." });
    } finally {
      setGuardando("");
    }
  };

  const guardarZona = () => {
    if (!zona) {
      marcar("zona", { ok: false, texto: "Elegí una zona." });
      return;
    }
    guardar("zona", [{ dato: "localidad", valor: zona }], "Guardaste tu zona");
  };

  const guardarDireccion = () =>
    guardar(
      "direccion",
      [
        { dato: "direccion_calle", valor: direccion.calle.trim() },
        { dato: "direccion_altura", valor: direccion.altura.trim() },
        { dato: "codigo_postal", valor: direccion.cp.trim() },
      ],
      "Guardaste tu dirección"
    );

  const guardarSobreMi = () => guardar("sobreMi", [{ dato: "sobre_mi", valor: sobreMi.trim() }], "Guardaste tu presentación");

  const guardarContrasena = async () => {
    if (!contrasenas.actual || !contrasenas.nueva) {
      marcar("contrasena", { ok: false, texto: "Completá tu contraseña actual y la nueva." });
      return;
    }
    if (contrasenas.nueva.length < 4) {
      marcar("contrasena", { ok: false, texto: "La contraseña nueva tiene que tener al menos 4 caracteres." });
      return;
    }
    if (contrasenas.nueva !== contrasenas.repetir) {
      marcar("contrasena", { ok: false, texto: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setGuardando("contrasena");
    marcar("contrasena", null);
    try {
      await cambiarContrasena(contrasenas.actual, contrasenas.nueva);
      setContrasenas({ actual: "", nueva: "", repetir: "" });
      marcar("contrasena", { ok: true, texto: "Cambiaste tu contraseña" });
    } catch (err) {
      if (!vencida(err)) {
        const mensaje = /incorrect|invalid|no coincide/i.test(err.message || "") ? "La contraseña actual no es correcta." : err.message;
        marcar("contrasena", { ok: false, texto: mensaje || "No se pudo cambiar la contraseña." });
      }
    } finally {
      setGuardando("");
    }
  };

  const cambiarFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setSubiendoFoto(true);
    marcar("foto", null);
    try {
      const url = await subirFotoPerfil(archivo);
      actualizarFotoSesion(url);
      marcar("foto", { ok: true, texto: "Cambiaste tu foto" });
    } catch (err) {
      if (!vencida(err)) marcar("foto", { ok: false, texto: err.message || "No se pudo cambiar la foto." });
    } finally {
      setSubiendoFoto(false);
    }
  };

  if (!usuario) return null;

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-cuenta">
        <BarraNav />
        <main className="contenido-cuenta">
          <h1 className="titulo-cuenta">Mi cuenta</h1>
          <p className="subtitulo-cuenta">Tus datos, dónde estás y lo que opinan de vos.</p>

          {error ? (
            <div className="tarjeta-cuenta"><span className="error-cuenta">{error}</span></div>
          ) : !perfil ? (
            <div className="grilla-cuenta"><div className="esqueleto-cuenta" /><div className="esqueleto-cuenta" /></div>
          ) : (
            <div className="grilla-cuenta">
              <section className="tarjeta-cuenta ancha" aria-label="Tu perfil">
                <div className="perfil-cuenta">
                  <Avatar src={usuario.fotoPerfilURL} nombre={usuario.nombre} tamano={84} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="nombre-cuenta">{perfil.nombre_completo || usuario.nombre}</div>
                    <div className="puntajes-cuenta">
                      <div><span className="rol">Como trabajador:</span> <ResumenPuntaje promedio={resumenResenas?.comoTrabajador.promedio} cantidad={resumenResenas?.comoTrabajador.cantidad || 0} /></div>
                      <div><span className="rol">Como cliente:</span> <ResumenPuntaje promedio={resumenResenas?.comoCliente.promedio} cantidad={resumenResenas?.comoCliente.cantidad || 0} /></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <button className="boton-cuenta secundario" onClick={() => elegirFoto.current?.click()} disabled={subiendoFoto}>
                      {subiendoFoto ? "Subiendo..." : usuario.fotoPerfilURL ? "Cambiar foto" : "Agregar foto"}
                    </button>
                    <input ref={elegirFoto} type="file" accept={TIPOS_FOTO_PERFIL.join(",")} style={{ display: "none" }} onChange={cambiarFoto} />
                    <Aviso estado={estados.foto} />
                  </div>
                </div>
              </section>

              <section className="tarjeta-cuenta" aria-label="Tu zona">
                <p className="titulo-tarjeta-cuenta">Tu zona</p>
                <p className="ayuda-tarjeta-cuenta">Es donde aparecés en las búsquedas (si ofrecés servicios) y la que se completa sola al subir un problema.</p>
                <SelectorZona valor={{ zona, barrio: "" }} onCambio={(l) => { setZona(l.zona); marcar("zona", null); }} conBarrio={false} claseBoton="boton-zona-cuenta" placeholder="Elegí tu zona" ariaLabel="Tu zona" />
                <div className="acciones-cuenta">
                  <Aviso estado={estados.zona} />
                  <button className="boton-cuenta" onClick={guardarZona} disabled={guardando === "zona"}>{guardando === "zona" ? "Guardando..." : "Guardar zona"}</button>
                </div>
              </section>

              <section className="tarjeta-cuenta" aria-label="Tu dirección">
                <p className="titulo-tarjeta-cuenta">Tu dirección</p>
                <p className="ayuda-tarjeta-cuenta">No se le muestra a nadie. Cuando tengas una cita, pasásela por mensaje a la otra persona.</p>
                <div className="fila-cuenta">
                  <div>
                    <label className="etiqueta-cuenta" htmlFor="calle-cuenta" style={{ marginTop: 0 }}>Calle</label>
                    <input id="calle-cuenta" className="entrada-cuenta" value={direccion.calle} maxLength={80} onChange={(e) => { setDireccion((d) => ({ ...d, calle: e.target.value })); marcar("direccion", null); }} />
                  </div>
                  <div>
                    <label className="etiqueta-cuenta" htmlFor="altura-cuenta" style={{ marginTop: 0 }}>Altura</label>
                    <input id="altura-cuenta" className="entrada-cuenta" value={direccion.altura} maxLength={10} onChange={(e) => { setDireccion((d) => ({ ...d, altura: e.target.value })); marcar("direccion", null); }} />
                  </div>
                  <div>
                    <label className="etiqueta-cuenta" htmlFor="cp-cuenta" style={{ marginTop: 0 }}>Cód. postal</label>
                    <input id="cp-cuenta" className="entrada-cuenta" value={direccion.cp} maxLength={10} onChange={(e) => { setDireccion((d) => ({ ...d, cp: e.target.value })); marcar("direccion", null); }} />
                  </div>
                </div>
                <p className="privado-cuenta">🔒 Privada</p>
                <div className="acciones-cuenta">
                  <Aviso estado={estados.direccion} />
                  <button className="boton-cuenta" onClick={guardarDireccion} disabled={guardando === "direccion"}>{guardando === "direccion" ? "Guardando..." : "Guardar dirección"}</button>
                </div>
              </section>

              <section className="tarjeta-cuenta" aria-label="Sobre mí">
                <p className="titulo-tarjeta-cuenta">Sobre mí</p>
                <p className="ayuda-tarjeta-cuenta">Una presentación corta. Se ve en tu perfil si ofrecés servicios.</p>
                <textarea className="textarea-cuenta" maxLength={600} value={sobreMi} onChange={(e) => { setSobreMi(e.target.value); marcar("sobreMi", null); }} placeholder="Ej: Soy plomero matriculado, trabajo en zona norte hace 10 años." aria-label="Sobre mí" />
                <div className="acciones-cuenta">
                  <Aviso estado={estados.sobreMi} />
                  <button className="boton-cuenta" onClick={guardarSobreMi} disabled={guardando === "sobreMi"}>{guardando === "sobreMi" ? "Guardando..." : "Guardar"}</button>
                </div>
              </section>

              <section className="tarjeta-cuenta" aria-label="Contraseña">
                <p className="titulo-tarjeta-cuenta">Cambiar contraseña</p>
                <label className="etiqueta-cuenta" htmlFor="contrasena-actual">Contraseña actual</label>
                <input id="contrasena-actual" type="password" className="entrada-cuenta" autoComplete="current-password" value={contrasenas.actual} onChange={(e) => { setContrasenas((c) => ({ ...c, actual: e.target.value })); marcar("contrasena", null); }} />
                <label className="etiqueta-cuenta" htmlFor="contrasena-nueva">Nueva</label>
                <input id="contrasena-nueva" type="password" className="entrada-cuenta" autoComplete="new-password" value={contrasenas.nueva} onChange={(e) => { setContrasenas((c) => ({ ...c, nueva: e.target.value })); marcar("contrasena", null); }} />
                <label className="etiqueta-cuenta" htmlFor="contrasena-repetir">Repetí la nueva</label>
                <input id="contrasena-repetir" type="password" className="entrada-cuenta" autoComplete="new-password" value={contrasenas.repetir} onChange={(e) => { setContrasenas((c) => ({ ...c, repetir: e.target.value })); marcar("contrasena", null); }} />
                <div className="acciones-cuenta">
                  <Aviso estado={estados.contrasena} />
                  <button className="boton-cuenta" onClick={guardarContrasena} disabled={guardando === "contrasena"}>{guardando === "contrasena" ? "Guardando..." : "Cambiar contraseña"}</button>
                </div>
              </section>

              <section className="tarjeta-cuenta ancha" aria-label="Mis reseñas">
                <p className="titulo-tarjeta-cuenta">Lo que opinan de vos</p>
                <p className="ayuda-tarjeta-cuenta">Las reseñas que te dejaron después de cada trabajo. Las ve cualquiera que entre a tu perfil.</p>
                <div className="pestanas-cuenta" role="tablist">
                  <button role="tab" aria-selected={rolResenas === "trabajador"} className={`pestana-cuenta ${rolResenas === "trabajador" ? "activa" : ""}`} onClick={() => setRolResenas("trabajador")}>
                    Como trabajador ({resumenResenas?.comoTrabajador.cantidad ?? 0})
                  </button>
                  <button role="tab" aria-selected={rolResenas === "cliente"} className={`pestana-cuenta ${rolResenas === "cliente" ? "activa" : ""}`} onClick={() => setRolResenas("cliente")}>
                    Como cliente ({resumenResenas?.comoCliente.cantidad ?? 0})
                  </button>
                </div>
                <ResenasDeUsuario key={rolResenas} userid={usuario.id} rol={rolResenas} limite={5} />
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
