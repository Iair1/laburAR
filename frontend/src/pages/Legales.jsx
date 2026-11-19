import { Link, NavLink } from "react-router-dom";
import BarraNav from "../componentes/BarraNav";
import PiePagina from "../componentes/PiePagina";
import { EMAIL_CONTACTO } from "../contacto";

// ⚠️ Completar con los datos reales de quien es responsable del sitio (nombre o razón social y CUIT)
// antes de salir al público. Estos textos son una base: conviene que los revise un abogado.
const RESPONSABLE = import.meta.env.VITE_RESPONSABLE_LEGAL || "los responsables de LaburAR";
const ACTUALIZADO = "noviembre de 2026";

const estilos = `
  .pagina-legal { min-height: 100vh; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .contenido-legal { max-width: 820px; margin: 0 auto; padding: 28px 18px 10px; color: #2a2222; line-height: 1.6; font-size: 0.93rem; }
  .pestanas-legal { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .pestanas-legal a {
    padding: 6px 14px; border-radius: 999px; border: 1px solid #e3d3d3; color: #570101; font-weight: 600;
    font-size: 0.8rem; text-decoration: none; background: #fff;
  }
  .pestanas-legal a.active { background: #570101; color: #fff; border-color: #570101; }
  .contenido-legal h1 { font-size: 1.6rem; color: #3b1e0d; margin: 0 0 4px; }
  .fecha-legal { color: #8a7a7a; font-size: 0.8rem; margin: 0 0 20px; }
  .contenido-legal h2 { font-size: 1.05rem; color: #570101; margin: 22px 0 6px; }
  .contenido-legal ul { padding-left: 1.2rem; margin: 6px 0; }
  .contenido-legal li { margin: 3px 0; }
  .recuadro-legal { background: #f8f3f3; border: 1px solid #ecdcdc; border-radius: 10px; padding: 12px 14px; margin: 14px 0; font-size: 0.86rem; }
  .contenido-legal a { color: #3346c9; }
`;

const contacto = EMAIL_CONTACTO ? (
  <>escribiendo a <a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a></>
) : (
  <>escribiéndonos por los canales de contacto del sitio</>
);

