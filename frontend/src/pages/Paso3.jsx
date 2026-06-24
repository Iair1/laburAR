import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegistroContext } from "../context/RegistroContext";
import { registrarUsuario } from "../api";
import iconoSubir from "../assets/bxs_image-add@2x.png";

export default function Paso3() {
  const {
    nombre,
    correo,
    areaTrabajo,
    contrasena,
    archivoDni,
    archivoAptitud,
    setArchivoAptitud,
    aceptaTerminos,
    setAceptaTerminos,
    limpiarDatos,
  } = useContext(RegistroContext);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const referenciaEntrada = useRef(null);
  const navegar = useNavigate();

  const manejarArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo) setArchivoAptitud(archivo);
  };

  const manejarRegistro = async () => {
    if (!aceptaTerminos) {
      setError("Tenés que aceptar los términos y condiciones para continuar.");
      return;
    }

    setError("");
    setCargando(true);

    try {
      // Preparar los datos para enviar al backend
      const datosCompletos = {
        nombre,
        correo,
        areaTrabajo,
        contrasena,
        archivoDni,
        archivoAptitud,
      };

      // Llamar a la función para registrar
      const respuesta = await registrarUsuario(datosCompletos);

      console.log("Registro exitoso:", respuesta);

      // Limpiar los datos del contexto
      limpiarDatos();

      // Redirigir al login o dashboard
      navegar("/login");
    } catch (err) {
      setError(err.message || "Error al registrar. Por favor intenta de nuevo.");
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.fondo}>
      <div style={estilos.tarjeta}>
        <h1 style={estilos.titulo}>Registrate en LABURAR</h1>

        <div style={estilos.filaPasos}>
          {["Paso 1", "Paso 2", "Paso 3"].map((etiqueta, i) => (
            <div key={etiqueta} style={estilos.itemPaso}>
              <div style={{ ...estilos.barraPaso, background: "#1a2332" }} />
              <span style={{ ...estilos.etiquetaPaso, color: "#1a2332" }}>{etiqueta}</span>
            </div>
          ))}
        </div>

        <div
          style={estilos.contenedorSubida}
          onClick={() => referenciaEntrada.current.click()}
        >
          {archivoAptitud ? (
            <span style={estilos.nombreArchivo}>{archivoAptitud.name}</span>
          ) : (
            <div style={estilos.placeholderSubida}>
              <img
                src={iconoSubir}
                alt="Subir archivo"
                style={estilos.iconoSubir}
              />
              <span style={estilos.textoSubida}>Subir aptitudes y matrículas</span>
            </div>
          )}
          <input
            ref={referenciaEntrada}
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={manejarArchivo}
          />
        </div>

        <div
          style={estilos.filaTerminos}
          onClick={() => setAceptaTerminos(!aceptaTerminos)}
        >
          <div
            style={{
              ...estilos.puntoTerminos,
              background: aceptaTerminos ? "#1a2332" : "#ccc",
            }}
          />
          <span style={estilos.textoTerminos}>
            Acepto los términos y condiciones, y he leído la{" "}
            <span style={estilos.enlaceTerminos}>Política de Privacidad</span>
          </span>
        </div>

        {error && <p style={estilos.textoError}>{error}</p>}

        <button
          style={{
            ...estilos.boton,
            opacity: cargando ? 0.6 : 1,
            cursor: cargando ? "not-allowed" : "pointer",
          }}
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
    marginBottom: "16px",
  },
  filaPasos: {
    display: "flex",
    gap: "6px",
    marginBottom: "28px",
  },
  itemPaso: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  barraPaso: {
    width: "100%",
    height: "4px",
    borderRadius: "4px",
  },
  etiquetaPaso: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.04em",
  },
  contenedorSubida: {
    background: "#c8c8c8",
    borderRadius: "10px",
    padding: "36px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginBottom: "24px",
    minHeight: "180px",
  },
  placeholderSubida: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  iconoSubir: {
    width: "90px",
    height: "80px",
    objectFit: "contain",
  },
  textoSubida: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#555",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textAlign: "center",
  },
  nombreArchivo: {
    fontSize: "13px",
    color: "#4a9eff",
    fontWeight: "600",
    textAlign: "center",
    wordBreak: "break-all",
  },
  filaTerminos: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "22px",
    cursor: "pointer",
    userSelect: "none",
  },
  puntoTerminos: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "1px",
    transition: "background 0.2s",
  },
  textoTerminos: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#1a2332",
    lineHeight: "1.4",
  },
  enlaceTerminos: {
    fontWeight: "700",
    textDecoration: "underline",
    cursor: "pointer",
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
