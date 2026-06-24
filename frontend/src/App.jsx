import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RegistroProvider } from "./context/RegistroContext";

// Importar páginas
import PaginaInicio from "./pages/PaginaInicio";
import Login from "./pages/Login";
import Paso1 from "./pages/Paso1";
import Paso2 from "./pages/Paso2";
import Paso3 from "./pages/Paso3";

function App() {
  return (
    <BrowserRouter>
      {/* ⚠️ IMPORTANTE: RegistroProvider envuelve todas las rutas */}
      <RegistroProvider>
        <Routes>
          {/* ========== RUTAS DE REGISTRO (3 PASOS) ========== */}
          <Route path="/paso1" element={<Paso1 />} />
          <Route path="/paso2" element={<Paso2 />} />
          <Route path="/paso3" element={<Paso3 />} />

          {/* ========== RUTA DE LOGIN ========== */}
          <Route path="/login" element={<Login />} />

          {/* ========== RUTA PRINCIPAL (PÁGINA DE INICIO) ========== */}
          <Route path="/" element={<PaginaInicio />} />

          {/* ========== OTRAS RUTAS (para agregar después) ========== */}
          {/* <Route path="/buscar" element={<Buscar />} /> */}
          {/* <Route path="/mensajes" element={<Mensajes />} /> */}
          {/* <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} /> */}
        </Routes>
      </RegistroProvider>
    </BrowserRouter>
  );
}

export default App;