function Terminos() {
  return (
    <>
      <h1>Términos y condiciones</h1>
      <p className="fecha-legal">Última actualización: {ACTUALIZADO}</p>
      <p>
        Estos términos explican cómo funciona LaburAR y las reglas para usarlo. Al crear una cuenta o usar el sitio,
        aceptás estos términos y la <Link to="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>1. Qué es LaburAR</h2>
      <p>
        LaburAR es una plataforma que pone en contacto a personas que necesitan un trabajo o arreglo (clientes) con
        personas que ofrecen sus servicios (trabajadores). LaburAR <strong>no presta los servicios</strong>, no es
        empleador de los trabajadores ni forma parte del acuerdo entre ellos y los clientes: cada trabajador es
        independiente y responsable de su trabajo.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Tenés que ser mayor de 18 años y dar datos verdaderos (nombre, DNI, domicilio, email y teléfono).</li>
        <li>Una cuenta por persona. No podés usar la cuenta de otro ni hacerte pasar por otra persona.</li>
        <li>Cuidá tu contraseña: lo que se haga desde tu cuenta es tu responsabilidad.</li>
        <li>Podés eliminar tu cuenta cuando quieras desde <Link to="/mi-cuenta">Mi cuenta</Link>.</li>
      </ul>

      <h2>3. Trabajadores</h2>
      <ul>
        <li>Publicá solo servicios que sepas hacer, con precios y experiencia reales.</li>
        <li>
          Si la ley exige matrícula o habilitación para un trabajo (por ejemplo, gas o electricidad), tenés que tenerla
          vigente para ofrecerlo.
        </li>
        <li>La insignia de "Identidad verificada" solo indica que revisamos tu DNI; no certifica tu trabajo.</li>
        <li>Cumplí las citas que agendás o avisá con tiempo si no podés ir.</li>
      </ul>

      <h2>4. Clientes</h2>
      <ul>
        <li>Describí el problema con la verdad y avisá si hay riesgos (gas, electricidad, alturas, etc.).</li>
        <li>Tratá con respeto a los trabajadores y cancelá con tiempo si ya no necesitás el trabajo.</li>
      </ul>

      <h2>5. Precios, pagos y garantías</h2>
      <p>
        El precio, la forma de pago y las garantías del trabajo se acuerdan directamente entre el cliente y el
        trabajador. Hoy LaburAR no cobra ni procesa pagos entre usuarios. Te recomendamos dejar todo acordado por el chat
        del sitio antes de empezar.
      </p>

      <h2>6. Qué no está permitido</h2>
      <ul>
        <li>Estafas, cobros por adelantado engañosos o pedir datos de tarjetas o claves.</li>
        <li>Acoso, amenazas, discriminación o contenido ofensivo, sexual o violento.</li>
        <li>Publicidad o spam, y sacar a otros usuarios del sitio para evitar las reglas.</li>
        <li>Reseñas falsas, o reseñar trabajos que no existieron.</li>
        <li>Usar datos de otros usuarios para algo distinto a coordinar el trabajo.</li>
      </ul>

      <h2>7. Reseñas</h2>
      <p>
        Cuando termina un trabajo, el cliente y el trabajador se pueden dejar una reseña. Las reseñas tienen que ser
        honestas y sobre ese trabajo. Podemos quitar reseñas que no cumplan estas reglas.
      </p>

      <h2>8. Denuncias, bloqueos y suspensiones</h2>
      <p>
        Podés bloquear a cualquier usuario y denunciar perfiles, mensajes o publicaciones. Revisamos las denuncias y
        podemos advertir, quitar contenido o suspender cuentas que no cumplan estos términos, incluso sin aviso previo
        cuando haya riesgo para otras personas.
      </p>
      <div className="recuadro-legal">
        Si estás en peligro, llamá primero al <strong>911</strong>. La denuncia en LaburAR no reemplaza una denuncia
        policial o judicial.
      </div>

      <h2>9. Responsabilidad</h2>
      <p>
        Hacemos lo posible para que el sitio funcione bien y sea seguro, pero no podemos garantizar la calidad,
        seguridad o legalidad de los trabajos acordados entre usuarios, ni que los datos que cargan sean ciertos. En la
        medida que lo permita la ley, LaburAR no es responsable por los daños que surjan de esos acuerdos. Esto no
        limita los derechos que te da la Ley de Defensa del Consumidor N° 24.240.
      </p>

      <h2>10. Lo que publicás</h2>
      <p>
        Las fotos, textos y reseñas que subís siguen siendo tuyos. Nos das permiso para mostrarlos en el sitio mientras
        tengas tu cuenta. No subas contenido de otros sin permiso.
      </p>

      <h2>11. Cambios</h2>
      <p>
        Podemos actualizar estos términos. Si el cambio es importante, te vamos a avisar en el sitio. Si seguís usando
        LaburAR después del cambio, se entiende que lo aceptás.
      </p>

      <h2>12. Ley aplicable y contacto</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. LaburAR es operado por {RESPONSABLE}. Para
        cualquier consulta o reclamo podés comunicarte {contacto}.
      </p>
    </>
  );
}

