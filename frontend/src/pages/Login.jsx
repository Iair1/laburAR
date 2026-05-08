import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>

      <input type="text" placeholder="Email o usuario" />
      <input type="password" placeholder="Contraseña" />

      <button className="main-btn">Ingresar</button>

      <p>
        ¿No tienes una cuenta?{" "}
        <span onClick={() => navigate("/registro")}>
          Regístrate
        </span>
      </p>
    </div>
  )
}

export default Login