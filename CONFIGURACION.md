# Configuración para salir al público

Todo se carga en **Vercel → el proyecto → Settings → Environment Variables**. Después de agregar o
cambiar una variable hay que volver a publicar (Deployments → ⋯ → Redeploy).

## Lista para lanzar

- [ ] `JWT_SECRET` cargado (ver abajo). **Sin esto no se puede salir al público.**
- [ ] Emails configurados con Brevo (`BREVO_API_KEY` + `EMAIL_REMITENTE`): sin esto no se confirma el
      email al registrarse, no llegan avisos por email y no anda "Olvidé mi contraseña".
- [ ] `SITIO_URL` con la dirección real del sitio (para los links de los emails).
- [ ] La base de datos usa el **pooler** del proveedor (ver "Base de datos").
- [ ] Copias de seguridad automáticas de la base activadas en el proveedor (ver "Copias de seguridad").
- [ ] Al menos un administrador con email (para entrar al panel y recibir los avisos de errores).
- [ ] `VITE_RESPONSABLE_LEGAL` y `VITE_EMAIL_CONTACTO` cargados (aparecen en los textos legales).
- [ ] Textos legales revisados por un abogado.
- [ ] Base de datos inscripta en la AAIP (ver "Registro de la base de datos").

## Obligatorias

| Variable | Para qué |
|---|---|
| `JWT_SECRET` | Firma las sesiones. Tiene que ser un texto largo y secreto (por ejemplo, 40 caracteres al azar). **En Vercel es obligatoria: si falta, nadie puede iniciar sesión** (queda anotado en la pestaña Errores). En tu compu, si no la cargás, se usa una clave de prueba. |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | La base de datos (ya estaban). |
| `DB_PORT` | Opcional: el puerto de la base (por defecto 5432; el pooler de Supabase usa 6543). |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Las fotos (ya estaban). También se usan para el DNI privado. |

## Emails (confirmar la cuenta, avisos y recuperar la contraseña)

Con esto configurado:
- Al registrarse, a cada persona le llega un link para **confirmar su email**. Hasta que lo confirma no
  puede publicar problemas ni mandar solicitudes, propuestas o mensajes (las cuentas de antes no tienen
  que confirmarlo).
- Llegan **avisos por email** de propuestas, mensajes, solicitudes, citas y reseñas (cada uno los puede
  desactivar en Mi cuenta).
- Anda "Olvidé mi contraseña".
- A los administradores les llega un email cuando hay errores (como mucho uno por hora).

Sin esto, todo lo anterior queda apagado y el sitio sigue funcionando como antes.

