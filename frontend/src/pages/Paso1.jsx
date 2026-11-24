import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegistroContext } from "../context/RegistroContext";
import { registrarUsuario, iniciarSesion, iniciarSesionConGoogle } from "../api";
import { guardarSesionUsuario, guardarNotificaciones, leerPayloadJWT } from "../sesion";
import { GOOGLE_CLIENT_ID, cargarGoogleIdentity } from "../google";
import SelectorZona from "../componentes/SelectorZona";
import logoIcono from "../assets/logo-icono.svg";
import logoTexto from "../assets/logo-texto.svg";


const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const estilos = `
  * { box-sizing: border-box; }
  .fila-terminos-auth { display: flex; gap: 8px; align-items: flex-start; margin: 4px 0 12px; font-size: 0.74rem; color: #333; line-height: 1.35; text-align: left; cursor: pointer; }
  .fila-terminos-auth input { margin-top: 2px; width: 16px; height: 16px; accent-color: #570101; flex-shrink: 0; }
  .fila-terminos-auth a { color: #3346c9; font-weight: 600; }
  .contenedor-google-registro { display: flex; justify-content: center; margin-bottom: 4px; min-height: 40px; }

  .pagina-auth {
    position: relative;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 60px 24px;
  }

  /* --- contenedor (logo a la izquierda, tarjeta al lado) --- */
  .contenedor-auth {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
    max-width: 660px;
  }

  /* --- logo --- */
  .logo-laburar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
  }
  .logo-icono { width: 64px; height: auto; display: block; }
  .logo-texto { width: 140px; height: auto; display: block; }

  /* --- tarjeta --- */
  .tarjeta-auth {
    background: #a8a8a8;
    border-radius: 18px;
    padding: 32px 38px 32px;
    width: 460px;
    max-width: 100%;
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
  /* --- persona o empresa --- */
  .tipo-cuenta-auth {
    display: flex;
    gap: 4px;
    padding: 4px;
    margin: 0 0 14px;
    background: rgba(255, 255, 255, 0.55);
    border-radius: 10px;
  }
  .opcion-tipo-auth {
    flex: 1;
    padding: 9px 10px;
    border: none;
    border-radius: 7px;
    background: transparent;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    color: #3a3a3a;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .opcion-tipo-auth:hover { background: rgba(255, 255, 255, 0.7); }
  .opcion-tipo-auth.activa { background: #570101; color: #fff; }
  .ayuda-tipo-auth {
    font-size: 0.7rem;
    color: #2b2b2b;
    text-align: center;
    line-height: 1.35;
    margin: -6px 0 14px;
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
  .select-auth > option{
    font-size: 0.75rem;
    font-weight: 700;
    color: #4a4a4a;
    letter-spacing: 0.06em;
  }
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

  @media (max-width: 660px) {
    .contenedor-auth { flex-direction: column; gap: 14px; }
    .logo-icono { width: 44px; }
    .logo-texto { width: 96px; }
    .tarjeta-auth { width: 100%; }
    .pagina-auth { padding-top: 40px; }
    .fila-dos-auth { flex-direction: column; gap: 0; }
  }
`;

