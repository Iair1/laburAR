// Estilos propios de problemas (las tarjetas, filtros y pestañas vienen de estilosTarjetas.js)
export const estilosProblemas = `
  .chip-estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.66rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 3px 9px;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .chip-estado::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .chip-estado.abierto { background: #e8f1fb; color: #1d4f8c; }
  .chip-estado.agendado { background: #e6f4ea; color: #1e6b2d; }
  .chip-estado.terminado { background: #f0ece4; color: #5b4a2e; }
  .chip-estado.cancelado { background: #fbeceb; color: #a1261e; }
  .chip-estado.vencido { background: #efefed; color: #666; }

  .chip-urgencia {
    display: inline-block;
    font-size: 0.64rem;
    font-weight: 700;
    border-radius: 6px;
    padding: 2px 7px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .chip-urgencia.urgente { background: #570101; color: #fff; }
  .chip-urgencia.semana { background: #f4e2c9; color: #7a4a06; }
  .chip-urgencia.flexible { background: #efefed; color: #555; }
  .chip-coincide {
    display: inline-block;
    font-size: 0.64rem;
    font-weight: 700;
    border-radius: 6px;
    padding: 2px 7px;
    background: #e6f4ea;
    color: #1e6b2d;
  }

  .imagen-problema {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px solid #555;
    overflow: hidden;
    flex-shrink: 0;
    background: #f4eeee;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .imagen-problema .icono-cat {
    width: 38px;
    height: 38px;
    background: #570101;
    -webkit-mask: var(--icono) center / contain no-repeat;
    mask: var(--icono) center / contain no-repeat;
  }
  .imagen-problema svg { width: 34px; height: 34px; color: #570101; }
  .imagen-problema.chica { width: 52px; height: 52px; }
  .imagen-problema.chica .icono-cat { width: 26px; height: 26px; }
  .imagen-problema.chica svg { width: 24px; height: 24px; }

  .persona-tarjeta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: #333;
    background: #fcf8f8;
    border: 1px solid #ecdede;
    border-radius: 10px;
    padding: 7px 9px;
    margin: -4px 0 12px;
  }
  .persona-tarjeta strong { color: #1a1a1a; }
  .persona-tarjeta.cita { background: #f1f9f2; border-color: #b7dfba; color: #1e5e22; }
  .persona-tarjeta.cita strong { color: #1e5e22; }

  /* --- calendario (mismo estilo que el de Agendar) --- */
  .cal-nav { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 0.6rem; }
  .cal-boton-mes {
    background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #1a1a1a; font-weight: 600;
    width: 28px; height: 28px; border-radius: 50%; line-height: 1;
  }
  .cal-boton-mes:hover:not(:disabled) { background: #f0f0ee; }
  .cal-boton-mes:disabled { opacity: 0.3; cursor: default; }
  .cal-mes { font-size: 1rem; font-weight: 500; color: #1a1a1a; min-width: 140px; text-align: center; text-transform: capitalize; }
  .cal-semana, .cal-grilla { display: grid; grid-template-columns: repeat(7, 1fr); }
  .cal-semana { background: #7a2a2a; border-radius: 10px; padding: 6px 10px; margin-bottom: 8px; }
  .cal-semana span { text-align: center; font-size: 0.76rem; font-weight: 600; color: #fff; }
  .cal-contenedor { background: #a8a8a8; border-radius: 14px; padding: 10px; }
  .cal-grilla { row-gap: 6px; }
  .cal-celda { display: flex; align-items: center; justify-content: center; padding: 2px 0; }
  .cal-celda.en-rango { background: #3b1e0d; }
  .cal-celda.inicio-rango { background: linear-gradient(90deg, transparent 50%, #3b1e0d 50%); }
  .cal-celda.fin-rango { background: linear-gradient(90deg, #3b1e0d 50%, transparent 50%); }
  .cal-dia {
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    font-size: 0.76rem; font-weight: 600; color: #fff; background: #6b4a3e; border-radius: 50%;
    cursor: pointer; border: none; font-family: inherit; transition: background 0.12s, transform 0.1s;
  }
  .cal-dia:hover:not(:disabled) { background: #570101; transform: scale(1.06); }
  .cal-dia:disabled { background: #c4bcb9; color: #8a8380; cursor: not-allowed; }
  .cal-dia.hoy { box-shadow: 0 0 0 2px #fff; }
  .cal-dia.en-rango { background: #3b1e0d; }
  .cal-dia.apagado { background: #8f7a72; opacity: 0.55; }
  .cal-dia.elegido { background: #8a0f0f; box-shadow: 0 0 0 2px #fff; }
  @media (max-width: 420px) { .cal-dia { width: 27px; height: 27px; font-size: 0.7rem; } }

  /* --- modales (mismo estilo que Ver perfil / Agendar) --- */
  .fondo-modal-problema {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 20, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 200;
    animation: aparecer-fondo-problema 0.15s ease-out;
  }
  @keyframes aparecer-fondo-problema { from { opacity: 0; } to { opacity: 1; } }
  .tarjeta-modal-problema {
    position: relative;
    background: #fff;
    border: 1.5px solid #1a1a1a;
    border-radius: 22px;
    padding: 1.6rem 1.9rem 1.5rem;
    width: 100%;
    max-width: 600px;
    max-height: 92vh;
    overflow-y: auto;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
    animation: aparecer-tarjeta-problema 0.18s ease-out;
  }
  @keyframes aparecer-tarjeta-problema { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
  .cerrar-modal-problema {
    position: absolute; top: 12px; right: 14px; width: 30px; height: 30px; border-radius: 50%;
    background: none; border: none; cursor: pointer; font-size: 1rem; color: #666;
  }
  .cerrar-modal-problema:hover { background: #f0f0ee; color: #1a1a1a; }
  .titulo-modal-grande {
    font-size: 1.5rem; font-weight: 700; color: #111; text-transform: uppercase; text-align: center; letter-spacing: 0.01em;
  }
  .subtitulo-modal { font-size: 0.8rem; color: #333; text-align: center; margin: 4px 0 2px; }
  .detalle-modal { font-size: 0.74rem; color: #777; text-align: center; margin-bottom: 1rem; }
  .seccion-modal { margin-bottom: 1.05rem; }
  .titulo-seccion-modal { font-size: 0.82rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.4rem; }
  .texto-seccion-modal { font-size: 0.82rem; color: #333; line-height: 1.5; white-space: pre-line; }
  .etiqueta-modal { display: block; font-size: 0.85rem; font-weight: 500; color: #1a1a1a; margin: 0 0 0.3rem 0.4rem; }
  .entrada-modal, .textarea-modal, .select-modal {
    width: 100%; padding: 9px 14px; border: 1px solid #8f8f8f; border-radius: 10px; font-size: 0.84rem;
    color: #222; outline: none; font-family: inherit; background: #fff; box-sizing: border-box;
  }
  .select-modal {
    background: #c9c9c9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='%23222' d='M0 2.5h10L5 8.5z'/%3E%3C/svg%3E") no-repeat right 14px center / 10px;
    appearance: none; -webkit-appearance: none; padding-right: 34px; cursor: pointer;
  }
  .entrada-modal:focus, .textarea-modal:focus, .select-modal:focus { border-color: #570101; box-shadow: 0 0 0 3px rgba(87,1,1,0.12); }
  .entrada-modal.con-error, .textarea-modal.con-error, .select-modal.con-error { border-color: #b3261e; }
  .textarea-modal { resize: vertical; min-height: 80px; line-height: 1.4; }
  .fila-modal { display: flex; gap: 12px; }
  .fila-modal > div { flex: 1; min-width: 0; }
  .chips-modal { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-modal {
    padding: 6px 12px; border-radius: 999px; border: 1px solid #8f8f8f; background: #c9c9c9; font-size: 0.74rem;
    font-weight: 500; color: #1a1a1a; cursor: pointer; font-family: inherit; transition: background 0.15s;
  }
  .chip-modal:hover { background: #bdbdbd; }
  .chip-modal.activo { background: #7a2a2a; border-color: #570101; color: #fff; }
  .cal-resumen { text-align: center; font-size: 0.76rem; color: #555; margin: 8px 0 2px; }
  .cal-resumen strong { color: #570101; }
  .error-modal { font-size: 0.8rem; color: #b3261e; font-weight: 600; text-align: center; margin: 8px 0; }
  .boton-grande-modal {
    display: block; margin: 1rem auto 0; min-width: 220px; padding: 11px 36px; background: #6b0d0d; color: #fff;
    border: none; border-radius: 999px; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
    cursor: pointer; font-family: inherit; box-shadow: 0 4px 12px rgba(87,1,1,0.25); transition: background 0.15s, transform 0.1s;
  }
  .boton-grande-modal:hover { background: #570101; }
  .boton-grande-modal:disabled { opacity: 0.6; cursor: not-allowed; }
  .acciones-modal { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 0.8rem; }
  .boton-pill { border-radius: 999px; padding: 9px 18px; font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: inherit; }
  .boton-pill.primario { background: #570101; color: #fff; border: 1px solid #570101; }
  .boton-pill.primario:hover { background: #3b1e0d; }
  .boton-pill.secundario { background: #fff; color: #1a1a1a; border: 1px solid #570101; }
  .boton-pill.secundario:hover { background: #f6eeee; }
  .boton-pill.peligro { background: #b3261e; color: #fff; border: 1px solid #b3261e; }
  .boton-pill.peligro:hover { background: #8f1d17; }
  .boton-pill:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 520px) {
    .tarjeta-modal-problema { padding: 1.3rem 1rem 1.2rem; }
    .fila-modal { flex-direction: column; gap: 0; }
  }
`;