1. Crear una cuenta gratis en [Brevo](https://www.brevo.com) (300 emails por día).
2. En Brevo → *Senders* agregar y verificar el email que va a aparecer como remitente (sirve un Gmail).
3. En Brevo → *SMTP & API* → *API Keys* crear una clave.
4. Cargar en Vercel:
   - `BREVO_API_KEY` = la clave
   - `EMAIL_REMITENTE` = el email verificado
   - `EMAIL_NOMBRE` = `LaburAR` (opcional)
   - `SITIO_URL` = la dirección del sitio, sin barra al final (ej: `https://laburar-three.vercel.app`).
     Es la que se usa en los links de los emails.

(También funciona con [Resend](https://resend.com) usando `RESEND_API_KEY` en vez de `BREVO_API_KEY`, pero Resend pide verificar un dominio propio.)

## Verificar el teléfono por SMS (opcional)

Si se configura, en Mi cuenta aparece "Verificar con un SMS" y el perfil muestra "Teléfono verificado".
Usa la misma cuenta de Brevo:

1. En Brevo → *SMS* comprar créditos de SMS (se pagan aparte de los emails).
2. Cargar en Vercel `SMS_REMITENTE` = el nombre que aparece como remitente (hasta 11 letras, ej: `LaburAR`).

## Iniciar sesión con Google (opcional)

Si no se configura, el botón de Google no aparece.

1. Google Cloud Console → APIs y servicios → Credenciales → *ID de cliente de OAuth* (tipo "Aplicación web").
2. En "Orígenes autorizados de JavaScript" agregar el dominio del sitio (ej: `https://laburar-three.vercel.app`).
3. Cargar en Vercel `VITE_GOOGLE_CLIENT_ID` = el ID de cliente (el backend usa el mismo valor para verificar).

## Opcionales

| Variable | Para qué |
|---|---|
| `CRON_SECRET` | Si está, solo el cron de Vercel puede correr `/api/solicitudes/revisarTerminadas`. |
| `VITE_EMAIL_CONTACTO` | Email de contacto que aparece en el pie y en los textos legales. |
| `VITE_RESPONSABLE_LEGAL` | Nombre o razón social (y CUIT) de quien es responsable del sitio, para los Términos y la Política de privacidad. |
| `DB_POOL_MAX` | Cuántas conexiones a la base puede tener abiertas cada copia del servidor (por defecto 5). |

## Administradores

El panel está en `/admin`. Para que alguien sea administrador, correr una vez en la base:

```sql
UPDATE usuarios SET es_admin = true WHERE email = 'tu-email@ejemplo.com';
```

Después esa persona tiene que cerrar sesión y volver a entrar para ver "Panel de administración" en su menú.
En el panel se revisan las denuncias y reclamos, se verifican los DNI, se suspenden cuentas y se ven los
**errores** del servidor y del navegador.

## Si aparece "Hubo un problema en el servidor"

Ese mensaje tapa el error real de la base (para no mostrarle detalles internos a la gente). Para verlo:

- **En el panel de administración → Errores**: quedan anotados todos, con la página y la hora.
- **Entrando con una cuenta de administrador**: el mismo mensaje agrega al final
  "(Detalle para administradores: …)" con el error exacto.
- **Probando el backend en tu compu** (fuera de Vercel): el detalle se muestra siempre, aunque no
  hayas entrado como administrador.
- **En Vercel**: el proyecto → *Logs*, y buscar `Error interno` o `Reseñas:`.

## Base de datos

El backend crea solo las tablas y columnas nuevas la primera vez que las necesita
(`backend/esquema.js`). Si el usuario de la base no tiene permiso para crear tablas, correr a mano
los archivos de `backend/migraciones/` (se pueden correr varias veces sin problema). El último,
`006_empresas.sql`, agrega `usuarios.es_empresa` (cuentas de empresa, sin DNI), deja el DNI como opcional
y agrega `historial.solicitudid`.

**Con mucha gente usándolo al mismo tiempo**: cada copia del servidor reutiliza sus conexiones, pero en
Vercel puede haber muchas copias a la vez. Para que la base no se sature, usá el *pooler* de tu proveedor:
- **Neon**: en el panel, "Connection pooling" → usar el host que termina en `-pooler` como `DB_HOST`.
- **Supabase**: Project Settings → Database → *Connection pooling* → usar ese host como `DB_HOST` y
  `DB_PORT` = `6543`.

## Copias de seguridad

Revisá en el panel de tu proveedor de base de datos que estén activadas las copias automáticas
(Neon: *Branches / Restore*; Supabase: *Database → Backups*) y probá restaurar una alguna vez.
Antes de cambios grandes, conviene bajar una copia a mano (`pg_dump`).

## Registro de la base de datos (Argentina)

La Ley 25.326 pide inscribir las bases de datos con datos personales en el Registro Nacional de Bases de
Datos de la **AAIP** (Agencia de Acceso a la Información Pública). Se hace online en el sitio de la AAIP
con el CUIT de quien es responsable del sitio.

## Textos legales

`/terminos`, `/privacidad` y `/seguridad` son una base pensada para Argentina (Ley 25.326 de datos
personales y Ley 24.240 de defensa del consumidor). **Conviene que los revise un abogado** antes de
salir al público. Están en `frontend/src/pages/Legales.jsx`.
