import { useNavigate } from "react-router-dom"

function App() {
  const navigate = useNavigate()

  return (
    <header className="navbar">

      <div className="left">
        <div className="logo">laburAR</div>
      </div>

      <div className="center">
        <button className="nav-btn">Empleos</button>
        <button className="nav-btn">Mensajes</button>
        <button className="nav-btn">Botón</button>
        <input type="text" placeholder="Buscar..." />
        <button className="filter-btn">Filtro</button>
      </div>

      <div className="right">
        <img 
          src="https://cdn-icons-png.flaticon.com/128/310/310869.png"
          alt="login"
          className="login-icon"
          onClick={() => navigate("/login")}
        />
      </div>

    </header>
  )
}

export default App