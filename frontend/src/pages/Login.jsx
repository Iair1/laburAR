import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../api"; // 👈 IMPORTAR

export default function Login() {
  const [nombre, setNombre] = useState(""); // 👈 CAMBIO: correo → nombre
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(""); // 👈 NUEVO
  const [cargando, setCargando] = useState(false); // 👈 NUEVO
  const navegar = useNavigate();

  const manejarLogin = async () => {
    // Validaciones
    if (!nombre || !contrasena) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setCargando(true);

    try {
      // 👈 Llamar al backend
      const respuesta = await iniciarSesion(nombre, contrasena);
      console.log("Login exitoso:", respuesta);

      // Redirigir a la página de inicio
      navegar("/");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const manejarGoogle = () => {
    console.log("Login con Google");
  };

  return (
    <div style={estilos.fondo}>
      <div style={estilos.contenedor}>
        
        <div style={estilos.tarjeta}>
          <h1 style={estilos.titulo}>Iniciar sesion en LABURAR</h1>

          
          <button 
            style={estilos.botonGoogle} 
            onClick={manejarGoogle}
            disabled={cargando}
          >
            Continuar con&nbsp;
            <svg width="52" height="18" viewBox="0 0 272 92" aria-hidden="true">
              <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
              <path fill="#D14836" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
              <path fill="#F4B400" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
              <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z"/>
              <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
              <path fill="#EA4335" d="M35.29 41.41V32h31.39c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 35.19.36 16.49 16.32 1.03 35.13 1.03c10.49 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.32.05z"/>
            </svg>
          </button>

          
          <div style={estilos.separador}>
            <div style={estilos.linea} />
            <span style={estilos.separadorTexto}>O</span>
            <div style={estilos.linea} />
          </div>

          
          <input
            style={estilos.entrada}
            type="text"
            placeholder="NOMBRE COMPLETO" /*{👈 CAMBIO }*/
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={cargando}
          />
          <input
            style={estilos.entrada}
            type="password"
            placeholder="CONTRASEÑA"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={cargando}
          />

          {/* 👈 NUEVO: mostrar error */}
          {error && <p style={estilos.textoError}>{error}</p>}

          {/* 👈 CAMBIO: agregar estado de carga */}
          <button 
            style={{...estilos.boton, opacity: cargando ? 0.6 : 1}}
            onClick={manejarLogin}
            disabled={cargando}
          >
            {cargando ? "Iniciando sesión..." : "Iniciar Sesion"}
          </button>

          
          <p style={estilos.linkCentro}>
            <span style={estilos.enlaceAzul} onClick={() => navegar("/recuperar-contrasena")}>
              Olvide mi contraseña
            </span>
          </p>
          <p style={estilos.linkCentro}>
            <span style={estilos.textoGris}>No tengo una cuenta </span>
            <span style={estilos.enlaceAzulBold} onClick={() => navegar("/paso1")}>
              REGISTARME
            </span>
          </p>
        </div>
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
    padding: "80px 24px 40px",
    boxSizing: "border-box",
  },
  contenedor: {
    position: "relative",
    width: "100%",
    maxWidth: "480px",
  },
  tarjeta: {
    background: "#fff",
    borderRadius: "0px",
    padding: "50px 48px 40px",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 1,
  },
  titulo: {
    fontSize: "19px",
    fontWeight: "600",
    color: "#1a2332",
    textAlign: "center",
    margin: "0 0 24px",
  },
  botonGoogle: {
    width: "100%",
    padding: "11px 14px",
    marginBottom: "12px",
    background: "#fff",
    border: "1.5px solid #ccc",
    borderRadius: "0px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a2332",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  separador: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },
  linea: {
    flex: 1,
    height: "1px",
    background: "#ddd",
  },
  separadorTexto: {
    fontSize: "13px",
    color: "#999",
    fontWeight: "500",
  },
  entrada: {
    width: "100%",
    padding: "11px 14px",
    marginBottom: "10px",
    background: "#e8e8e8",
    border: "none",
    borderRadius: "0px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#555",
    letterSpacing: "0.06em",
    outline: "none",
    boxSizing: "border-box",
  },
  boton: {
    width: "100%",
    padding: "13px",
    background: "#2c2c2c",
    color: "#fff",
    border: "none",
    borderRadius: "0px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.02em",
    boxSizing: "border-box",
    marginBottom: "16px",
    marginTop: "6px",
  },
  textoError: {
    fontSize: "12px",
    color: "#d0341a",
    fontWeight: "600",
    marginBottom: "10px",
    textAlign: "center",
  },
  linkCentro: {
    textAlign: "center",
    margin: "0 0 8px",
    fontSize: "13px",
  },
  textoGris: {
    color: "#555",
  },
  enlaceAzul: {
    color: "#4a7fd4",
    fontWeight: "500",
    cursor: "pointer",
  },
  enlaceAzulBold: {
    color: "#4a7fd4",
    fontWeight: "700",
    cursor: "pointer",
  },
};
