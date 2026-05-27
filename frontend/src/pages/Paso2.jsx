import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const LABURAR_SVG_PATH = "M114.256 21.2068C114.256 20.0819 114.758 19.0032 115.652 18.2078C116.546 17.4124 117.759 16.9656 119.023 16.9656H133.325V4.24199C133.325 3.11715 133.827 2.03839 134.721 1.24301C135.615 0.447636 136.828 0.000797707 138.092 0.000797707C139.357 0.000797707 140.569 0.447636 141.463 1.24301C142.357 2.03839 142.86 3.11715 142.86 4.24199V16.9656H157.162C158.426 16.9656 159.639 17.4124 160.533 18.2078C161.427 19.0032 161.929 20.0819 161.929 21.2068C161.929 22.3316 161.427 23.4104 160.533 24.2057C159.639 25.0011 158.426 25.4479 157.162 25.4479H142.86V38.1715C142.86 39.2963 142.357 40.3751 141.463 41.1705C140.569 41.9659 139.357 42.4127 138.092 42.4127C136.828 42.4127 135.615 41.9659 134.721 41.1705C133.827 40.3751 133.325 39.2963 133.325 38.1715V25.4479H119.023C117.759 25.4479 116.546 25.0011 115.652 24.2057C114.758 23.4104 114.256 22.3316 114.256 21.2068ZM160.809 60.0843C163.655 75.1427 161.049 90.6162 153.366 104.271C145.683 117.926 133.321 129.055 118.065 136.052C102.81 143.049 85.4488 145.552 68.4898 143.199C51.5307 140.846 35.8509 133.76 23.7141 122.962C11.5774 112.165 3.6116 98.2155 0.966954 83.128C-1.67769 68.0406 1.1356 52.5958 9.00067 39.0235C16.8657 25.4512 29.3756 14.4537 44.7242 7.61876C60.0727 0.783837 77.4657 -1.53485 94.392 0.997477C95.0187 1.08095 95.6203 1.27472 96.1618 1.56745C96.7032 1.86018 97.1737 2.246 97.5456 2.70235C97.9175 3.15871 98.1835 3.67644 98.3279 4.22529C98.4723 4.77414 98.4923 5.34309 98.3866 5.89889C98.281 6.45469 98.0519 6.98618 97.7127 7.4623C97.3735 7.93841 96.9311 8.3496 96.4112 8.67182C95.8913 8.99405 95.3045 9.22084 94.6849 9.33895C94.0654 9.45706 93.4256 9.46411 92.8029 9.35969C88.8639 8.77747 84.8777 8.48431 80.8846 8.48318C66.9265 8.47663 53.2717 12.1064 41.6057 18.9245C29.9398 25.7425 20.7732 35.4504 15.2377 46.8498C9.70209 58.2493 8.03975 70.8413 10.4559 83.0716C12.8719 95.3018 19.2607 106.635 28.8336 115.672C36.324 105.311 47.5203 97.4964 60.6156 93.4908C54.0858 89.6215 49.1287 83.9856 46.4774 77.4163C43.8262 70.8471 43.6214 63.6932 45.8933 57.0124C48.1653 50.3316 52.7934 44.4785 59.0935 40.3186C65.3935 36.1586 73.031 33.9126 80.8767 33.9126C88.7224 33.9126 96.3599 36.1586 102.66 40.3186C108.96 44.4785 113.588 50.3316 115.86 57.0124C118.132 63.6932 117.927 70.8471 115.276 77.4163C112.625 83.9856 107.668 89.6215 101.138 93.4908C114.233 97.4964 125.429 105.311 132.92 115.672C145.434 103.898 152.404 88.3057 152.394 72.101C152.392 68.5487 152.062 65.0025 151.409 61.4981C151.292 60.9441 151.3 60.3749 151.432 59.8238C151.565 59.2726 151.82 58.7505 152.182 58.288C152.544 57.8255 153.007 57.4319 153.542 57.1301C154.077 56.8284 154.674 56.6245 155.299 56.5306C155.924 56.4366 156.563 56.4544 157.18 56.5829C157.797 56.7113 158.379 56.9479 158.892 57.2788C159.405 57.6097 159.839 58.0282 160.168 58.5099C160.497 58.9916 160.715 59.5269 160.809 60.0843ZM80.8846 90.4795C86.2277 90.4795 91.4507 89.07 95.8932 86.4292C100.336 83.7884 103.798 80.0348 105.843 75.6433C107.888 71.2518 108.423 66.4195 107.38 61.7574C106.338 57.0954 103.765 52.8131 99.987 49.4519C96.2089 46.0908 91.3953 43.8018 86.155 42.8745C80.9146 41.9472 75.4828 42.4231 70.5465 44.2421C65.6102 46.0612 61.3911 49.1416 58.4227 53.0939C55.4543 57.0461 53.8699 61.6928 53.8699 66.4461C53.8699 72.8202 56.7161 78.9332 61.7823 83.4403C66.8486 87.9474 73.7199 90.4795 80.8846 90.4795ZM80.8846 135.719C97.2458 135.742 113.116 130.749 125.824 121.582C121.162 114.684 114.573 108.978 106.699 105.016C98.8241 101.054 89.9313 98.972 80.8846 98.972C71.838 98.972 62.9452 101.054 55.0705 105.016C47.1958 108.978 40.6072 114.684 35.9448 121.582C48.6531 130.749 64.5235 135.742 80.8846 135.719Z";

