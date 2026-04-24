function Register() {
    return (
      <div className="auth-container">
        <h2>Crear cuenta</h2>
  
        <input type="text" placeholder="Nombre" />
        <input type="text" placeholder="Apellido" />
        <input type="text" placeholder="DNI" />
        <input type="text" placeholder="Teléfono" />
        <input type="text" placeholder="Oficio (ej: Electricista)" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Contraseña" />
        <input type="password2" placeholder="Confirme contraseña" />
  
        <label className="file-label">
          Subir certificado:
          <input type="file" />
        </label>
  
        <button className="main-btn">Registrarse</button>
      </div>
    )
  }
  
  export default Register