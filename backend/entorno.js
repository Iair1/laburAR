// true cuando el backend corre publicado (Vercel pone VERCEL=1 y NODE_ENV=production).
// En producción no se usan claves de prueba y los errores internos no se le muestran a la gente.
export const EN_PRODUCCION = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
