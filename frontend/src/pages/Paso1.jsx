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
    <div style={estilos.fondo}>
      <div style={estilos.tarjeta}>
        <h1 style={estilos.titulo}>Registrame en LABURAR</h1>

        <button type="button" style={estilos.botonGoogle} onClick={manejarGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5c-7.6 0-14.1 4.3-17.4 10.6z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5c-2 1.5-4.6 2.4-7.6 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          Continuar con Google
        </button>

        {registradoConGoogle && (
          <p style={estilos.notaGoogle}>
            Conectado como <strong>{correo}</strong> — no necesitás elegir contraseña.
          </p>
        )}

        <div style={estilos.divisor}>
          <span style={estilos.lineaDivisor} />
          <span style={estilos.textoDivisor}>o completá tus datos</span>
          <span style={estilos.lineaDivisor} />
        </div>

        <div style={estilos.contenedorIcono} onClick={() => referenciaEntrada.current.click()}>
          {previewFoto ? (
            <img src={previewFoto} alt="Foto de perfil" style={estilos.previewFoto} />
          ) : (
            <div style={estilos.placeholderFoto}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a97ab" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5l1.5-2h4l1.5 2H18a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span style={estilos.textoFoto}>Subí tu foto de perfil</span>
            </div>
          )}
          <div style={estilos.insigniaCamara}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        <input
          style={estilos.entrada}
          type="text"
          placeholder="NOMBRE COMPLETO"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="email"
          placeholder="EMAIL"
          value={correo}
          disabled={registradoConGoogle}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="tel"
          placeholder="NRO DE TELEFONO"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="text"
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="text"
          placeholder="CALLE"
          value={domicilioCalle}
          onChange={(e) => setDomicilioCalle(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="text"
          placeholder="ALTURA"
          value={domicilioAltura}
          onChange={(e) => setDomicilioAltura(e.target.value)}
        />
        <input
          style={estilos.entrada}
          type="text"
          placeholder="CÓDIGO POSTAL"
          value={codigoPostal}
          onChange={(e) => setCodigoPostal(e.target.value)}
        />
        <select
          style={{ ...estilos.entrada, cursor: "pointer" }}
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
              style={estilos.entrada}
              type="password"
              placeholder="CONTRASEÑA"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <input
              style={estilos.entrada}
              type="password"
              placeholder="REVALIDAR CONTRASEÑA"
              value={revalidar}
              onChange={(e) => setRevalidar(e.target.value)}
            />
          </>
        )}

        {error && <p style={estilos.textoError}>{error}</p>}

        <button
          style={{ ...estilos.boton, opacity: cargando ? 0.6 : 1, cursor: cargando ? "not-allowed" : "pointer" }}
          onClick={manejarRegistro}
          disabled={cargando}
        >
          {cargando ? "Registrando..." : "Registrarme"}
        </button>
      </div>
    </div>
  );
}

const estilos = {
  fondo: {
    minHeight: "100vh",
    background: "#c0c0c0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    padding: "24px",
  },
  tarjeta: {
    background: "#fff",
    borderRadius: "18px",
    padding: "36px 40px 40px",
    width: "100%",
    maxWidth: "500px",
    boxSizing: "border-box",
  },
  titulo: {
    fontFamily: "Inter, sans-serif",
    fontSize: "20px",
    fontWeight: "700",
    color: "#1a2332",
    textAlign: "center",
    marginBottom: "20px",
  },
  botonGoogle: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px",
    background: "#fff",
    border: "1.5px solid #d3d9e3",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#3c3c3c",
    cursor: "pointer",
    marginBottom: "8px",
  },
  notaGoogle: {
    fontSize: "11px",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: "10px",
  },
  divisor: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "12px 0 20px",
  },
  lineaDivisor: {
    flex: 1,
    height: "1px",
    background: "#e2e6ed",
  },
  textoDivisor: {
    fontSize: "10px",
    color: "#9aa4b2",
    fontWeight: "600",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  contenedorIcono: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 24px",
    cursor: "pointer",
    width: "110px",
    height: "110px",
    borderRadius: "16px",
    border: "2px dashed #c7cfdb",
    background: "#f5f7fa",
    overflow: "hidden",
    transition: "border-color 0.15s, background 0.15s",
  },
  placeholderFoto: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "8px",
  },
  textoFoto: {
    fontSize: "9.5px",
    fontWeight: "600",
    color: "#8a97ab",
    textAlign: "center",
    letterSpacing: "0.02em",
    lineHeight: 1.3,
  },
  previewFoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  insigniaCamara: {
    position: "absolute",
    bottom: "6px",
    right: "6px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#1a2332",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 2px #fff",
  },
  entrada: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "10px",
    background: "#c8c8c8",
    border: "1.5px solid transparent",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#3c3c3c",
    letterSpacing: "0.06em",
    outline: "none",
    boxSizing: "border-box",
  },
  textoError: {
    fontSize: "12px",
    color: "#d0341a",
    fontWeight: "600",
    marginBottom: "10px",
    textAlign: "center",
  },
  boton: {
    width: "100%",
    padding: "14px",
    background: "#484848",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
};
