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
