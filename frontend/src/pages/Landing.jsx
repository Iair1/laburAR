import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoTexto from "../assets/logo-texto.svg";
import logoIcono from "../assets/logo-icono.svg";
import imagenLanding from "../assets/imagenLanding.png";
import imagenFlecha from "../assets/flechaBoton.png"
import fondoLanding from "../assets/fondoLanding.png";

import carrusel0 from "../assets/carrusel/carrusel_0.png";
import carrusel1 from "../assets/carrusel/carrusel_1.png";
import carrusel2 from "../assets/carrusel/carrusel_2.png";
import carrusel3 from "../assets/carrusel/carrusel_3.png";

import instagram from "../assets/iconos-contacto/instagram.png";
import tiktok from "../assets/iconos-contacto/tiktok.png";
import gmail from "../assets/iconos-contacto/gmail.png";

const carrusel = [carrusel0, carrusel1, carrusel2, carrusel3];

const estilos = `

@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:ital,opsz@0,14..32;1,14..32&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:ital,opsz@0,14..32;1,14..32&display=swap');

.inter-default{
  font-family: "Inter", sans-serif;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
}


  * { box-sizing: border-box; margin: 0; padding: 0; }


body{
  background-image: none;
}
.page{
  width: 100vw;
  background-image: url(${fondoLanding});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-attachment: scroll;
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
  aspect-ratio: 1920 / 153;
  width: 100%;
  padding-left: 5%;
  padding-right: 5%;
  background: #e8e8e6;
  border-bottom: 1px solid #d4d4d0;
}

.brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 23.65vw;
    aspect-ratio: 454/119;
    margin-left:2.76vw;
    cursor: pointer;
    user-select: none;
}

.account-nav {
  display: flex;
  margin-left: 11.46vw;
  width: 27.29vw;
  justify-content: space-between;
}

/* Presentación principal */
.hero {
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 3%;
  padding-top: 5%;
  padding-bottom: 0;
}

.hero h1 {
  font-size: 3.375rem;
  font-weight: 400;
  line-height: 4.125rem;
}

.hero p {
  font-size: 24px;
}

.image-placeholder {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
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
  width: 48vw;
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
  font-family: "Archivo Black", sans-serif;
  text-align: center;
  font-size: 38px;
  font-weight: 400;
  line-height: 4.25rem;
}

.audiences {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 5%;

}

.audience {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  width: 30.02vw;
  min-height: 31.66vw;
}

.audience div{
  background-color: #A4A4A4;
  opacity: 0.6;
  position: absolute;
    border-radius: 13px;
    border-color: #550000;
  border-width: 3px;
  border-style: solid;
  z-index: 1;

  inset: 0;
}



.audience h3, .audience ol{
  padding: 0;
  z-index: 2;}

.audience h3 {
  text-align: center;
  font-size: 23px;
  font-weight: 400;
  line-height: 2.875rem;
  font-family: "Archivo Black", sans-serif;
  z-index: 2;
}


.audience ol {
  display: grid;
  gap: 1.5rem;
  width: 88%;
  font-size: 27px;
  line-height: 2.09375rem;
  list-style-position: inside;
  z-index: 2;
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
  width: 25.57vw;
  aspect-ratio: 491 / 785;
  flex-shrink: 0;
  min-width: 0;
  scroll-snap-align: start;
}

.card-image {
  width: 100%;
  aspect-ratio: 491 / 617;
}

.feature-card strong {
  display: block;
  margin-top: 0.5rem;
  font-size: 25.5px;
  line-height: 1.6875rem;
  text-align: center;
  font-family: "Archivo Black", sans-serif;
}

.feature-card .caption-pending {
  padding-left: 0.9375rem;
  text-align: left;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 7rem;
  margin-top: 1.5rem;
}

.carousel-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 8.7vw;
  aspect-ratio: 1/1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background-color: #A4A4A4;
}

.carousel-button:hover {
  filter: brightness(0.95);
}

.carousel-button:active {
  transform: scale(0.96);
}

.carousel-button img{
    width: 33%;
    height: 33%;
}
  

.enlace-nav {
  border: none;
  font-size: 1.25rem;
  font-family: "Inter", sans-serif;
  background-color: #3B1E0D;
  color: white;
  border-radius: 47px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  width: 12.24vw;
  aspect-ratio: 235 / 85;
}
.logo-icono-nav { height: 100%; display: block; }
.logo-texto-nav { height: 35%; display: block; }  

.titulo{
  text-align: center;
  font-size: 33px;
  font-family: "Inter", sans-serif;
  width: 39.375vw;
  }

.negrita{
  font-family: "Archivo Black";
}

footer{
  width: 100%;
  height: 45vh;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.contacto{
width: 31.09vw;
}

.contacto strong{
  font-size: 30px;
  color: #550000;
  font-family: "Archivo Black";
}

.contacto ul{
  padding-left: 1.759vw;
  }

.contacto ul li{
display: flex;
justify-content: flex-start;
align-items: center;
line-height: 4.629vh;
font-family: "Inter", sans-serif;
font-size: 29px;
}
.contacto ul li img{
  width: 1.72vw;
  height: auto;
  flex-shrink: 0;
}

.logoPieDePagina{
  width: 16.4%;
  height: 27.96vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.logoIconoPieDePagina{
  width: 75.24%;
  height: auto;
}
.logoTextoPieDePagina{
  width: 100%;
  height: auto;
}

footer div{
  width: 31.09vw;}

a{
  text-decoration: none;
  color: #000000;
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
             <strong className="negrita">LABURAR</strong> es una plataforma web diseñada para resolver la brecha de comunicación y contratación entre personas que necesitan servicios de oficio —como plomería, electricidad, gasistería, entre otros — y los trabajadores calificados que los proveen.<br className="desktop-break" />
             {" "}
            <strong className="negrita">LABURAR</strong> propone centralizar este proceso en un entorno digital accesible, seguro y orientado a la experiencia del usuario, incorporando perfiles verificados, sistema de valoraciones bidireccional, mensajería integrada y filtros inteligentes de búsqueda
          </p>
          </div>

          <div className="image-placeholder hero-image">
            {/* FALTA IMAGEN: agregar el atributo src con la imagen principal. */}
            <img alt="Trabajador de oficio realizando su trabajo"  src={imagenLanding}/>
            <span className="placeholder-label" aria-hidden="true">imagen</span>
          </div>
        </section>

        <section className="benefits" aria-labelledby="benefits-title">
          <h2 id="benefits-title"><strong>LABURAR TE AYUDA A CONECTAR</strong></h2>

          <div className="audiences">
            <article className="audience audience-workers" aria-labelledby="workers-title">
              <div></div>
              <h3 id="workers-title"><strong>TRABAJADOR@S</strong></h3>
              <ol>
                <li>Red extensa de empleadores</li>
                <li>Menos dependencia de recomentaciones boca a boca</li>
                <li>Puedes buscar un nuevo contacto cuando aquellos que tienes no te llaman.</li>
              </ol>
              {/* Estrellas decorativas presentes en la referencia. */}

            </article>

            <article className="audience audience-clients" aria-labelledby="clients-title">
              <div></div>
              <h3 id="clients-title"><strong>CONTRATADOR@S</strong></h3>
              <ol>
                <li>Servicio de chateo desde la aplicacion</li>
                <li>Menos dependencia de contactos</li>
                <li>Puedes contratar cualquier tipo de servicio desde la comodidad de tu casa</li>
              </ol>
            </article>
          </div>
        </section>

        <section className="carousel" aria-label="Más ventajas de LaburAR">
          <div className="carousel-track" ref={carruselRef} id="feature-cards" tabIndex={0} aria-label="Tarjetas de ventajas; desplazamiento horizontal">
            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de trabajadores calificados. */}
                <img alt="Trabajadores calificados" src={carrusel[0]} />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <strong>ENCUENTRA TRABAJADORES CALIFICADOS</strong>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de búsqueda de clientes. */}
                <img alt="Trabajador encontrando nuevos clientes" src={carrusel[1]} />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <strong>ENCUENTRA CLIENTES AUN EN LAS PEORES ÉPOCAS</strong>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de nuevos contactos. */}
                <img alt="Personas contactándose a través de LaburAR" src={carrusel[2]} />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              <strong>NO DEPENDAS DE CONTACTOS</strong>
            </figure>

            <figure className="feature-card">
              <div className="image-placeholder card-image">
                {/* FALTA IMAGEN: agregar src con la imagen de la cuarta tarjeta. */}
                <img alt="Otra ventaja de usar LaburAR" src={carrusel[3]} />
                <span className="placeholder-label" aria-hidden="true">imagen</span>
              </div>
              {/* FALTA TEXTO: la cuarta tarjeta está cortada en la referencia. */}
              <strong className="caption-pending">NO NECESITAS NADA MÁS</strong>
            </figure>
          </div>

          <div className="carousel-controls" aria-label="Controles del carrusel">
            <button className="carousel-button" type="button" data-direction="-1" onClick={() => moverCarrusel(-1)} aria-label="Ver tarjeta anterior" aria-controls="feature-cards">
              <img src={imagenFlecha} alt="" style={{transform: "scaleX(-1)"}}/>
            </button>
            <button className="carousel-button" type="button" data-direction="1" onClick={() => moverCarrusel(1)} aria-label="Ver tarjeta siguiente" aria-controls="feature-cards">
              <img src={imagenFlecha} alt="" />
            </button>
          </div>
        </section>

        <footer>
          <section className="contacto" aria-labelledby="contacto-title"> 
            <strong>CONTACTANOS</strong>
            <ul>
              <li>
                <img src={instagram} alt="Instagram" />
                <p>@laburar</p>
              </li>
              <li>
                <img src={tiktok} alt="TikTok" />
                <p>laburAR</p>
              </li>
              <li>
                <img src={gmail} alt="Gmail" />
                <p>laburAR@gmail.com</p>
              </li>
              <li>
                <img src={logoIcono} alt="LaburAR" />
                <a href="https://laburarp.vercel.app">https://laburarp.vercel.app</a>
              </li>
            </ul>
          </section>
          <section className="logoPieDePagina">
            <img src={logoIcono} alt="LaburAR" className="logoIconoPieDePagina" />
            <img src={logoTexto} alt="LaburAR" className="logoTextoPieDePagina" />
          </section>
          <div></div>
        </footer>
      </main>
    </div>
    </>
  );
}