import { createContext, useState } from "react";

export const RegistroContext = createContext();

export const RegistroProvider = ({ children }) => {

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [revalidar, setRevalidar] = useState("");
  const [archivo, setArchivo] = useState(null);

  const [dni, setDni] = useState("");
  const [domicilioCalle, setDomicilioCalle] = useState("");
  const [domicilioAltura, setDomicilioAltura] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  // Requerido por el backend en crearCuenta
  const [localidad, setLocalidad] = useState("");

  // Se completa solo si el usuario entra con Google: se saltea la
  // validación de contraseña y se bloquea el campo de correo.
  const [registradoConGoogle, setRegistradoConGoogle] = useState(false);

  const limpiarDatos = () => {
    setNombre("");
    setCorreo("");
    setTelefono("");
    setContrasena("");
    setRevalidar("");
    setArchivo(null);
    setDni("");
    setDomicilioCalle("");
    setDomicilioAltura("");
    setCodigoPostal("");
    setLocalidad("");
    setRegistradoConGoogle(false);
  };

  const value = {
    nombre, setNombre,
    correo, setCorreo,
    telefono, setTelefono,
    contrasena, setContrasena,
    revalidar, setRevalidar,
    archivo, setArchivo,
    dni, setDni,
    domicilioCalle, setDomicilioCalle,
    domicilioAltura, setDomicilioAltura,
    codigoPostal, setCodigoPostal,
    localidad, setLocalidad,
    registradoConGoogle, setRegistradoConGoogle,
    limpiarDatos,
  };

  return (
    <RegistroContext.Provider value={value}>
      {children}
    </RegistroContext.Provider>
  );
};
