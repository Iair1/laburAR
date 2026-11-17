import config from "./dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

// Columnas que guardan los datos de cada servicio ofrecido (ver migraciones/001_servicios_por_aptitud.sql)
const COLUMNAS_SERVICIO = ["cobro_por_hora", "descripcion", "anios_experiencia"];

let promesaColumnas = null;

/**
 * Se fija si usuarios_aptitudes ya tiene las columnas por servicio y, si faltan, las agrega.
 * Se hace una sola vez por proceso. Nunca tira error: devuelve false si no se pudieron
 * agregar (por ejemplo, por permisos), así el resto sigue funcionando como antes.
 * @returns {Promise<boolean>} true si las columnas están disponibles
 */
export function asegurarColumnasServicio() {
    if (!promesaColumnas) {
        promesaColumnas = (async () => {
            const client = new Client(config);
            try {
                await client.connect();
                const existentes = await client.query(
                    `SELECT column_name FROM information_schema.columns
                     WHERE table_name = 'usuarios_aptitudes' AND column_name = ANY($1)`,
                    [COLUMNAS_SERVICIO]
                );
                if (existentes.rowCount < COLUMNAS_SERVICIO.length) {
                    await client.query(`
                        ALTER TABLE usuarios_aptitudes
                            ADD COLUMN IF NOT EXISTS cobro_por_hora numeric,
                            ADD COLUMN IF NOT EXISTS descripcion text,
                            ADD COLUMN IF NOT EXISTS anios_experiencia integer
                    `);
                    console.log("Columnas por servicio agregadas a usuarios_aptitudes");
                }
                return true;
            } catch (error) {
                console.error(
                    "No se pudieron agregar las columnas por servicio. Corré backend/migraciones/001_servicios_por_aptitud.sql en la base.",
                    error.message
                );
                promesaColumnas = null; // reintenta en el próximo pedido
                return false;
            } finally {
                await client.end().catch(() => {});
            }
        })();
    }
    return promesaColumnas;
}

/* ------------------------------------------------------------------ */
/* Reseñas y mensajes (ver migraciones/002_resenas_y_mensajes.sql)     */
/* ------------------------------------------------------------------ */

const SENTENCIAS_RESENAS_Y_MENSAJES = [
    // Reseñas: una tabla por dirección (el cliente reseña al trabajador y viceversa)
    `CREATE TABLE IF NOT EXISTS resena_al_trabajador ("reseña" text, puntuacion integer, contratadorid integer, trabajadorid integer, trabajo integer)`,
    `CREATE TABLE IF NOT EXISTS resena_al_contratador ("reseña" text, puntuacion integer, trabajadorid integer, contratadorid integer, trabajo integer)`,
    `ALTER TABLE resena_al_trabajador ADD COLUMN IF NOT EXISTS id serial, ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now()`,
    `ALTER TABLE resena_al_contratador ADD COLUMN IF NOT EXISTS id serial, ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now()`,
    // Mensajes: cuándo se mandó, si el otro ya lo leyó y una foto opcional
    `ALTER TABLE mensajes
        ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS leido boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS imagen text`,
];

// No son obligatorios: si fallan (por ejemplo, porque ya hay reseñas repetidas), se sigue igual
const SENTENCIAS_OPCIONALES = [
    `CREATE UNIQUE INDEX IF NOT EXISTS resena_al_trabajador_trabajo_unico ON resena_al_trabajador (trabajo)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS resena_al_contratador_trabajo_unico ON resena_al_contratador (trabajo)`,
    `CREATE INDEX IF NOT EXISTS mensajes_emisor_receptor ON mensajes (emisorid, receptorid)`,
];

let promesaResenasYMensajes = null;

/**
 * Se asegura (una sola vez por proceso) de que existan las tablas de reseñas y las
 * columnas nuevas de mensajes. Nunca tira error: devuelve false si no pudo.
 * @returns {Promise<boolean>}
 */
export function asegurarResenasYMensajes() {
    if (!promesaResenasYMensajes) {
        promesaResenasYMensajes = (async () => {
            const client = new Client(config);
            try {
                await client.connect();
                for (const sentencia of SENTENCIAS_RESENAS_Y_MENSAJES) {
                    await client.query(sentencia);
                }
                for (const sentencia of SENTENCIAS_OPCIONALES) {
                    await client.query(sentencia).catch((error) =>
                        console.error("Aviso (no grave):", error.message)
                    );
                }
                return true;
            } catch (error) {
                console.error(
                    "No se pudieron preparar reseñas/mensajes. Corré backend/migraciones/002_resenas_y_mensajes.sql en la base.",
                    error.message
                );
                promesaResenasYMensajes = null; // reintenta en el próximo pedido
                return false;
            } finally {
                await client.end().catch(() => {});
            }
        })();
    }
    return promesaResenasYMensajes;
}