export default function Paso2({ onNext }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [revalidar, setRevalidar] = useState("");
  const [rol, setRol] = useState("trabajador");
  const [archivo, setArchivo] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file) setArchivo(file);
  };

  const handleSiguiente = () => {
    if (onNext) onNext({ nombre, email, telefono, contrasena, revalidar, rol, archivo });
  };

  return (
    <div style={styles.bg}>
      
      <div style={styles.card}>
        <h1 style={styles.title}>Registrame en LABURAR</h1>

        
        <div style={styles.stepsRow}>
          {["Paso 1", "Paso 2", "Paso 3"].map((label, i) => (
            <div key={label} style={styles.stepItem}>
              <div style={{ ...styles.stepTrack, background: i <= 1 ? "#1a2332" : "#dde4ef" }} />
              <span style={{ ...styles.stepLabel, color: i <= 1 ? "#1a2332" : "#aaa" }}>{label}</span>
            </div>
          ))}
        </div>

        
        <div style={styles.iconWrap} onClick={() => inputRef.current.click()}>
          {archivo ? (
            <span style={styles.fileName}>{archivo.name}</span>
          ) : (
            <svg
              width="64"
              height="57"
              viewBox="0 0 162 145"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ cursor: "pointer" }}
            >
              <path d={LABURAR_SVG_PATH} fill="#1a2332" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="*/*"
            style={{ display: "none" }}
            onChange={handleArchivoChange}
          />
        </div>

        
        <input
          style={styles.input}
          type="text"
          placeholder="NOMBRE COMPLETO"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="tel"
          placeholder="NRO DE TELEFONO"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="CONTRASEÑA"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="REVALIDAR CONTRASEÑA"
          value={revalidar}
          onChange={(e) => setRevalidar(e.target.value)}
        />

        
        <div style={styles.roleRow}>
          {["trabajador", "cliente"].map((r) => (
            <label key={r} style={styles.roleLabel} onClick={() => setRol(r)}>
              <div
                style={{
                  ...styles.roleDot,
                  background: rol === r ? "#1a2332" : "#ccc",
                }}
              />
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </label>
          ))}
        </div>

        
        <button style={styles.btn} onClick={() => navigate("/paso3")}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    background: "#c0c0c0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "36px 40px 40px",
    width: "100%",
    maxWidth: "500px",
    boxSizing: "border-box",
  },
  title: {
    fontFamily: "Inter",
    fontSize: "20px",
    fontWeight: "700",
    color: "#1a2332",
    textAlign: "center",
    marginBottom: "16px",
  },
  stepsRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "28px",
  },
  stepItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  stepTrack: {
    width: "100%",
    height: "4px",
    borderRadius: "4px",
  },
  stepLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.04em",
  },
  iconWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "24px",
    cursor: "pointer",
    minHeight: "60px",
  },
  fileName: {
    fontSize: "13px",
    color: "#4a9eff",
    fontWeight: "600",
    textAlign: "center",
    wordBreak: "break-all",
  },
  input: {
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
  roleRow: {
    display: "flex",
    gap: "20px",
    margin: "14px 0 22px",
  },
  roleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a2332",
    cursor: "pointer",
    userSelect: "none",
  },
  roleDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  btn: {
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