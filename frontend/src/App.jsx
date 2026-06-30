import { Routes, Route } from "react-router-dom";
import { RegistroProvider } from "./context/RegistroContext";


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
        
        <Route path="/" element={<PaginaInicio />} />

        
        <Route path="/login" element={<Login />} />

        
        <Route path="/paso1" element={<Paso1 />} />
        <Route path="/paso2" element={<Paso2 />} />
        <Route path="/paso3" element={<Paso3 />} />

        
        <Route path="/mensajes" element={<Mensajes />} />
        <Route path="/empleos" element={<Empleos />} />
      </Routes>
    </RegistroProvider>
  );
}

export default App;
