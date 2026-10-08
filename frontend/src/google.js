// Carga "Sign in with Google" (Google Identity Services) una sola vez.
// El Client ID se configura en frontend/.env:  VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
// (se crea en Google Cloud Console → APIs y servicios → Credenciales → ID de cliente de OAuth,
// tipo "Aplicación web", agregando los orígenes autorizados: http://localhost:5173 y el dominio de Vercel).

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let promesaScript = null;

export function cargarGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (promesaScript) return promesaScript;

  promesaScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      promesaScript = null;
      reject(new Error("No se pudo cargar el inicio de sesión de Google."));
    };
    document.head.appendChild(script);
  });
  return promesaScript;
}
