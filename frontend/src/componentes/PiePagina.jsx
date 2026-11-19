import { Link } from "react-router-dom";
import { EMAIL_CONTACTO } from "../contacto";

const estilos = `
  .pie-pagina {
    border-top: 1px solid #e6dede; background: #faf7f7; color: #6b5a5a; font-size: 0.78rem;
    padding: 18px 16px 22px; margin-top: 32px;
  }
  .contenido-pie { max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; justify-content: space-between; }
  .enlaces-pie { display: flex; flex-wrap: wrap; gap: 6px 18px; }
  .enlaces-pie a { color: #570101; font-weight: 600; text-decoration: none; }
  .enlaces-pie a:hover { text-decoration: underline; }
`;

export default function PiePagina() {
  return (
    <footer className="pie-pagina">
      <style>{estilos}</style>
      <div className="contenido-pie">
        <span>© {new Date().getFullYear()} LaburAR · Conectamos trabajadores con quienes los necesitan</span>
        <nav className="enlaces-pie" aria-label="Información legal">
          <Link to="/terminos">Términos y condiciones</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/seguridad">Consejos de seguridad</Link>
          {EMAIL_CONTACTO && <a href={`mailto:${EMAIL_CONTACTO}`}>Contacto</a>}
        </nav>
      </div>
    </footer>
  );
}
