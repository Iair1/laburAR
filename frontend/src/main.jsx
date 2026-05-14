import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Mensajes from './pages/Mensajes.jsx'
import Paso1 from './pages/Paso1.jsx'
import Paso2 from './pages/Paso2.jsx'
import Paso3 from './pages/Paso3.jsx'
import Empleos from './pages/Empleos.jsx'
import './index.css'

import { BrowserRouter, Routes, Route } from "react-router-dom"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/mensajes" element={<Mensajes />} />
        <Route path="/paso1" element={<Paso1 />} />
        <Route path="/paso2" element={<Paso2 />} />
        <Route path="/paso3" element={<Paso3 />} />
        <Route path="/empleos" element={<Empleos />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)