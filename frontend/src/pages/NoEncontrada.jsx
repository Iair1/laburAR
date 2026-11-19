import { useNavigate } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import PiePagina from "../componentes/PiePagina";

const estilos = `
  .pagina-no-encontrada { min-height: 100vh; display: flex; flex-direction: column; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .contenido-no-encontrada { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 18px; }
  .numero-no-encontrada { font-size: 4.5rem; font-weight: 800; color: #570101; margin: 0; line-height: 1; }
  .titulo-no-encontrada { font-size: 1.3rem; color: #3b1e0d; margin: 12px 0 6px; }
  .texto-no-encontrada { color: #6b5a5a; margin: 0 0 22px; max-width: 420px; line-height: 1.5; }
  .acciones-no-encontrada { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .acciones-no-encontrada button {
    border-radius: 999px; padding: 10px 20px; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit;
    border: 1.5px solid #570101; background: #fff; color: #570101;
  }
  .acciones-no-encontrada button.principal { background: #570101; color: #fff; }
`;

export default function NoEncontrada() {
  const navegar = useNavigate();
  return (
    <div className="pagina-no-encontrada">
      <style>{estilos}</style>
      <BarraNav />
      <main className="contenido-no-encontrada">
        <p className="numero-no-encontrada">404</p>
        <h1 className="titulo-no-encontrada">No encontramos esta página</h1>
        <p className="texto-no-encontrada">Puede que el link esté mal escrito o que la página ya no exista.</p>
        <div className="acciones-no-encontrada">
          <button className="principal" onClick={() => navegar("/")}>Ir al inicio</button>
          <button onClick={() => navegar("/buscar")}>Buscar un trabajador</button>
        </div>
      </main>
      <PiePagina />
    </div>
  );
}
