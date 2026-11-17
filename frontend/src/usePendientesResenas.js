import { useEffect, useState } from "react";
import { obtenerResenasPendientes, EVENTO_RESENAS } from "./resenasApi";

/** Reseñas que el usuario todavía no dejó (se actualiza sola cuando deja una o termina un trabajo). */
export function usePendientesResenas(activo = true) {
  const [pendientes, setPendientes] = useState([]);
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    const cargar = () =>
      obtenerResenasPendientes()
        .then((lista) => vivo && setPendientes(lista))
        .catch(() => {});
    cargar();
    window.addEventListener(EVENTO_RESENAS, cargar);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_RESENAS, cargar);
    };
  }, [activo]);
  return pendientes;
}
