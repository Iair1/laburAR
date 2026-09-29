import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesionUsuario, guardarPublicacion, archivoADataURL } from "../sesion";

const estilos = `
  * { box-sizing: border-box; }

  html, body, #root {
    margin: 0;
    min-height: 100%;
  }

  .pagina-ofrecer {
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 30px 20px 45px;
    font-family: Arial, Helvetica, sans-serif;
    background: #fff;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .contenedor-ofrecer {
    width: min(520px, 100%);
    margin: 0 auto;
  }

  /* En el diseño de referencia el formulario es el protagonista. */
  .encabezado-ofrecer {
    display: none;
  }

  .aviso-confianza {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #d0d0d0;
    border-radius: 7px;
    padding: 8px 10px;
    margin-bottom: 10px;
    font-size: 10px;
    line-height: 1.3;
    color: #555;
  }

  .aviso-confianza span:first-child {
    flex-shrink: 0;
  }

  .tarjeta-form {
    width: 100%;
    background: #d0d0d0;
    border: none;
    border-radius: 7px;
    padding: 18px 18px 16px;
    margin-bottom: 10px;
    box-shadow: none;
  }

  .titulo-seccion {
    font-size: 9px;
    font-weight: 700;
    color: #333;
    text-transform: uppercase;
    margin: 0 0 3px;
  }

  .ayuda-seccion {
    font-size: 8px;
    color: #555;
    margin: 0 0 9px;
  }

  .campo {
    margin-bottom: 9px;
  }

  .campo:last-child {
    margin-bottom: 0;
  }

  .etiqueta-campo {
    display: block;
    font-size: 7px;
    font-weight: 700;
    color: #333;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin: 0 0 3px 1px;
  }

  .entrada-ofrecer,
  .textarea-ofrecer,
  .select-ofrecer {
    width: 100%;
    min-width: 0;
    height: 26px;
    padding: 4px 7px;
    border: 1px solid #aaa;
    border-radius: 3px;
    font-size: 8px;
    color: #222;
    outline: none;
    font-family: Arial, Helvetica, sans-serif;
    background: #fff;
  }

  .entrada-ofrecer:focus,
  .textarea-ofrecer:focus,
  .select-ofrecer:focus {
    border-color: #777;
    box-shadow: 0 0 0 1px rgba(87, 1, 1, 0.08);
  }

  .textarea-ofrecer {
    display: block;
    height: 54px;
    min-height: 54px;
    resize: vertical;
    line-height: 1.25;
    padding-top: 6px;
  }

  .fila-dos {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 9px;
  }

  .fila-dos > div {
    min-width: 0;
  }

  .chips-dias {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .chip-dia {
    min-width: 30px;
    height: 20px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #aaa;
    background: #fff;
    font-size: 7px;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    user-select: none;
  }

  .chip-dia:hover {
    border-color: #777;
  }

  .chip-dia.activo {
    background: #7b2020;
    border-color: #7b2020;
    color: #fff;
  }

  /* Segunda parte del formulario: conserva todos los campos y funciones
     existentes, pero sigue la misma estética compacta del diseño. */
  .tarjeta-form + .tarjeta-form {
    padding-top: 15px;
  }

  .subida-caja {
    border: 1px dashed #999;
    background: rgba(255, 255, 255, 0.72);
    border-radius: 4px;
    min-height: 42px;
    padding: 7px 9px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .subida-caja:hover {
    border-color: #666;
    background: #fff;
  }

  .subida-caja svg {
    width: 19px;
    height: 19px;
    flex-shrink: 0;
    color: #666;
  }

  .subida-texto-titulo {
    font-size: 8px;
    font-weight: 600;
    color: #333;
  }

  .subida-texto-sub {
    font-size: 7px;
    color: #666;
    margin-top: 2px;
  }

  .subida-ok {
    color: #2e6f34;
    font-weight: 700;
  }

  .fila-matricula {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    user-select: none;
    margin: 8px 0;
  }

  .punto-check {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
    border: 1px solid #999;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
  }

  .punto-check.activo {
    background: #7b2020;
    border-color: #7b2020;
  }

  .texto-check {
    font-size: 8px;
    font-weight: 600;
    color: #444;
  }

  .fila-terminos {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    cursor: pointer;
    user-select: none;
    margin: 0 0 10px;
  }

  .texto-terminos {
    font-size: 8px;
    color: #444;
    line-height: 1.35;
  }

  .error-form {
    font-size: 8px;
    color: #a52a1a;
    font-weight: 700;
    text-align: center;
    margin: 7px 0;
  }

  .boton-publicar {
    width: 100%;
    height: 29px;
    padding: 5px 10px;
    background: #7b2020;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: background 0.15s;
  }

  .boton-publicar:hover {
    background: #641818;
  }

  .boton-publicar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    .pagina-ofrecer {
      padding: 18px 12px 30px;
    }

    .tarjeta-form {
      padding: 15px 13px;
    }

    .fila-dos {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .fila-dos > div:last-child {
      margin-bottom: 9px;
    }
  }
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
