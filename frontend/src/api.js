const API_URL = import.meta.env.DEV
  ? "https://laburar-three.vercel.app/api/usuarios"
  : "/api/usuarios";
/**
 * Convierte un File a base64 (data URL) para poder mandárselo al backend,
 * que espera un string que Cloudinary pueda subir (base64, URL o ruta local).
 *
 * Si el archivo es una imagen, la redimensiona y comprime antes de convertirla,
 * para no mandar fotos de varios MB (celulares suelen sacar fotos de 3-8MB) y
 * evitar que el backend rechace el request por tamaño de body.
 *
 * Si es un PDF (u otro archivo no-imagen), se manda tal cual en base64 sin comprimir.
 */
const LADO_MAXIMO_PX = 800; // suficiente para foto de perfil o verificar un DNI
const CALIDAD_JPEG = 0.7;

const archivoABase64 = (archivo) => {
  return new Promise((resolve, reject) => {
    if (!archivo) {
      resolve(null);
      return;
    }

    // Los PDF no se pueden comprimir con canvas, van tal cual
    if (!archivo.type.startsWith("image/")) {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = reject;
      lector.readAsDataURL(archivo);
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Redimensionar manteniendo la proporción si excede el lado máximo
        if (width > LADO_MAXIMO_PX || height > LADO_MAXIMO_PX) {
          if (width > height) {
            height = Math.round((height * LADO_MAXIMO_PX) / width);
            width = LADO_MAXIMO_PX;
          } else {
            width = Math.round((width * LADO_MAXIMO_PX) / height);
            height = LADO_MAXIMO_PX;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Re-exportamos como JPEG comprimido (más liviano que PNG)
        const dataUrlComprimido = canvas.toDataURL("image/jpeg", CALIDAD_JPEG);
        resolve(dataUrlComprimido);
      };
      img.onerror = reject;
      img.src = lector.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
};

/**
 * Registrar un nuevo usuario
 * @param {Object} datosUsuario - Datos del usuario
 * @returns {Promise} - Respuesta del backend
 */

// traduce el frontend al formato del back
export const registrarUsuario = async (datosUsuario) => {
  try {
    // convertimos las 3 fotos (File) a base64 (comprimidas si son imágenes) antes de armar el body
    const [fotoBase64, fotoDniBase64, fotoAptitudBase64] = await Promise.all([
      archivoABase64(datosUsuario.archivo),
      archivoABase64(datosUsuario.archivoDni),
      archivoABase64(datosUsuario.archivoAptitud),
    ]);

    const datos = {
      nombre_completo: datosUsuario.nombre,
      contraseña: datosUsuario.contrasena,
      correo: datosUsuario.correo,
      telefono: datosUsuario.telefono,
      rol: datosUsuario.rol,
      localidad: datosUsuario.localidad,
      domicilio_calle: datosUsuario.domicilioCalle,
      domicilio_altura: datosUsuario.domicilioAltura,
      codigo_postal: datosUsuario.codigoPostal,
      dni: datosUsuario.dni,
      tipo_trabajo: datosUsuario.tipoTrabajo,
      cobro_por_hora: datosUsuario.cobroPorHora,
      tiene_matricula: datosUsuario.tieneMatricula,
      foto_perfil: fotoBase64,
      foto_dni: fotoDniBase64,
      foto_aptitud: fotoAptitudBase64,
    };

    console.log("📤 Datos que se envían al backend:", {
      ...datos,
      foto_perfil: fotoBase64 ? "[base64 omitido en el log]" : null,
    });

    const respuesta = await fetch(`${API_URL}/crearCuenta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

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