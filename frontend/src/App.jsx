import { Routes, Route } from "react-router-dom";
import { RegistroProvider } from "./context/RegistroContext";

// Importar páginas
import PaginaInicio from "./pages/PaginaInicio";
import Login from "./pages/Login";
import Paso1 from "./pages/Paso1";
import Paso2 from "./pages/Paso2";
import Paso3 from "./pages/Paso3";
import Mensajes from "./pages/Mensajes";
import Empleos from "./pages/Empleos";

function App() {
  return (
    <RegistroProvider>
      <Routes>
        {/* ========== RUTA PRINCIPAL (PÁGINA DE INICIO) ========== */}
        <Route path="/" element={<PaginaInicio />} />

        {/* ========== RUTA DE LOGIN ========== */}
        <Route path="/login" element={<Login />} />

        {/* ========== RUTAS DE REGISTRO (3 PASOS) ========== */}
        <Route path="/paso1" element={<Paso1 />} />
        <Route path="/paso2" element={<Paso2 />} />
        <Route path="/paso3" element={<Paso3 />} />

        {/* ========== OTRAS RUTAS ========== */}
        <Route path="/mensajes" element={<Mensajes />} />
        <Route path="/empleos" element={<Empleos />} />
      </Routes>
    </RegistroProvider>
  );
}

export default App;