function LogoLaburar({ onClick }) {
  return (
    <div className="logo-laburar" onClick={onClick}>
      <img src={logoIcono} alt="" className="logo-icono" />
      <img src={logoTexto} alt="LABURAR" className="logo-texto" />
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
    esEmpresa, setEsEmpresa,
    registradoConGoogle, setRegistradoConGoogle,
    credencialGoogle, setCredencialGoogle,
    limpiarDatos,
  } = useContext(RegistroContext);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const referenciaEntrada = useRef(null);
  const referenciaBotonGoogle = useRef(null);
  const navegar = useNavigate();

  // Botón oficial de Google (solo si está configurado el Client ID)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || registradoConGoogle) return;
    let cancelado = false;
    cargarGoogleIdentity()
      .then((google) => {
        if (cancelado || !referenciaBotonGoogle.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          callback: ({ credential }) => {
            const perfil = leerPayloadJWT(credential) || {};
            if (!credential || !perfil.email) return;
            setCredencialGoogle(credential);
            setCorreo(String(perfil.email).toLowerCase());
            if (perfil.name) setNombre(perfil.name);
            setRegistradoConGoogle(true);
            setError("");
          },
        });
        google.accounts.id.renderButton(referenciaBotonGoogle.current, {
          type: "standard", theme: "outline", size: "large", text: "signup_with", shape: "rectangular",
          logo_alignment: "center", locale: "es", width: Math.min(referenciaBotonGoogle.current.offsetWidth || 344, 400),
        });
      })
      .catch((err) => console.error(err));
    return () => {
      cancelado = true;
    };
  }, [registradoConGoogle, setCorreo, setNombre, setRegistradoConGoogle, setCredencialGoogle]);

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

  const manejarRegistro = async () => {
    const faltanCampos =
      !nombre || !correo || !telefono ||
      !domicilioCalle || !domicilioAltura || !codigoPostal || !localidad;
    const faltaContrasena = !registradoConGoogle && (!contrasena || !revalidar);
    // Las personas ponen su DNI; las empresas no llevan DNI
    const faltaDni = !esEmpresa && !String(dni || "").trim();
    if (faltanCampos || faltaContrasena || faltaDni) {
      setError("Por favor completá todos los campos");
      return;
    }
    if (!EMAIL_VALIDO.test(correo.trim())) {
      setError("Revisá el email: no parece válido.");
      return;
    }
    if (!registradoConGoogle && contrasena.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (!registradoConGoogle && contrasena !== revalidar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!aceptaTerminos) {
      setError("Tenés que aceptar los términos y condiciones y la política de privacidad.");
      return;
    }

    setError("");
    setCargando(true);

    try {
      const datosCompletos = {
        nombre: nombre.trim(),
        correo: correo.trim(),
        googleCredential: registradoConGoogle ? credencialGoogle : undefined,
        telefono,
        // Toda cuenta nueva arranca como "cliente" (puede buscar y contratar).
        // Se convierte en trabajador visible en las búsquedas recién cuando
        // publica un servicio desde "Ofrecer servicios".
        rol: "cliente",
        contrasena,
        archivo,
        dni: esEmpresa ? "" : String(dni || "").trim(),
        domicilioCalle,
        domicilioAltura,
        codigoPostal,
        localidad,
        esEmpresa,
      };

      await registrarUsuario(datosCompletos);

      // Cuenta creada: se inicia la sesión de una (con Google o con email y contraseña)
      const sesion = registradoConGoogle
        ? await iniciarSesionConGoogle(credencialGoogle)
        : await iniciarSesion(correo.trim(), contrasena);
      guardarSesionUsuario({
        id: sesion.usuario?.id,
        nombre: sesion.usuario?.nombre_completo || nombre.trim(),
        correo: sesion.usuario?.email || correo.trim(),
        fotoPerfilURL: sesion.usuario?.foto_perfil || null,
        esAdmin: sesion.usuario?.es_admin === true,
        esEmpresa: typeof sesion.usuario?.es_empresa === "boolean" ? sesion.usuario.es_empresa : esEmpresa,
        emailVerificado: typeof sesion.usuario?.email_verificado === "boolean" ? sesion.usuario.email_verificado : null,
      });
      guardarNotificaciones(sesion.notificaciones || []);

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
        <div className="contenedor-auth">
          <LogoLaburar onClick={() => navegar("/")} />

          <div className="tarjeta-auth">
            <h1 className="titulo-auth">Registrate en <b>LABURAR</b></h1>

          {GOOGLE_CLIENT_ID && !registradoConGoogle && (
            <div className="contenedor-google-registro" ref={referenciaBotonGoogle} />
          )}

          {registradoConGoogle && (
            <p className="nota-google">
              Conectado como <strong>{correo}</strong> — no necesitás elegir contraseña.
            </p>
          )}

          <p className="divisor-auth">
            {registradoConGoogle ? "Completá el resto de tus datos" : GOOGLE_CLIENT_ID ? "O completá tus datos" : "Completá tus datos"}
          </p>

          <div className="tipo-cuenta-auth" role="radiogroup" aria-label="Tipo de cuenta">
            <button
              type="button"
              role="radio"
              aria-checked={!esEmpresa}
              className={`opcion-tipo-auth ${!esEmpresa ? "activa" : ""}`}
              onClick={() => setEsEmpresa(false)}
            >
              Soy una persona
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={esEmpresa}
              className={`opcion-tipo-auth ${esEmpresa ? "activa" : ""}`}
              onClick={() => {
                setEsEmpresa(true);
                setDni("");
              }}
            >
              Soy una empresa
            </button>
          </div>
          {esEmpresa ? (
            <p className="ayuda-tipo-auth">
              Cuenta para una empresa de servicios: no lleva DNI. Después la podés verificar con la constancia de CUIT.
            </p>
          ) : null}

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
          <span className="texto-foto-ayuda">{esEmpresa ? "Subí el logo de la empresa" : "Subí tu foto de perfil"}</span>

          <input
            className="entrada-auth"
            type="text"
            placeholder={esEmpresa ? "NOMBRE DE LA EMPRESA" : "NOMBRE COMPLETO"}
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
          {!esEmpresa && (
            <input
              className="entrada-auth"
              type="text"
              inputMode="numeric"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          )}

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

          <div className="campo-zona-auth">
            <SelectorZona
              valor={{ zona: localidad, barrio: "" }}
              onCambio={(l) => setLocalidad(l.zona)}
              conBarrio={false}
              claseBoton="select-auth"
              placeholder="ZONA (LOCALIDAD)"
              ariaLabel="Zona donde vivís"
            />
          </div>

          {!registradoConGoogle && (
            <>
              <input
                className="entrada-auth"
                type="password"
                placeholder="CONTRASEÑA (MÍNIMO 6)"
                autoComplete="new-password"
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

          <label className="fila-terminos-auth">
            <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} />
            <span>
              Leí y acepto los <Link to="/terminos" target="_blank">Términos y condiciones</Link> y la{" "}
              <Link to="/privacidad" target="_blank">Política de privacidad</Link>.
            </span>
          </label>

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
      </div>
    </>
  );
}
