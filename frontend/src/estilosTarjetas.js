// Estilos de la búsqueda de trabajadores (mismas tarjetas, panel de filtros,
// pestañas y buscador), copiados para usarlos en las páginas de problemas
// sin tocar PaginaBusqueda.jsx.
export const estilosTarjetas = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pagina-problemas {
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    margin: 0;
  }

  /* --- buscador dentro de la barra de navegación --- */
  .buscador-nav {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 999px;
    height: 38px;
    width: 100%;
    max-width: 440px;
    padding-left: 14px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
  }
  .buscador-nav svg.lupa { width: 16px; height: 16px; color: #222; flex-shrink: 0; }
  .buscador-nav input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 0.85rem;
    color: #222;
    min-width: 0;
    padding: 0 10px;
    font-family: inherit;
  }
  .buscador-nav input::placeholder { color: #555; }
  .select-barrio-nav {
    height: 38px;
    max-width: 150px;
    padding: 0 30px 0 16px;
    border-radius: 999px;
    border: none;
    background: #570101 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='white' d='M0 2.5h10L5 8.5z'/%3E%3C/svg%3E") no-repeat right 12px center / 9px;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    font-family: inherit;
  }
  .select-barrio-nav option { color: #222; background: #fff; }

  .aviso-login-busqueda {
    max-width: 1180px;
    margin: 1.5rem auto 0;
    padding: 0 2rem;
  }
  .tarjeta-aviso-login {
    background: #fff3cd;
    border: 1px solid #ffe08a;
    border-radius: 10px;
    padding: 0.9rem 1.1rem;
    font-size: 0.85rem;
    color: #6b5300;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .boton-login-aviso {
    background: #570101;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .layout-resultados {
    display: flex;
    align-items: flex-start;
    gap: 1.75rem;
    padding: 1.5rem 2rem 3rem;
    max-width: 1220px;
    margin: 0 auto;
  }

  /* --- panel de filtros --- */
  .panel-filtros {
    width: 260px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #b9b9b9;
    border-radius: 18px;
    padding: 1.1rem;
    position: sticky;
    top: 76px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: calc(100vh - 92px);
    overflow-y: auto;
  }
  .panel-filtros > * { flex-shrink: 0; }
  .caja-filtro {
    border: 1px solid #b9b9b9;
    border-radius: 8px;
    padding: 0.8rem 0.85rem;
  }
  .titulo-caja-filtro {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 0.65rem;
  }
  .caja-resumen { text-align: left; padding: 1rem 1rem 0.85rem; }
  .categoria-resumen { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; }
  .precio-resumen { font-size: 1.15rem; font-weight: 700; color: #1a1a1a; margin: 6px 0 2px; }
  .detalle-resumen { font-size: 0.66rem; color: #666; }
  .separador-resumen { height: 1px; background: #cfcfcf; margin: 10px 0 8px; }
  .ayuda-resumen { font-size: 0.64rem; color: #777; text-align: center; line-height: 1.35; }
  .contador-solicitudes {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #570101;
    color: #fff;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
  }

  .etiqueta-filtro {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 0.4rem;
  }
  .fila-precio { display: flex; align-items: center; gap: 8px; }
  .fila-precio input[type="number"] {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    outline: none;
    font-family: inherit;
  }
  .fila-precio input[type="number"]:focus { border-color: #570101; }
  .guion-precio { color: #999; font-size: 0.8rem; }
  .select-filtro {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    color: #222;
    background: #fff;
    outline: none;
    margin-bottom: 0.65rem;
    font-family: inherit;
  }
  .select-filtro:focus { border-color: #570101; }

  .grilla-fecha-filtro {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .chip-fecha-filtro {
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    color: #1a1a1a;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 7px 6px;
    border-radius: 999px;
    cursor: pointer;
    text-align: center;
    line-height: 1.15;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .chip-fecha-filtro:hover { background: #bdbdbd; }
  .chip-fecha-filtro.activo { background: #7a2a2a; border-color: #570101; color: #fff; }
  .campo-fecha-manual { margin-top: 8px; }
  .campo-fecha-manual input[type="date"] {
    width: 100%;
    height: 32px;
    border: 1px solid #ccc;
    border-radius: 999px;
    padding: 0 10px;
    font-size: 0.78rem;
    outline: none;
    font-family: inherit;
  }

  .opciones-radio-filtro { display: flex; flex-direction: column; gap: 6px; }
  .opcion-radio-filtro {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.76rem;
    color: #222;
    cursor: pointer;
    user-select: none;
  }
  .opcion-radio-filtro input { position: absolute; opacity: 0; pointer-events: none; }
  .marca-radio {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #b9b9b9;
    border: 1px solid #8f8f8f;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .opcion-radio-filtro input:checked + .marca-radio { background: #7a2a2a; border-color: #570101; }
  .opcion-radio-filtro input:focus-visible + .marca-radio { outline: 2px solid #570101; outline-offset: 2px; }

  .boton-limpiar-filtros {
    width: 100%;
    height: 32px;
    border-radius: 999px;
    border: 1px solid #ccc;
    background: #f5f5f3;
    color: #444;
    font-size: 0.76rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .boton-limpiar-filtros:hover { background: #eaeae8; }

  /* --- columna de resultados --- */
  .columna-resultados { flex: 1; min-width: 0; }
  .pestanas-busqueda { display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
  .pestana-busqueda {
    padding: 6px 18px;
    border-radius: 999px;
    border: 1px solid #8f8f8f;
    background: #c9c9c9;
    color: #1a1a1a;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .pestana-busqueda:hover { background: #bdbdbd; }
  .pestana-busqueda.activa { background: #7a2a2a; border-color: #570101; color: #fff; }

  .resumen-resultados {
    font-size: 0.82rem;
    color: #444;
    margin-bottom: 1rem;
  }
  .resumen-resultados strong { color: #1a1a1a; }

  .lista-tarjetas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 18px;
  }

  .tarjeta-trabajador {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #9e7d7d;
    border-radius: 12px;
    padding: 16px 16px 14px;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  }
  .tarjeta-trabajador:hover {
    border-color: #570101;
    box-shadow: 0 8px 22px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .cabecera-tarjeta { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .imagen-trabajador {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px solid #555;
    overflow: hidden;
    flex-shrink: 0;
    background: #eef0ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  .imagen-trabajador img { width: 100%; height: 100%; object-fit: cover; font-size: 0; color: transparent; }
  .imagen-trabajador .avatar-laburar { font-size: 1.5rem; }
  .identidad-trabajador { min-width: 0; }
  .nombre-trabajador {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fila-calificacion { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
  .numero-calificacion { font-size: 0.95rem; font-weight: 500; color: #1a1a1a; }
  .estrellas { display: inline-flex; gap: 1px; }
  .estrellas svg { width: 11px; height: 11px; }
  .subtexto-calificacion { font-size: 0.7rem; color: #666; margin-top: 1px; }

  .lista-meta-tarjeta { list-style: none; display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .item-meta-tarjeta {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    font-size: 0.74rem;
    color: #333;
    line-height: 1.3;
  }
  .item-meta-tarjeta svg { width: 13px; height: 13px; flex-shrink: 0; color: #570101; margin-top: 1px; }
  .item-meta-tarjeta .texto-recortado {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .acciones-tarjeta { display: flex; gap: 10px; margin-top: auto; }
  .boton-ver-perfil, .boton-agendar {
    flex: 1;
    font-size: 0.74rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 7px 10px;
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
    font-family: inherit;
  }
  .boton-ver-perfil { background: #fff; border: 1px solid #570101; color: #1a1a1a; }
  .boton-ver-perfil:hover { background: #f6eeee; }
  .boton-agendar { background: #7a2a2a; border: 1px solid #570101; color: #fff; }
  .boton-agendar:hover { background: #570101; }
  .boton-ver-perfil:disabled, .boton-agendar:disabled { opacity: 0.6; cursor: not-allowed; }

  .sin-resultados, .estado-carga, .estado-error {
    text-align: center;
    padding: 3rem 1rem;
    color: #555;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.75);
    border-radius: 12px;
  }
  .estado-error { color: #b23a1c; }

  .esqueleto-tarjeta {
    height: 230px;
    border-radius: 12px;
    background: linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%);
    background-size: 400% 100%;
    animation: brillo-esqueleto 1.3s ease infinite;
  }
  @keyframes brillo-esqueleto {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }

  .toast-agendar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #570101;
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    z-index: 300;
  }

  .boton-mostrar-filtros {
    display: none;
    margin-left: auto;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid #570101;
    background: #fff;
    color: #570101;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  @media (max-width: 860px) {
    .layout-resultados { flex-direction: column; padding: 1.25rem 1rem 3rem; }
    .panel-filtros { width: 100%; position: static; max-height: none; display: none; order: 2; }
    .panel-filtros.abierto { display: flex; }
    .columna-resultados { order: 1; width: 100%; }
    .layout-resultados.filtros-abiertos .columna-resultados { order: 3; }
    .boton-mostrar-filtros { display: inline-block; }
    .aviso-login-busqueda { padding: 0 1rem; }
    .select-barrio-nav { max-width: 120px; }
  }
`;
