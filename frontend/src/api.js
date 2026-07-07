// URL base del backend 
const API_URL = 'http://localhost:3000/api';

/**
 * Registrar un nuevo usuario
 * @param {Object} datosUsuario - Datos del usuario
 * @returns {Promise} - Respuesta del backend
 */

// traduce el frontend al formato del back
export const registrarUsuario = async (datosUsuario) => {
  try {
    const datos = {
      nombre_completo: datosUsuario.nombre,
      contraseña: datosUsuario.contrasena,
      localidad: datosUsuario.areaTrabajo,
      domicilio: datosUsuario.correo,
      dni: datosUsuario.archivoDni?.name,
      foto_perfil: datosUsuario.archivo?.name,
    };

    //  AGREGAR ESTO PARA DEBUGGEAR
    console.log("📤 Datos que se envían al backend:", datos);

    const respuesta = await fetch(`${API_URL}/usuarios/crearCuenta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();
    
    // ✅ AGREGAR ESTO PARA VER LA RESPUESTA DEL BACKEND
    console.log("📥 Respuesta del backend:", resultado);

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
    const respuesta = await fetch(`${API_URL}/usuarios/iniciarSesion`, {
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