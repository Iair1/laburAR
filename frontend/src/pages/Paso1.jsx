import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegistroContext } from "../context/RegistroContext";
import { registrarUsuario } from "../api";
import {
  guardarSesionUsuario,
  archivoADataURL,
  iniciarSesionConGoogleSimulado,
} from "../sesion";

const LOCALIDADES = [
  "CABA", "GBA Norte", "GBA Sur", "GBA Oeste", "Córdoba Capital",
  "Rosario", "Mendoza Capital", "La Plata", "Mar del Plata", "Tucumán",
  "Salta Capital", "Santa Fe Capital", "Neuquén Capital", "Bahía Blanca",
];

const estilos = `
  * { box-sizing: border-box; }

  .pagina-auth {
    position: relative;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
  }

  /* --- logo --- */
  .logo-laburar {
    position: absolute;
    left: 40px;
    top: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
  }
  .logo-icono { width: 48px; height: auto; display: block; }
  .logo-texto { width: 110px; height: auto; display: block; }

  /* --- tarjeta --- */
  .tarjeta-auth {
    background: #a8a8a8;
    border-radius: 18px;
    padding: 32px 38px 32px;
    width: 100%;
    max-width: 460px;
    max-height: 88vh;
    overflow-y: auto;
    box-sizing: border-box;
  }
  .titulo-auth {
    font-size: 1.05rem;
    font-weight: 600;
    color: #232323;
    text-align: center;
    margin: 0 0 18px;
  }
  .titulo-auth b { font-weight: 800; }

  .boton-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 11px 14px;
    background: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #3c3c3c;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background 0.15s;
  }
  .boton-google:hover { background: #f2f2f2; }

  .nota-google {
    font-size: 0.72rem;
    color: #16330f;
    background: rgba(255,255,255,0.5);
    border-radius: 6px;
    padding: 6px 10px;
    text-align: center;
    margin-bottom: 10px;
  }

  .divisor-auth {
    text-align: center;
    font-size: 0.78rem;
    color: #3a3a3a;
    font-weight: 700;
    margin: 0 0 16px;
  }

  .contenedor-icono-foto {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 8px;
    cursor: pointer;
    width: 82px;
    height: 82px;
  }
  .previsualizacion-foto {
    width: 82px;
    height: 82px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
  }
  .insignia-camara-foto {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #570101;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #a8a8a8;
  }
  .texto-foto-ayuda {
    display: block;
    text-align: center;
    font-size: 0.7rem;
    color: #2b2b2b;
    margin: 0 0 16px;
  }

  .fila-dos-auth { display: flex; gap: 10px; }
  .fila-dos-auth > input, .fila-dos-auth > select { flex: 1; min-width: 0; }

  .entrada-auth, .select-auth {
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 10px;
    background: #fff;
    border: 1.5px solid transparent;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #4a4a4a;
    letter-spacing: 0.06em;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .select-auth { cursor: pointer; color: #4a4a4a; }
  .entrada-auth::placeholder { color: #8a8a8a; }
  .entrada-auth:focus, .select-auth:focus { border-color: #570101; }

  .boton-enviar-auth {
    width: 100%;
    padding: 13px;
    background: #570101;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.02em;
    margin-top: 4px;
    transition: background 0.15s;
  }
  .boton-enviar-auth:hover { background: #3b1e0d; }
  .boton-enviar-auth:disabled { opacity: 0.6; cursor: not-allowed; }

  .texto-error-auth {
    font-size: 0.78rem;
    color: #5a0000;
    background: rgba(255, 255, 255, 0.45);
    border-radius: 6px;
    padding: 6px 10px;
    font-weight: 700;
    margin-bottom: 10px;
    text-align: center;
  }

  @media (max-width: 480px) {
    .logo-laburar { position: static; margin: 0 auto 20px; }
    .blob-lateral-hombro, .blob-lateral-pelo, .blob-lateral-cara, .punto-lateral, .grilla-puntos { display: none; }
    .pagina-auth { flex-direction: column; padding-top: 40px; }
    .fila-dos-auth { flex-direction: column; gap: 0; }
  }
`;

function LogoLaburar({ onClick }) {
  return (
    <div className="logo-laburar" onClick={onClick}>
      <img src="../assets/logo-icono.svg" alt="" className="logo-icono" />
      <img src="../assets/logo-texto.svg" alt="LABURAR" className="logo-texto" />
    </div>
  );
}

