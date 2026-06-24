import { createContext, useState } from "react";

export const RegistroContext = createContext();

export const RegistroProvider = ({ children }) => {
  // Paso 1
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [revalidar, setRevalidar] = useState("");
  const [rol, setRol] = useState("trabajador");
  const [archivo, setArchivo] = useState(null);

  // Paso 2
  const [tipoTrabajo, setTipoTrabajo] = useState("");
  const [areaTrabajo, setAreaTrabajo] = useState("");
  const [cobroPorHora, setCobroPorHora] = useState("");
  const [tieneMatricula, setTieneMatricula] = useState(false);
  const [archivoDni, setArchivoDni] = useState(null);

  // Paso 3
  const [archivoAptitud, setArchivoAptitud] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Función para limpiar el estado al finalizar registro
  const limpiarDatos = () => {
    setNombre("");
    setCorreo("");
    setTelefono("");
    setContrasena("");
    setRevalidar("");
    setRol("trabajador");
    setArchivo(null);
    setTipoTrabajo("");
    setAreaTrabajo("");
    setCobroPorHora("");
    setTieneMatricula(false);
    setArchivoDni(null);
    setArchivoAptitud(null);
    setAceptaTerminos(false);
  };

  const value = {
    // Paso 1
    nombre,
    setNombre,
    correo,
    setCorreo,
    telefono,
    setTelefono,
    contrasena,
    setContrasena,
    revalidar,
    setRevalidar,
    rol,
    setRol,
    archivo,
    setArchivo,
    // Paso 2
    tipoTrabajo,
    setTipoTrabajo,
    areaTrabajo,
    setAreaTrabajo,
    cobroPorHora,
    setCobroPorHora,
    tieneMatricula,
    setTieneMatricula,
    archivoDni,
    setArchivoDni,
    // Paso 3
    archivoAptitud,
    setArchivoAptitud,
    aceptaTerminos,
    setAceptaTerminos,
    // Funciones
    limpiarDatos,
  };

  return (
    <RegistroContext.Provider value={value}>
      {children}
    </RegistroContext.Provider>
  );
};
