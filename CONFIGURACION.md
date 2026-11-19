# Configuración para salir al público

Todo se carga en **Vercel → el proyecto → Settings → Environment Variables**. Después de agregar o
cambiar una variable hay que volver a publicar (Deployments → ⋯ → Redeploy).

## Obligatorias

| Variable | Para qué |
|---|---|
| `JWT_SECRET` | Firma las sesiones. Tiene que ser un texto largo y secreto (por ejemplo, 40 caracteres al azar). **Si falta, el backend usa una clave de prueba y cualquiera podría hacerse pasar por otro usuario.** |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | La base de datos (ya estaban). |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Las fotos (ya estaban). También se usan para el DNI privado. |

## Emails (recuperar la contraseña)

Sin esto, "Olvidé mi contraseña" avisa que por ahora no se pueden mandar emails.

1. Crear una cuenta gratis en [Brevo](https://www.brevo.com) (300 emails por día).
2. En Brevo → *Senders* agregar y verificar el email que va a aparecer como remitente (sirve un Gmail).
3. En Brevo → *SMTP & API* → *API Keys* crear una clave.
4. Cargar en Vercel:
   - `BREVO_API_KEY` = la clave
   - `EMAIL_REMITENTE` = el email verificado
   - `EMAIL_NOMBRE` = `LaburAR` (opcional)

(También funciona con [Resend](https://resend.com) usando `RESEND_API_KEY` en vez de `BREVO_API_KEY`, pero Resend pide verificar un dominio propio.)

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

## Administradores

El panel está en `/admin`. Para que alguien sea administrador, correr una vez en la base:

```sql
UPDATE usuarios SET es_admin = true WHERE email = 'tu-email@ejemplo.com';
```

Después esa persona tiene que cerrar sesión y volver a entrar para ver "Panel de administración" en su menú.

## Base de datos

El backend crea solo las tablas y columnas nuevas la primera vez que las necesita
(`backend/esquema.js`). Si el usuario de la base no tiene permiso para crear tablas, correr a mano
los archivos de `backend/migraciones/` (se pueden correr varias veces sin problema).

## Textos legales

`/terminos`, `/privacidad` y `/seguridad` son una base pensada para Argentina (Ley 25.326 de datos
personales y Ley 24.240 de defensa del consumidor). **Conviene que los revise un abogado** antes de
salir al público. Están en `frontend/src/pages/Legales.jsx`.
