import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesionUsuario, guardarPublicacion, archivoADataURL } from "../sesion";

const estilos = `
  * { box-sizing: border-box; }
  .pagina-ofrecer {
    min-height: 100vh;
    background: #f5f5f3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 2.5rem 1.5rem 4rem;
  }
  .contenedor-ofrecer {
    max-width: 640px;
    margin: 0 auto;
  }
  .encabezado-ofrecer { text-align: center; margin-bottom: 1.75rem; }
  .titulo-ofrecer { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; letter-spacing: -0.02em; margin-bottom: 6px; }
  .subtitulo-ofrecer { font-size: 0.88rem; color: #666; }

  .tarjeta-form {
    background: #fff;
    border: 1px solid #e2e2df;
    border-radius: 14px;
    padding: 1.75rem;
    margin-bottom: 1.1rem;
  }
  .titulo-seccion { font-size: 0.95rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.3rem; }
  .ayuda-seccion { font-size: 0.78rem; color: #888; margin-bottom: 1rem; }

  .campo { margin-bottom: 1rem; }
  .campo:last-child { margin-bottom: 0; }
  .etiqueta-campo {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.4rem;
  }
  .entrada-ofrecer, .textarea-ofrecer, .select-ofrecer {
    width: 100%;
    padding: 11px 13px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #222;
    outline: none;
    font-family: inherit;
    background: #fbfbfa;
  }
  .entrada-ofrecer:focus, .textarea-ofrecer:focus, .select-ofrecer:focus { border-color: #999; }
  .textarea-ofrecer { resize: vertical; min-height: 90px; line-height: 1.4; }
  .fila-dos { display: flex; gap: 12px; }
  .fila-dos > div { flex: 1; }

  .chips-dias { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip-dia {
    padding: 7px 13px;
    border-radius: 999px;
    border: 1.5px solid #ddd;
    background: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    user-select: none;
  }
  .chip-dia.activo { background: #1a2332; border-color: #1a2332; color: #fff; }

  .subida-caja {
    border: 2px dashed #c7cfdb;
    background: #f5f7fa;
    border-radius: 10px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .subida-caja:hover { border-color: #9aa8bd; }
  .subida-caja svg { flex-shrink: 0; color: #8a97ab; }
  .subida-texto-titulo { font-size: 0.82rem; font-weight: 600; color: #333; }
  .subida-texto-sub { font-size: 0.74rem; color: #888; margin-top: 2px; }
  .subida-ok { color: #2e7d32; font-weight: 700; }

  .fila-matricula {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 12px;
  }
  .punto-check {
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    border: 1.5px solid #ccc; display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
  }
  .punto-check.activo { background: #1a2332; border-color: #1a2332; }
  .texto-check { font-size: 0.84rem; font-weight: 600; color: #1a2332; }

  .fila-terminos {
    display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;
  }
  .texto-terminos { font-size: 0.82rem; color: #444; line-height: 1.4; }

  .aviso-confianza {
    display: flex; gap: 10px; align-items: flex-start;
    background: #eef4ff; border: 1px solid #d5e3fb; border-radius: 10px;
    padding: 12px 14px; font-size: 0.78rem; color: #33507a; margin-bottom: 1.1rem;
  }

  .error-form { font-size: 0.82rem; color: #d0341a; font-weight: 600; text-align: center; margin-bottom: 10px; }

  .boton-publicar {
    width: 100%;
    padding: 14px;
    background: #1a2332;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background 0.15s;
  }
  .boton-publicar:hover { background: #0f1621; }
  .boton-publicar:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const CATEGORIAS = [
  "Electricidad", "Plomería", "Jardinería", "Pintura", "Mudanza",
  "Limpieza", "Carpintería", "Albañilería", "Gasista", "Piletero",
  "Herrería", "Cerrajería", "Informática", "Aire acondicionado", "Soldadura",
];

const ZONAS = [
  "CABA", "GBA Norte", "GBA Sur", "GBA Oeste", "Córdoba Capital",
  "Rosario", "Mendoza Capital", "La Plata", "Mar del Plata", "Tucumán",
  "Salta Capital", "Santa Fe Capital", "Neuquén Capital", "Bahía Blanca",
];

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const EMOJI_POR_CATEGORIA = {
  Electricidad: "⚡", Plomería: "🔧", Jardinería: "🌿", Pintura: "🖌️", Mudanza: "📦",
  Limpieza: "🧽", Carpintería: "🪚", Albañilería: "🧱", Gasista: "🔥", Piletero: "🏊",
  Herrería: "⚒️", Cerrajería: "🔑", Informática: "💻", "Aire acondicionado": "❄️", Soldadura: "🔩",
};

export default function OfrecerServicios() {
  const navegar = useNavigate();
  const usuario = obtenerSesionUsuario();

  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [zona, setZona] = useState("");
  const [precio, setPrecio] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [tieneMatricula, setTieneMatricula] = useState(false);
  const [archivoMatricula, setArchivoMatricula] = useState(null);
  const [archivoDni, setArchivoDni] = useState(null);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const refMatricula = useRef(null);
  const refDni = useRef(null);

  // Sin sesión no se puede ofrecer servicios
  useEffect(() => {
    if (!usuario) navegar("/login");
  }, [usuario, navegar]);

  if (!usuario) return null;

  const alternarDia = (dia) => {
    setDiasDisponibles((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const manejarPublicar = async () => {
    if (!categoria || !descripcion || !zona || !precio || !experiencia) {
      setError("Completá todos los campos del servicio para poder publicar.");
      return;
    }
    if (Number(precio) <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    if (!archivoDni) {
      setError("Subí tu DNI para verificar tu identidad. Es lo que le da confianza a los clientes.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Tenés que aceptar los términos y condiciones para publicar.");
      return;
    }

    setError("");
    setCargando(true);
    try {
      const [dniURL, matriculaURL] = await Promise.all([
        archivoADataURL(archivoDni),
        archivoADataURL(archivoMatricula),
      ]);

      guardarPublicacion({
        id: Date.now(),
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        fotoPerfilURL: usuario.fotoPerfilURL,
        avatar: EMOJI_POR_CATEGORIA[categoria] || "🛠️",
        categoria: categoria.toLowerCase(),
        etiquetaCategoria: categoria,
        descripcion,
        zona,
        precio: Number(precio),
        experiencia,
        tieneMatricula,
        matriculaURL,
        dniURL,
        diasDisponibles,
        calificacion: 0,
        reseñas: 0,
        verificado: true,
      });

      navegar("/buscar");
    } catch (err) {
      setError("Ocurrió un error al publicar. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-ofrecer">
        <div className="contenedor-ofrecer">
          <div className="encabezado-ofrecer">
            <h1 className="titulo-ofrecer">Ofrecé tu servicio</h1>
            <p className="subtitulo-ofrecer">
              Esta información arma tu tarjeta pública. Cuanto más completa, más confianza generás.
            </p>
          </div>

          <div className="aviso-confianza">
            <span>🛡️</span>
            <span>
              Verificamos tu identidad con el DNI que subas acá. Los clientes van a ver una
              insignia de "perfil verificado" en tu tarjeta.
            </span>
          </div>

          <div className="tarjeta-form">
            <p className="titulo-seccion">Sobre tu servicio</p>
            <p className="ayuda-seccion">Lo que la gente va a ver primero al buscar.</p>

            <div className="campo">
              <label className="etiqueta-campo">Categoría</label>
              <select className="select-ofrecer" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Elegí una categoría</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="etiqueta-campo">Descripción del servicio</label>
              <textarea
                className="textarea-ofrecer"
                placeholder="Contá en qué te especializás, tu experiencia y qué te diferencia..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="fila-dos">
              <div className="campo">
                <label className="etiqueta-campo">Zona de cobertura</label>
                <select className="select-ofrecer" value={zona} onChange={(e) => setZona(e.target.value)}>
                  <option value="">Elegí una zona</option>
                  {ZONAS.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label className="etiqueta-campo">Cobro por hora ($)</label>
                <input
                  className="entrada-ofrecer"
                  type="number"
                  min="0"
                  placeholder="5000"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
            </div>

            <div className="campo">
              <label className="etiqueta-campo">Años de experiencia</label>
              <input
                className="entrada-ofrecer"
                type="number"
                min="0"
                placeholder="Ej: 5"
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="etiqueta-campo">Disponibilidad</label>
              <div className="chips-dias">
                {DIAS.map((dia) => (
                  <span
                    key={dia}
                    className={`chip-dia ${diasDisponibles.includes(dia) ? "activo" : ""}`}
                    onClick={() => alternarDia(dia)}
                  >
                    {dia}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="tarjeta-form">
            <p className="titulo-seccion">Verificación y credenciales</p>
            <p className="ayuda-seccion">Esto es lo que hace que un cliente confíe en contratarte.</p>

            <div className="campo">
              <label className="etiqueta-campo">DNI (frente y contrafrente)</label>
              <div className="subida-caja" onClick={() => refDni.current.click()}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 15l-5-5-9 9" />
                </svg>
                <div>
                  {archivoDni ? (
                    <div className="subida-texto-titulo subida-ok">✓ {archivoDni.name}</div>
                  ) : (
                    <>
                      <div className="subida-texto-titulo">Subir DNI</div>
                      <div className="subida-texto-sub">Solo lo usamos para verificar tu identidad</div>
                    </>
                  )}
                </div>
                <input
                  ref={refDni}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files[0] && setArchivoDni(e.target.files[0])}
                />
              </div>
            </div>

            <div
              className="fila-matricula"
              onClick={() => setTieneMatricula(!tieneMatricula)}
            >
              <div className={`punto-check ${tieneMatricula ? "activo" : ""}`}>
                {tieneMatricula && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <span className="texto-check">Tengo matrícula o certificación habilitante</span>
            </div>

            {tieneMatricula && (
              <div className="campo">
                <div className="subida-caja" onClick={() => refMatricula.current.click()}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
                  </svg>
                  <div>
                    {archivoMatricula ? (
                      <div className="subida-texto-titulo subida-ok">✓ {archivoMatricula.name}</div>
                    ) : (
                      <>
                        <div className="subida-texto-titulo">Subir matrícula / certificado</div>
                        <div className="subida-texto-sub">Se muestra como insignia en tu perfil</div>
                      </>
                    )}
                  </div>
                  <input
                    ref={refMatricula}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files[0] && setArchivoMatricula(e.target.files[0])}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className="fila-terminos"
            onClick={() => setAceptaTerminos(!aceptaTerminos)}
            style={{ marginBottom: "1rem" }}
          >
            <div className={`punto-check ${aceptaTerminos ? "activo" : ""}`} style={{ borderRadius: "50%", marginTop: 1 }}>
              {aceptaTerminos && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
            </div>
            <span className="texto-terminos">
              Acepto los términos y condiciones para ofrecer servicios en LABURAR.
            </span>
          </div>

          {error && <p className="error-form">{error}</p>}

          <button className="boton-publicar" onClick={manejarPublicar} disabled={cargando}>
            {cargando ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </>
  );
}