function Privacidad() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p className="fecha-legal">Última actualización: {ACTUALIZADO}</p>
      <p>
        Esta política explica qué datos personales usamos, para qué, a quién se muestran y cómo podés ejercer tus
        derechos, según la Ley de Protección de los Datos Personales N° 25.326. El responsable de la base de datos es{" "}
        {RESPONSABLE}.
      </p>

      <h2>1. Qué datos guardamos</h2>
      <ul>
        <li><strong>De tu cuenta:</strong> nombre, email, teléfono, DNI, domicilio, zona, foto de perfil y contraseña (guardada cifrada).</li>
        <li><strong>Si ofrecés servicios:</strong> tus servicios, precios, experiencia, especialidades y fotos de trabajos. La foto del DNI, si la subís para verificar tu identidad.</li>
        <li><strong>De lo que hacés en el sitio:</strong> problemas y solicitudes, citas, mensajes, reseñas, bloqueos, denuncias y búsquedas.</li>
        <li><strong>Si entrás con Google:</strong> tu nombre, email y foto de Google.</li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Crear y mantener tu cuenta, y dejarte entrar de forma segura.</li>
        <li>Mostrar tu perfil y conectarte con clientes o trabajadores de tu zona.</li>
        <li>Coordinar citas, mensajes, avisos y reseñas.</li>
        <li>Verificar identidades, prevenir fraudes y revisar denuncias.</li>
        <li>Mandarte emails necesarios, como el código para recuperar tu contraseña.</li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>

      <h2>3. Qué ven los demás</h2>
      <div className="recuadro-legal">
        <strong>Se muestra:</strong> tu nombre, foto, zona, servicios, fotos de trabajos, reseñas y puntaje.
        <br />
        <strong>No se muestra nunca:</strong> tu DNI, la foto del DNI, tu dirección exacta, tu email ni tu teléfono.
        La foto del DNI se guarda de forma privada y solo la ve el equipo de LaburAR para verificarla.
      </div>
      <p>
        Cuando tenés una cita con alguien, esa persona puede ver los datos del trabajo que compartiste (por ejemplo,
        el barrio y la descripción del problema) y escribirte por el chat.
      </p>

      <h2>4. Con quién los compartimos</h2>
      <p>
        Solo con los servicios que necesitamos para que el sitio funcione: alojamiento del sitio y la base de datos
        (Vercel y el proveedor de base de datos), almacenamiento de imágenes (Cloudinary), inicio de sesión con Google
        (si lo usás) y el servicio que manda los emails. También podemos compartirlos si una autoridad competente lo
        pide según la ley.
      </p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas tu cuenta. Si la eliminás, borramos tus datos personales (nombre, email, teléfono, DNI,
        dirección, fotos y servicios). Los mensajes y reseñas que intercambiaste quedan para la otra persona, a nombre
        de "Usuario eliminado".
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Podés ver y corregir tus datos en <Link to="/mi-cuenta">Mi cuenta</Link>, y eliminar tu cuenta desde ahí
        mismo. También podés pedir acceso, rectificación o supresión de tus datos {contacto}.
      </p>
      <div className="recuadro-legal">
        El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma
        gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme
        lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA,
        en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y
        reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes
        en materia de protección de datos personales.
      </div>

      <h2>7. Seguridad</h2>
      <p>
        Las contraseñas se guardan cifradas, la conexión al sitio es segura (HTTPS) y la foto del DNI se guarda de
        forma privada. Aun así, ningún sistema es 100% seguro: no compartas tu contraseña con nadie.
      </p>

      <h2>8. Almacenamiento en tu navegador</h2>
      <p>
        Guardamos en tu navegador lo necesario para mantener tu sesión iniciada y algunas preferencias. No usamos
        cookies de publicidad.
      </p>

      <h2>9. Menores de edad</h2>
      <p>LaburAR no está pensado para menores de 18 años y no pedimos datos de menores a sabiendas.</p>

      <h2>10. Cambios</h2>
      <p>Si cambiamos esta política, vamos a actualizar la fecha de arriba y avisarte si el cambio es importante.</p>
    </>
  );
}

function Seguridad() {
  return (
    <>
      <h1>Consejos de seguridad</h1>
      <p className="fecha-legal">Para contratar y trabajar con tranquilidad</p>

      <h2>Antes del trabajo</h2>
      <ul>
        <li>Mirá las reseñas, el puntaje y si el perfil tiene <strong>identidad verificada</strong>.</li>
        <li>Hablá por el chat de LaburAR: queda registro de lo que acordaron.</li>
        <li>Dejá claro el precio, qué incluye y la forma de pago antes de empezar.</li>
        <li>Para gas y electricidad, pedí la matrícula del profesional.</li>
      </ul>

      <h2>Pagos</h2>
      <ul>
        <li>Desconfiá de quien pide todo el pago por adelantado o "una seña" para reservar.</li>
        <li>Nunca compartas claves, códigos que te lleguen por SMS o email, ni datos de tu tarjeta.</li>
      </ul>

      <h2>El día de la cita</h2>
      <ul>
        <li>Si podés, que haya otra persona en la casa. Avisale a alguien de confianza quién va y a qué hora.</li>
        <li>Trabajadores: compartí con alguien la dirección y el horario de la cita.</li>
      </ul>

      <h2>Si algo no está bien</h2>
      <ul>
        <li>Usá <strong>Bloquear</strong> para que esa persona no te pueda escribir ni mandarte solicitudes.</li>
        <li>Usá <strong>Denunciar</strong> en el perfil, el chat o la publicación: lo revisamos.</li>
        <li>Si estás en peligro, llamá al <strong>911</strong>.</li>
      </ul>
    </>
  );
}

const PAGINAS = { terminos: Terminos, privacidad: Privacidad, seguridad: Seguridad };

export default function Legales({ pagina = "terminos" }) {
  const Contenido = PAGINAS[pagina] || Terminos;
  return (
    <div className="pagina-legal">
      <style>{estilos}</style>
      <BarraNav />
      <main className="contenido-legal">
        <nav className="pestanas-legal" aria-label="Documentos">
          <NavLink to="/terminos">Términos y condiciones</NavLink>
          <NavLink to="/privacidad">Privacidad</NavLink>
          <NavLink to="/seguridad">Consejos de seguridad</NavLink>
        </nav>
        <Contenido />
      </main>
      <PiePagina />
    </div>
  );
}
