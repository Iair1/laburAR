import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoTexto from "../assets/logo-texto.svg";
import logoIcono from "../assets/logo-icono.svg";
import imagenLanding from "../assets/imagenLanding.png";

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

:root {
--placeholder: #d9d9d9;
--star: #ffa500;
--focus: #542b19;
  font-size: 16px;
}

.page{
    background-image: url('../assets/fondo.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    height: 100vh;
    margin: 0;}

* {
  box-sizing: border-box;
}

h1, h2, h3, p, figure {
  margin: 0;
}

button, a {
  -webkit-tap-highlight-color: transparent;
}

button {
  font: inherit;
}

a:focus-visible,
button:focus-visible,
.carousel-track:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 5px;
}

.page {
  width: 100%;
  min-height: 128rem;
}

/* Encabezado */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  width: 100%;
  padding-left: 5%;
  padding-right: 5%;
  background: #e8e8e6;
  border-bottom: 1px solid #d4d4d0;
}

.brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    height: 100%;
}

.account-nav {
  display: flex;
  gap: 1.625rem;
}

/* Presentación principal */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 29.4375rem;
  gap: 3.625rem;
  margin: 3.6875rem 4.5rem 0 2.375rem;
}

.hero h1 {
  font-size: 3.375rem;
  font-weight: 400;
  line-height: 4.125rem;
}

.hero p {
  font-size: 2.25rem;
  line-height: 2.71875rem;
}

.image-placeholder {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--placeholder);
}

.image-placeholder img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Las imágenes sin src no muestran el icono de imagen rota. */
.image-placeholder img:not([src]),
.image-placeholder img[src=""] {
  display: none;
}

.placeholder-label {
  font-size: 3.375rem;
  line-height: 1.2;
}

/* Al agregar un src, la imagen reemplaza automáticamente a “imagen”. */
.image-placeholder img[src]:not([src=""]) + .placeholder-label {
  display: none;
}

.hero-image {
  width: 100%;
  height: 25.9375rem;
}

.hero-image .placeholder-label {
  transform: translate(0.375rem, -1rem);
}

/* Beneficios: trabajadores y contratadores */
.benefits {
  margin-top: 7rem;
}

.benefits h2 {
  text-align: center;
  font-size: 3.375rem;
  font-weight: 400;
  line-height: 4.25rem;
}

.audiences {
  display: flex;
  justify-content: space-around;
  align items: center;

}

.audience {
  position: relative;
  min-height: 24.5rem;
  min-width: 20.5rem;
    background-color: #A4A4A4;
    border-radius: 13px;
    border-color: #550000;
}

.audience h3 {
  text-align: center;
  font-size: 2.25rem;
  font-weight: 400;
  line-height: 2.875rem;
}

.audience-workers h3 {
  margin-left: 2.375rem;
}

.audience-clients h3 {
  margin-right: 4rem;
}

.audience ol {
  display: grid;
  gap: 2.0625rem;
  margin: 1rem 1.5rem 0 2.8125rem;
  padding-left: 2.0625rem;
  font-size: 1.6875rem;
  line-height: 2.09375rem;
}

.audience-clients ol {
  margin-left: 1.1875rem;
  margin-right: 1.125rem;
}

.stars {
  position: absolute;
  top: 21rem;
  right: 2.9375rem;
  display: flex;
  gap: 0.4rem;
  width: max-content;
}

.audience-clients .stars {
  right: 1.3125rem;
}

.stars span {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--star);
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
}

/* Carrusel: tres tarjetas y parte de la cuarta, como en la referencia */
.carousel {
  margin-top: 5.875rem;
}

.carousel-track {
  display: flex;
  gap: 2.25rem;
  overflow-x: auto;
  padding-inline: 5.25rem 0;
  scroll-padding-left: 5.25rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.feature-card {
  flex: 0 0 17.375rem;
  min-width: 0;
  scroll-snap-align: start;
}

.card-image {
  width: 100%;
  height: 21.875rem;
}

.feature-card figcaption {
  margin-top: 0.5rem;
  font-size: 1.4375rem;
  line-height: 1.6875rem;
  text-align: center;
}

.feature-card .caption-pending {
  padding-left: 0.9375rem;
  text-align: left;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 7rem;
  margin-top: 4.6875rem;
  padding-right: 3.25rem;
}

.carousel-button {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 6.5rem;
  height: 6rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--placeholder);
  color: #ffffff;
  font-size: 3.375rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
}

.carousel-button:hover {
  filter: brightness(0.95);
}

