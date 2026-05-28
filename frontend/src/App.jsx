import { useNavigate } from "react-router-dom"

/**/import { useEffect } from "react"/**/

function App() {
  const navigate = useNavigate()

/**/
  useEffect(() => {
    const base = import.meta.env.DEV ? '' : ''  // relativo en ambos casos
    fetch('/usuarios/prueba')
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err))
  }, [])
/**/

  return (
    <header className="navbar">

      <div className="left">
        <div className="logo">laburAR</div>
      </div>

      <div className="center">
      <button 
          className="nav-btn" 
          onClick={() => navigate("/empleos")} // Navega a la página de Empleos
        >
          Empleos
        </button>
        <button 
          className="nav-btn" 
          onClick={() => navigate("/mensajes")}
        >
          Mensajes
        </button>
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