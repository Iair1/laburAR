// URL base del backend - CAMBIA ESTO SI TU BACKEND ESTÁ EN OTRO PUERTO
const API_URL = "http://localhost:3000/api/usuarios";

/**
 * Registrar un nuevo usuario
 * @param {Object} datosUsuario - Datos del usuario
 * @returns {Promise} - Respuesta del backend
 */
export const registrarUsuario = async (datosUsuario) => {
  try {
    // Preparar los datos según lo que espera el backend
    const datos = {
      nombre_completo: datosUsuario.nombre,
      contraseña: datosUsuario.contrasena,
      localidad: datosUsuario.areaTrabajo, // Del Paso 2
      domicilio: datosUsuario.correo, // O puedes agregar un campo nuevo
      dni: datosUsuario.archivoDni?.name, // Nombre del archivo
      foto_perfil: datosUsuario.archivo?.name, // Nombre del archivo
    };

    const respuesta = await fetch(`${API_URL}/crearCuenta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.message || "Error al registrar");
    }

    return resultado;
  } catch (error) {
    console.error("Error en registro:", error);
    throw error;
  }
};

/**
 * Iniciar sesión
 * @param {string} nombreCompleto - Nombre del usuario
 * @param {string} contrasena - Contraseña del usuario
 * @returns {Promise} - Token de autenticación
 */
export const iniciarSesion = async (nombreCompleto, contrasena) => {
  try {
    const respuesta = await fetch(`${API_URL}/iniciarSesion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre_completo: nombreCompleto,
        contraseña: contrasena,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.message || "Error al iniciar sesión");
    }

    // Guardar el token en localStorage
    if (resultado.token) {
      localStorage.setItem("token", resultado.token);
    }

    return resultado;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

/**
 * Cerrar sesión
 */
export const cerrarSesion = () => {
  localStorage.removeItem("token");
};

/**
 * Obtener el token guardado
 * @returns {string|null} - Token o null
 */
export const obtenerToken = () => {
  return localStorage.getItem("token");
};