.carousel-button:active {
  transform: scale(0.96);
}

/* Mantiene las proporciones de la referencia en pantallas medianas. */
@media (min-width: 761px) and (max-width: 1086px) {
  :root {
    font-size: calc(100vw / 67.9375);
  }
}

/* En celular, los bloques pasan a una columna y el carrusel admite swipe. */
@media (max-width: 760px) {
  .page {
    min-height: 100vh;
  }

  .site-header {
    align-items: center;
    flex-wrap: wrap;
    gap: 1.25rem;
  }

  .account-nav {
    gap: 0.625rem;
    margin-top: 0;
  }

  .account-link {
    width: auto;
    min-height: 2.75rem;
    font-size: 0.875rem;
  }

  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
    margin: 2.5rem 1.25rem 0;
  }

  .hero h1 {
    font-size: clamp(2.25rem, 7vw, 3.5rem);
    line-height: 1.15;
  }

  .hero p {
    max-width: 38ch;
    margin-top: 1rem;
    font-size: clamp(1.25rem, 4.5vw, 1.75rem);
    line-height: 1.4;
  }

  .desktop-break {
    display: none;
  }

  .hero-image {
    height: auto;
    aspect-ratio: 915 / 321;
  }

  .placeholder-label {
    font-size: clamp(2rem, 7vw, 3.5rem);
  }

  .hero-image .placeholder-label {
    transform: none;
  }

  .benefits {
    margin: 3.5rem 1.25rem 0;
  }

  .benefits h2 {
    font-size: clamp(1.875rem, 6vw, 2.75rem);
    line-height: 1.18;
  }

 

  .audience {
    min-height: 0;
  }

  .audience h3 {
    margin: 0;
    font-size: 1.75rem;
    line-height: 1.25;
    text-align: center;
  }

  .audience ol {
    gap: 1rem;
    margin: 1.25rem 0 0 0.5rem;
    padding-left: 1.5rem;
    font-size: 1.125rem;
    line-height: 1.5;
  }

  .stars {
    position: static;
    gap: 0.25rem;
    margin: 1rem 0 0 auto;
  }

  .stars span {
    width: 1.75rem;
    height: 1.75rem;
  }

  .carousel {
    margin-top: 3.5rem;
  }

  .carousel-track {
    gap: 1.25rem;
    padding-inline: 1.25rem;
    scroll-padding-left: 1.25rem;
  }

  .feature-card {
    flex-basis: min(17.375rem, calc(100vw - 4rem));
  }

  .card-image {
    height: auto;
    aspect-ratio: 278 / 350;
  }

  .feature-card figcaption {
    font-size: 1.125rem;
    line-height: 1.4;
  }

  .carousel-controls {
    gap: 3rem;
    margin-top: 2rem;
    padding-right: 0;
  }

  .carousel-button {
    width: 4rem;
    height: 4rem;
    font-size: 2.25rem;
  }
}

@media (max-width: 480px) {
  .site-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .account-nav {
    width: 100%;
    justify-content: space-around;
  }

  .account-link {
    flex: 1;
  }
}
  

