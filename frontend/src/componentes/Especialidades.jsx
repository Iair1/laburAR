import { useId, useState } from "react";
import { agregarEspecialidad, eliminarEspecialidad } from "../api";

const estilos = `
  .especialidades-servicio { margin: 2px 0 12px; }
  .titulo-especialidades { font-size: 0.7rem; font-weight: 800; color: #7a2a2a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .chips-especialidades { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-especialidad {
    display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600; color: #3b1e0d;
    background: #f4eeee; border: 1px solid #e3d3d3; border-radius: 999px; padding: 3px 4px 3px 10px;
  }
  .chip-especialidad button {
    width: 18px; height: 18px; border-radius: 50%; border: none; background: none; color: #8a5a5a; cursor: pointer; font-size: 0.7rem; line-height: 1;
  }
  .chip-especialidad button:hover { background: #e7d6d6; color: #570101; }
  .agregar-especialidad { display: flex; gap: 6px; margin-top: 8px; }
  .agregar-especialidad input {
    flex: 1; min-width: 0; border: 1px solid #c9b8b8; border-radius: 999px; padding: 5px 12px; font-size: 0.76rem; font-family: inherit; outline: none;
  }
  .agregar-especialidad input:focus { border-color: #570101; }
  .agregar-especialidad button {
    border: 1px solid #570101; background: #fff; color: #570101; border-radius: 999px; padding: 5px 12px; font-size: 0.72rem;
    font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .agregar-especialidad button:hover { background: #f6eeee; }
  .agregar-especialidad button:disabled { opacity: 0.6; cursor: wait; }
  .sugerencias-especialidad { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
  .sugerencia-especialidad {
    border: 1px dashed #c9b8b8; background: none; color: #6b5a5a; border-radius: 999px; padding: 3px 9px; font-size: 0.68rem;
    cursor: pointer; font-family: inherit;
  }
  .sugerencia-especialidad:hover { border-style: solid; color: #570101; }
  .error-especialidad { font-size: 0.7rem; color: #b3261e; font-weight: 600; margin-top: 4px; }
`;

// Ideas por categoría (además de las que ya cargaron otros trabajadores)
const IDEAS = {
  "Plomería": ["Destapaciones", "Pérdidas de agua", "Termotanques", "Cambio de grifería", "Instalación sanitaria"],
  "Electricidad": ["Tableros", "Cortocircuitos", "Iluminación", "Instalaciones nuevas", "Puesta a tierra"],
  "Pintura": ["Interiores", "Exteriores", "Impermeabilización", "Empapelado", "Rejas y aberturas"],
  "Gasista": ["Matriculado", "Instalación de cocinas", "Calefactores", "Pérdidas de gas"],
  "Carpintería": ["Muebles a medida", "Placares", "Puertas y ventanas", "Restauración"],
  "Albañilería": ["Revoques", "Contrapisos", "Ampliaciones", "Humedad"],
  "Jardinería": ["Corte de pasto", "Poda", "Diseño de jardines", "Riego"],
  "Limpieza": ["Fin de obra", "Oficinas", "Limpieza profunda", "Vidrios"],
  "Cerrajería": ["Apertura de puertas", "Cambio de cerraduras", "Cerraduras de seguridad"],
  "Aire acondicionado": ["Instalación", "Carga de gas", "Limpieza y mantenimiento"],
  "Mudanza": ["Fletes", "Embalaje", "Armado de muebles"],
  "Herrería": ["Rejas", "Portones", "Soldadura"],
  "Informática": ["Reparación de PC", "Redes y WiFi", "Instalación de programas"],
  "Piletero": ["Mantenimiento", "Limpieza", "Reparación de filtros"],
  "Soldadura": ["Eléctrica", "Autógena", "Estructuras"],
};

/**
 * Especialidades de un servicio (ej: Plomería → "Destapaciones").
 *  - servicio: { aptitud, id (aptitudid), usuario_aptitudid }
 *  - especialidades: [{ id, aptitud_especifica }] de este servicio
 *  - sugerenciasBase: nombres que ya existen para esta categoría
 *  - onCambio(): para volver a cargar la lista
 */
export default function Especialidades({ servicio, especialidades, sugerenciasBase = [], onCambio, onSesionVencida }) {
  const [texto, setTexto] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const idCampo = useId();
  if (!servicio?.usuario_aptitudid) return null;

  const tiene = new Set(especialidades.map((e) => e.aptitud_especifica.toLowerCase()));
  const sugerencias = [...new Set([...(IDEAS[servicio.aptitud] || []), ...sugerenciasBase])]
    .filter((s) => !tiene.has(s.toLowerCase()))
    .slice(0, 5);

  const manejarError = (err, mensaje) => {
    if (err.status === 401) {
      onSesionVencida?.();
      return;
    }
    setError(/no pertenece/i.test(err.message || "") ? "Esa especialidad ya existe en otra categoría. Probá con otro nombre." : err.message || mensaje);
  };

  const agregar = async (nombre) => {
    const limpio = String(nombre || "").replace(/\s+/g, " ").trim();
    if (!limpio) return;
    if (tiene.has(limpio.toLowerCase())) {
      setError("Ya la tenés.");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      await agregarEspecialidad(limpio.charAt(0).toUpperCase() + limpio.slice(1), servicio);
      setTexto("");
      onCambio?.();
    } catch (err) {
      manejarError(err, "No se pudo agregar.");
    } finally {
      setProcesando(false);
    }
  };

  const quitar = async (e) => {
    setProcesando(true);
    setError("");
    try {
      await eliminarEspecialidad(e.id);
      onCambio?.();
    } catch (err) {
      manejarError(err, "No se pudo quitar.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="especialidades-servicio">
      <style>{estilos}</style>
      <p className="titulo-especialidades">Especialidades</p>
      {especialidades.length > 0 && (
        <div className="chips-especialidades">
          {especialidades.map((e) => (
            <span className="chip-especialidad" key={e.id}>
              {e.aptitud_especifica}
              <button type="button" onClick={() => quitar(e)} disabled={procesando} aria-label={`Quitar ${e.aptitud_especifica}`}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="agregar-especialidad">
        <input
          id={idCampo}
          type="text"
          maxLength={40}
          placeholder={`Ej: ${(IDEAS[servicio.aptitud] || ["Tu especialidad"])[0]}`}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && agregar(texto)}
          aria-label={`Agregar una especialidad de ${servicio.aptitud}`}
        />
        <button type="button" onClick={() => agregar(texto)} disabled={procesando || !texto.trim()}>+ Agregar</button>
      </div>
      {sugerencias.length > 0 && (
        <div className="sugerencias-especialidad">
          {sugerencias.map((s) => (
            <button type="button" key={s} className="sugerencia-especialidad" onClick={() => agregar(s)} disabled={procesando}>+ {s}</button>
          ))}
        </div>
      )}
      {error && <p className="error-especialidad" role="alert">{error}</p>}
    </div>
  );
}