export default function Paso1() {
  const {
    nombre, setNombre,
    correo, setCorreo,
    telefono, setTelefono,
    contrasena, setContrasena,
    revalidar, setRevalidar,
    archivo, setArchivo,
    dni, setDni,
    domicilioCalle, setDomicilioCalle,
    domicilioAltura, setDomicilioAltura,
    codigoPostal, setCodigoPostal,
    localidad, setLocalidad,
    registradoConGoogle, setRegistradoConGoogle,
    limpiarDatos,
  } = useContext(RegistroContext);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const referenciaEntrada = useRef(null);
  const navegar = useNavigate();

  // Previsualización de la foto elegida
  useEffect(() => {
    if (!archivo) {
      setPreviewFoto(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const manejarArchivo = (e) => {
    const archivoElegido = e.target.files[0];
    if (archivoElegido) setArchivo(archivoElegido);
  };

  const manejarGoogle = async () => {
    const perfil = await iniciarSesionConGoogleSimulado();
    setNombre(perfil.nombre);
    setCorreo(perfil.correo);
    setRegistradoConGoogle(true);
    setError("");
  };

  const manejarRegistro = async () => {
    const faltanCampos =
      !nombre || !correo || !telefono || !dni ||
      !domicilioCalle || !domicilioAltura || !codigoPostal || !localidad;
    const faltaContrasena = !registradoConGoogle && (!contrasena || !revalidar);

    if (faltanCampos || faltaContrasena) {
      setError("Por favor completá todos los campos");
      return;
    }
    if (!registradoConGoogle && contrasena !== revalidar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setCargando(true);

    try {
      const datosCompletos = {
        nombre,
        correo,
        telefono,
        // Toda cuenta nueva arranca como "cliente" (puede buscar y contratar).
        // Se convierte en trabajador visible en las búsquedas recién cuando
        // publica un servicio desde "Ofrecer servicios".
        rol: "cliente",
        contrasena,
        archivo,
        dni,
        domicilioCalle,
        domicilioAltura,
        codigoPostal,
        localidad,
      };

      const respuesta = registradoConGoogle
        ? { id: `google_${Date.now()}` }
        : await registrarUsuario(datosCompletos);

      const fotoPerfilURL = registradoConGoogle
        ? "https://cdn-icons-png.flaticon.com/128/281/281764.png"
        : await archivoADataURL(archivo);

      guardarSesionUsuario({
        id: respuesta?.id ?? Date.now(),
        nombre,
        correo,
        fotoPerfilURL,
      });

      limpiarDatos();
      navegar("/");
    } catch (err) {
      setError(err.message || "Error al registrar. Por favor intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{estilos}</style>
      <div className="pagina-auth">
        <LogoLaburar onClick={() => navegar("/")} />

        <div className="tarjeta-auth">
          <h1 className="titulo-auth">Registrate en <b>LABURAR</b></h1>

          {!registradoConGoogle && (
            <button type="button" className="boton-google" onClick={manejarGoogle}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5c-7.6 0-14.1 4.3-17.4 10.6z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5c-2 1.5-4.6 2.4-7.6 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              Continuar con Google
            </button>
          )}

          {registradoConGoogle && (
            <p className="nota-google">
              Conectado como <strong>{correo}</strong> — no necesitás elegir contraseña.
            </p>
          )}

          <p className="divisor-auth">{registradoConGoogle ? "Completá el resto de tus datos" : "O completá tus datos"}</p>

          <div className="contenedor-icono-foto" onClick={() => referenciaEntrada.current.click()}>
            {previewFoto ? (
              <img src={previewFoto} alt="Foto de perfil" className="previsualizacion-foto" />
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="8.5" r="4" />
                <path d="M2.5 21c0-4 3.4-7 7.5-7" />
                <path d="M18 8v4" />
                <path d="M16 10h4" />
              </svg>
            )}
            <div className="insignia-camara-foto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <input
              ref={referenciaEntrada}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={manejarArchivo}
            />
          </div>
          <span className="texto-foto-ayuda">Subí tu foto de perfil</span>

          <input
            className="entrada-auth"
            type="text"
            placeholder="NOMBRE COMPLETO"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="entrada-auth"
            type="email"
            placeholder="EMAIL"
            value={correo}
            disabled={registradoConGoogle}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <input
            className="entrada-auth"
            type="tel"
            placeholder="NRO DE TELEFONO"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <input
            className="entrada-auth"
            type="text"
            placeholder="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
          />

          <div className="fila-dos-auth">
            <input
              className="entrada-auth"
              type="text"
              placeholder="CALLE"
              value={domicilioCalle}
              onChange={(e) => setDomicilioCalle(e.target.value)}
            />
            <input
              className="entrada-auth"
              type="text"
              placeholder="ALTURA"
              value={domicilioAltura}
              onChange={(e) => setDomicilioAltura(e.target.value)}
            />
          </div>

          <input
            className="entrada-auth"
            type="text"
            placeholder="CÓDIGO POSTAL"
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
          />

          <select
            className="select-auth"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
          >
            <option value="">LOCALIDAD</option>
            {LOCALIDADES.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {!registradoConGoogle && (
            <>
              <input
                className="entrada-auth"
                type="password"
                placeholder="CONTRASEÑA"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <input
                className="entrada-auth"
                type="password"
                placeholder="REVALIDAR CONTRASEÑA"
                value={revalidar}
                onChange={(e) => setRevalidar(e.target.value)}
              />
            </>
          )}

          {error && <p className="texto-error-auth">{error}</p>}

          <button
            className="boton-enviar-auth"
            onClick={manejarRegistro}
            disabled={cargando}
          >
            {cargando ? "Registrando..." : "Registrarme"}
          </button>
        </div>
      </div>
    </>
  );
}
