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

// No son obligatorios: si fallan, se sigue igual
const SENTENCIAS_OPCIONALES = [
    `CREATE INDEX IF NOT EXISTS mensajes_emisor_receptor ON mensajes (emisorid, receptorid)`,
];

/* Columnas de las tablas de reseñas.
 * En cada base pueden llamarse un poco distinto (por ejemplo "resena" sin ñ, o la ñ guardada
 * como "n" + tilde), así que al arrancar se busca cómo se llama cada una y se usa ese nombre.
 * Si alguna no existe, se agrega con el nombre de acá. */
const TABLAS_RESENAS = ["resena_al_trabajador", "resena_al_contratador"];
const CAMPOS_RESENA = {
    texto: { nombre: "reseña", tipo: "text", alias: ["resena", "texto", "comentario", "comentarios", "descripcion", "contenido", "opinion", "review"] },
    puntuacion: { nombre: "puntuacion", tipo: "integer", alias: ["puntuacion", "puntaje", "estrellas", "calificacion", "rating"] },
    contratadorid: { nombre: "contratadorid", tipo: "integer", alias: ["contratadorid", "contratador", "clienteid", "cliente", "empleadorid"] },
    trabajadorid: { nombre: "trabajadorid", tipo: "integer", alias: ["trabajadorid", "trabajador"] },
    trabajo: { nombre: "trabajo", tipo: "integer", alias: ["trabajo", "trabajoid", "solicitudid"] },
};
const TIPOS_TEXTO = ["text", "character varying", "character"];

const comillas = (nombre) => `"${String(nombre).replace(/"/g, '""')}"`;
// "Reseña", "reseña" (con la ñ separada), "resena" y "rese_na" quedan todos como "resena"
const normalizar = (nombre) =>
    String(nombre).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Lo que se usa si todavía no se pudo revisar la base (los nombres de siempre)
const columnasPorDefecto = () =>
    Object.fromEntries(Object.entries(CAMPOS_RESENA).map(([campo, { nombre }]) => [campo, comillas(nombre)]));
let columnasResenas = Object.fromEntries(TABLAS_RESENAS.map((tabla) => [tabla, columnasPorDefecto()]));

/**
 * Nombres de columna (ya entre comillas, listos para el SQL) de una tabla de reseñas:
 * { texto, puntuacion, contratadorid, trabajadorid, trabajo }.
 * Llamar después de `await asegurarResenasYMensajes()`.
 */
export function columnasDeResena(tabla) {
    return columnasResenas[tabla] || columnasPorDefecto();
}

// Busca cómo se llama cada columna en la tabla; agrega las que falten.
async function prepararTablaResenas(client, tabla) {
    const { rows } = await client.query(
        `SELECT column_name, data_type, column_default FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = ANY (current_schemas(false))`,
        [tabla]
    );
    const usadas = new Set();
    const mapa = {};
    for (const [campo, { nombre, tipo, alias }] of Object.entries(CAMPOS_RESENA)) {
        let columna = null;
        for (const a of alias) {
            columna = rows.find((c) => !usadas.has(c.column_name) && normalizar(c.column_name) === a);
            if (columna) break;
        }
        // El texto puede tener cualquier nombre: si hay una sola columna de texto sin usar, es esa
        if (!columna && campo === "texto") {
            const otrosNombres = ["id", "fecha", ...Object.values(CAMPOS_RESENA).flatMap((c) => c.alias)];
            const deTexto = rows.filter((c) => !usadas.has(c.column_name) && TIPOS_TEXTO.includes(c.data_type)
                && !otrosNombres.includes(normalizar(c.column_name)));
            if (deTexto.length === 1) columna = deTexto[0];
        }
        if (columna) {
            usadas.add(columna.column_name);
            mapa[campo] = comillas(columna.column_name);
        } else {
            await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS ${comillas(nombre)} ${tipo}`);
            console.log(`Columna ${nombre} agregada a ${tabla}`);
            mapa[campo] = comillas(nombre);
        }
    }

    // Si "id" ya existía pero sin valor automático, se le pone uno (si no, el INSERT falla)
    const id = rows.find((c) => c.column_name === "id");
    if (id && !id.column_default) {
        try {
            await client.query(`CREATE SEQUENCE IF NOT EXISTS ${tabla}_id_seq OWNED BY ${tabla}.id`);
            await client.query(`SELECT setval('${tabla}_id_seq', COALESCE((SELECT MAX(id) FROM ${tabla}), 0) + 1, false)`);
            await client.query(`ALTER TABLE ${tabla} ALTER COLUMN id SET DEFAULT nextval('${tabla}_id_seq')`);
        } catch (error) {
            console.error(`Aviso (no grave): no se pudo numerar solo el id de ${tabla}:`, error.message);
        }
    }

    // Una sola reseña por trabajo (si ya hay repetidas, no se puede crear y se sigue igual)
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${tabla}_trabajo_unico ON ${tabla} (${mapa.trabajo})`)
        .catch((error) => console.error("Aviso (no grave):", error.message));
    return mapa;
}

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
                // Cada paso por separado: si uno falla (por ejemplo, permisos), los demás igual se hacen
                let todoBien = true;
                for (const sentencia of SENTENCIAS_RESENAS_Y_MENSAJES) {
                    await client.query(sentencia).catch((error) => {
                        todoBien = false;
                        console.error("No se pudo preparar la base:", error.message);
                    });
                }
                for (const tabla of TABLAS_RESENAS) {
                    try {
                        columnasResenas = { ...columnasResenas, [tabla]: await prepararTablaResenas(client, tabla) };
                    } catch (error) {
                        todoBien = false;
                        console.error(`No se pudo revisar la tabla ${tabla}:`, error.message);
                    }
                }
                for (const sentencia of SENTENCIAS_OPCIONALES) {
                    await client.query(sentencia).catch((error) =>
                        console.error("Aviso (no grave):", error.message)
                    );
                }
                if (!todoBien) throw new Error("faltaron pasos (ver arriba)");
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
