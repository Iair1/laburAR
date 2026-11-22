import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { BrowserRouter } from "react-router-dom"
import { reportarErrorDelNavegador } from "./cuentaApi"

// Los errores que pasan en el navegador de la gente le llegan al administrador (panel → Errores)
window.addEventListener("error", (evento) => {
  if (!evento.message || /ResizeObserver|Script error/i.test(evento.message)) return
  reportarErrorDelNavegador({ mensaje: evento.message, detalle: evento.error?.stack || `${evento.filename}:${evento.lineno}` })
})
window.addEventListener("unhandledrejection", (evento) => {
  const motivo = evento.reason
  // Los errores del servidor ya quedan anotados en el backend; acá van los del propio navegador
  if (!motivo || typeof motivo.status === "number") return
  reportarErrorDelNavegador({ mensaje: motivo.message || String(motivo), detalle: motivo.stack })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