.enlace-nav {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #333;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-icono-nav { width: 30px; height: 100%; display: block; }
.logo-texto-nav { width: 92px; height: 100%; display: block; }  

.titulo{
  text-align: center;
  }
`
export default function Laburar() {
  
  const navegar = useNavigate();
  // Referencia al elemento desplazable de este componente.
  const carruselRef = useRef(null);

  /** @param {-1 | 1} direccion - Anterior (-1) o siguiente (1). */
  function moverCarrusel(direccion) {
    const carrusel = carruselRef.current;
    if (!carrusel) return;

    const tarjeta = carrusel.querySelector(".feature-card");
    if (!tarjeta) return;

    const espacio = Number.parseFloat(window.getComputedStyle(carrusel).columnGap) || 0;
    const paso = tarjeta.getBoundingClientRect().width + espacio;
    const maximo = Math.max(0, carrusel.scrollWidth - carrusel.clientWidth);
    let destino = carrusel.scrollLeft + direccion * paso;

    // Al llegar a un extremo, la siguiente pulsación vuelve al otro.
    if (direccion > 0 && carrusel.scrollLeft >= maximo - 2) destino = 0;
    if (direccion < 0 && carrusel.scrollLeft <= 2) destino = maximo;

    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    carrusel.scrollTo({
      left: Math.max(0, Math.min(destino, maximo)),
      behavior: reducirMovimiento ? "instant" : "smooth",
    });
  }

  return (
    <>
    <style>{estilos}</style>
    <div className="page">
      <header className="site-header">
        <div className="brand" aria-label="LaburAR, inicio">
          <img src={logoIcono} alt="" className="logo-icono-nav" />
          <img src={logoTexto} alt="LABURAR" className="logo-texto-nav" />
        </div>

        <nav className="account-nav" aria-label="Acceso a la cuenta">
          {/* Faltan las rutas reales de registro e inicio de sesión. */}
          <button className="enlace-nav" onClick={() => navegar("/paso1")}>
            Registrarme
          </button>
          <button className="enlace-nav" onClick={() => navegar("/login")}>
            Iniciar Sesión
          </button>
        </nav>
      </header>


      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p id="hero-title" className="titulo">
             <strong>LABURAR</strong> es una plataforma web diseñada para resolver la brecha de comunicación y contratación entre personas que necesitan servicios de oficio —como plomería, electricidad, gasistería, entre otros — y los trabajadores calificados que los proveen.<br className="desktop-break" />
             {" "}
            <strong>LABURAR</strong> propone centralizar este proceso en un entorno digital accesible, seguro y orientado a la experiencia del usuario, incorporando perfiles verificados, sistema de valoraciones bidireccional, mensajería integrada y filtros inteligentes de búsqueda
          </p>
          </div>

          <div className="image-placeholder hero-image">
            {/* FALTA IMAGEN: agregar el atributo src con la imagen principal. */}
            <img alt="Trabajador de oficio realizando su trabajo"  src={imagenLanding}/>
            <span className="placeholder-label" aria-hidden="true">imagen</span>
          </div>
        </section>

        <section className="benefits" aria-labelledby="benefits-title">
          <h2 id="benefits-title"><strong>laburAR te ayuda a conectar</strong></h2>

          <div className="audiences">
            <article className="audience audience-workers" aria-labelledby="workers-title">
              <h3 id="workers-title"><strong>Trabajadores</strong></h3>
              <ol>
                <li>Red extensa de empleadores</li>
                <li>Menos dependencia de<br className="desktop-break" />{" "}recomentaciones boca a boca</li>
                <li>Puedes buscar un nuevo<br className="desktop-break" />{" "}contacto cuando aquellos que<br className="desktop-break" />{" "}tienes no te llaman.</li>
              </ol>
              {/* Estrellas decorativas presentes en la referencia. */}
              <div className="stars" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>

            <article className="audience audience-clients" aria-labelledby="clients-title">
              <h3 id="clients-title"><strong>Contratadores</strong></h3>
              <ol>
                <li>Servicio de chateo desde la<br className="desktop-break" />{" "}aplicacion</li>
                <li>Menos dependencia de<br className="desktop-break" />{" "}contactos</li>
                <li>Puedes contratar cualquier tipo<br className="desktop-break" />{" "}de servicio desde la comodidad<br className="desktop-break" />{" "}de tu casa</li>
              </ol>
              <div className="stars" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </article>
          </div>
        </section>

        <section className="carousel" aria-label="Más ventajas de LaburAR">
          <div className="carousel-track" ref={carruselRef} id="feature-cards" tabIndex={0} aria-label="Tarjetas de ventajas; desplazamiento horizontal">
            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de trabajadores calificados. */}
                <img alt="Trabajadores calificados" />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <figcaption>Encuentra trabajadores<br className="desktop-break" />{" "}calificados</figcaption>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de búsqueda de clientes. */}
                <img alt="Trabajador encontrando nuevos clientes" />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <figcaption>Consigue cliente aun en<br className="desktop-break" />{" "}las peores epocas</figcaption>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de nuevos contactos. */}
                <img alt="Personas contactándose a través de LaburAR" />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <figcaption>No dependas de que te<br className="desktop-break" />{" "}pasen un contacto</figcaption>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de la cuarta tarjeta. */}
                <img alt="Otra ventaja de usar LaburAR" />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              {/* FALTA TEXTO: la cuarta tarjeta está cortada en la referencia. */}
              <figcaption className="caption-pending">No ...</figcaption>
            </figure>
          </div>

          <div className="carousel-controls" aria-label="Controles del carrusel">
            <button className="carousel-button" type="button" data-direction="-1" onClick={() => moverCarrusel(-1)} aria-label="Ver tarjeta anterior" aria-controls="feature-cards">
              <span aria-hidden="true">&lt;</span>
            </button>
            <button className="carousel-button" type="button" data-direction="1" onClick={() => moverCarrusel(1)} aria-label="Ver tarjeta siguiente" aria-controls="feature-cards">
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}