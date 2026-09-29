import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerSesionUsuario, guardarPublicacion, archivoADataURL } from "../sesion";

const estilos = `
  * { box-sizing: border-box; }

  html, body, #root {
    margin: 0;
    min-height: 100%;
  }

  body {
    overflow-x: hidden;
  }

  .pagina-ofrecer {
    min-height: 100vh;
    width: 100%;
    padding: 34px 20px 70px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    color: #202020;
    background-color: #fff;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    background-attachment: fixed;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .contenedor-ofrecer {
    width: min(760px, 100%);
    margin: 0 auto;
  }

  .encabezado-ofrecer {
    text-align: center;
    margin: 4px auto 22px;
  }

  .titulo-ofrecer {
    margin: 0 0 7px;
    font-size: clamp(1.45rem, 3vw, 2rem);
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -0.035em;
    color: #292929;
  }

  .subtitulo-ofrecer {
    margin: 0 auto;
    max-width: 560px;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #666;
  }

  .aviso-confianza {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    width: 100%;
    margin: 0 0 16px;
    padding: 12px 15px;
    border: 1px solid rgba(87, 1, 1, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
    color: #555;
    font-size: 0.78rem;
    line-height: 1.45;
    backdrop-filter: blur(5px);
  }

  .aviso-confianza span:first-child {
    flex: 0 0 auto;
    font-size: 1rem;
    line-height: 1.2;
  }

  .tarjeta-form {
    width: 100%;
    margin: 0 0 16px;
    padding: 22px 23px 23px;
    border: 1px solid rgba(30, 30, 30, 0.1);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(6px);
  }

  .titulo-seccion {
    margin: 0 0 4px;
    color: #252525;
    font-size: 1rem;
    line-height: 1.3;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .ayuda-seccion {
    margin: 0 0 18px;
    color: #858585;
    font-size: 0.76rem;
    line-height: 1.4;
  }

  .campo {
    margin-bottom: 15px;
  }

  .campo:last-child {
    margin-bottom: 0;
  }

  .etiqueta-campo {
    display: block;
    margin: 0 0 6px;
    color: #414141;
    font-size: 0.7rem;
    line-height: 1.2;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.045em;
  }

  .entrada-ofrecer,
  .textarea-ofrecer,
  .select-ofrecer {
    width: 100%;
    min-width: 0;
    border: 1px solid #d5d5d2;
    border-radius: 9px;
    outline: none;
    background: #fff;
    color: #252525;
    font-family: inherit;
    font-size: 0.86rem;
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .entrada-ofrecer,
  .select-ofrecer {
    height: 42px;
    padding: 0 12px;
  }

  .textarea-ofrecer {
    display: block;
    min-height: 118px;
    padding: 11px 12px;
    resize: vertical;
    line-height: 1.45;
  }

  .entrada-ofrecer::placeholder,
  .textarea-ofrecer::placeholder {
    color: #aaa;
  }

  .entrada-ofrecer:hover,
  .textarea-ofrecer:hover,
  .select-ofrecer:hover {
    border-color: #bdbdb9;
  }

  .entrada-ofrecer:focus,
  .textarea-ofrecer:focus,
  .select-ofrecer:focus {
    border-color: #570101;
    box-shadow: 0 0 0 3px rgba(87, 1, 1, 0.08);
    background: #fff;
  }

  .fila-dos {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(170px, 0.65fr);
    gap: 14px;
    align-items: start;
  }

  .fila-dos > div {
    min-width: 0;
  }

  .chips-dias {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip-dia {
    min-width: 48px;
    padding: 8px 12px;
    border: 1px solid #d6d6d3;
    border-radius: 999px;
    background: #fff;
    color: #555;
    font-size: 0.76rem;
    font-weight: 650;
    text-align: center;
    cursor: pointer;
    user-select: none;
    transition: all 0.16s ease;
  }

  .chip-dia:hover {
    border-color: #570101;
    color: #570101;
    transform: translateY(-1px);
  }

  .chip-dia.activo {
    border-color: #570101;
    background: #570101;
    color: #fff;
    box-shadow: 0 4px 10px rgba(87, 1, 1, 0.18);
  }

  .subida-caja {
    display: flex;
    align-items: center;
    gap: 13px;
    width: 100%;
    min-height: 70px;
    padding: 12px 14px;
    border: 1.5px dashed #c5c5c1;
    border-radius: 10px;
    background: #fafaf8;
    cursor: pointer;
    transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
  }

  .subida-caja:hover {
    border-color: #570101;
    background: #fff;
    transform: translateY(-1px);
  }

  .subida-caja svg {
    flex: 0 0 auto;
    color: #777;
  }

  .subida-texto-titulo {
    color: #333;
    font-size: 0.82rem;
    line-height: 1.3;
    font-weight: 700;
  }

  .subida-texto-sub {
    margin-top: 3px;
    color: #909090;
    font-size: 0.7rem;
    line-height: 1.35;
  }

  .subida-ok {
    color: #28733a;
  }

  .fila-matricula {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 5px 0 13px;
    cursor: pointer;
    user-select: none;
  }

  .punto-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 19px;
    height: 19px;
    flex: 0 0 19px;
    border: 1.5px solid #c9c9c6;
    border-radius: 5px;
    background: #fff;
    transition: all 0.15s ease;
  }

  .punto-check.activo {
    border-color: #570101;
    background: #570101;
  }

  .texto-check {
    color: #444;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .fila-terminos {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 4px 0 15px;
    cursor: pointer;
    user-select: none;
  }

  .texto-terminos {
    color: #5b5b5b;
    font-size: 0.77rem;
    line-height: 1.45;
  }

  .error-form {
    margin: 0 0 12px;
    padding: 10px 12px;
    border: 1px solid #efc7c0;
    border-radius: 8px;
    background: #fff5f3;
    color: #a62c1a;
    font-size: 0.78rem;
    line-height: 1.4;
    font-weight: 600;
    text-align: center;
  }

  .boton-publicar {
    width: 100%;
    min-height: 46px;
    padding: 12px 18px;
    border: none;
    border-radius: 9px;
    background: #570101;
    color: #fff;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 750;
    letter-spacing: 0.01em;
    cursor: pointer;
    box-shadow: 0 7px 16px rgba(87, 1, 1, 0.17);
    transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }

  .boton-publicar:hover {
    background: #430101;
    transform: translateY(-1px);
    box-shadow: 0 9px 20px rgba(87, 1, 1, 0.22);
  }

  .boton-publicar:active {
    transform: translateY(0);
  }

  .boton-publicar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 700px) {
    .pagina-ofrecer {
      padding: 24px 14px 50px;
      background-attachment: scroll;
      background-size: auto 100%;
      background-position: center top;
    }

    .contenedor-ofrecer {
      width: min(100%, 600px);
    }

    .encabezado-ofrecer {
      margin-bottom: 18px;
    }

    .tarjeta-form {
      padding: 19px 17px 20px;
      border-radius: 13px;
    }

    .fila-dos {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .fila-dos > div {
      margin-bottom: 15px;
    }

    .fila-dos > div:last-child {
      margin-bottom: 0;
    }
  }

  @media (max-width: 430px) {
    .pagina-ofrecer {
      padding: 18px 10px 38px;
    }

    .titulo-ofrecer {
      font-size: 1.35rem;
    }

    .subtitulo-ofrecer {
      font-size: 0.8rem;
    }

    .aviso-confianza {
      font-size: 0.72rem;
      padding: 11px 12px;
    }

    .tarjeta-form {
      padding: 17px 14px 18px;
    }

    .chips-dias {
      gap: 6px;
    }

    .chip-dia {
      min-width: 44px;
      padding: 7px 10px;
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
