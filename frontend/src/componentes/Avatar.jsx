import { useState } from "react";

const estilos = `
  .avatar-laburar {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: #7a2a2a;
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.02em;
    user-select: none;
    line-height: 1;
  }
  .avatar-laburar img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

function iniciales(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primera + ultima).toUpperCase();
}

/**
 * Foto de perfil redonda. Si no hay foto (o la URL no carga) muestra las
 * iniciales del nombre sobre el bordó de LaburAR.
 * Props:
 *  - src: URL de la foto (puede ser null)
 *  - nombre: se usa para las iniciales y el texto alternativo
 *  - tamano: diámetro en px (por defecto ocupa el 100% del contenedor)
 *  - className: clases extra
 */
export default function Avatar({ src, nombre, tamano, className = "" }) {
  // Guardamos qué URL falló (y no un booleano) para que, si cambia la foto,
  // se vuelva a intentar mostrar la nueva.
  const [srcConError, setSrcConError] = useState(null);
  const mostrarFoto = Boolean(src) && srcConError !== src;

  const estiloTamano = tamano
    ? { width: tamano, height: tamano, fontSize: Math.max(10, Math.round(tamano * 0.38)) }
    : { width: "100%", height: "100%", fontSize: "1.4em" };

  return (
    <>
      <style>{estilos}</style>
      <span className={`avatar-laburar ${className}`} style={estiloTamano}>
        {mostrarFoto ? (
          <img src={src} alt={nombre || "Foto de perfil"} onError={() => setSrcConError(src)} />
        ) : (
          <span aria-label={nombre || "Usuario"}>{iniciales(nombre)}</span>
        )}
      </span>
    </>
  );
}
