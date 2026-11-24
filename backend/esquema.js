import config from "./dbconfig.js";
import { Client } from "./db.js";


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
    // (el id, la fecha y las columnas que falten se agregan en prepararTablaResenas)
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
 * Cada base puede tenerlas armadas un poco distinto: otros nombres ("resena" sin ñ, "puntaje",
 * "contratador_id"...), un id propio sin numeración automática, columnas obligatorias de más,
 * el trabajo guardado como texto, o una columna que apunta a otra tabla. Al arrancar se revisa
 * cada tabla, se usa lo que ya hay y solo se agrega lo que falta (sin borrar ni cambiar datos). */
const TABLAS_RESENAS = ["resena_al_trabajador", "resena_al_contratador"];
// exactos: nombres posibles (ya normalizados). parecidos: pedazos de nombre que también sirven.
// referencia: si la columna es una clave foránea, tiene que apuntar a esta tabla.
const CAMPOS_RESENA = {
    texto: { nombre: "reseña", tipo: "text", soloTexto: true,
        exactos: ["resena", "texto", "comentario", "comentarios", "descripcion", "contenido", "opinion", "review"],
        parecidos: ["resen", "coment", "opin", "texto", "descrip", "review", "detalle"] },
    puntuacion: { nombre: "puntuacion", tipo: "integer",
        exactos: ["puntuacion", "puntaje", "estrellas", "calificacion", "rating", "puntos"],
        parecidos: ["puntu", "puntaj", "estrell", "calific", "rating", "valorac"] },
    contratadorid: { nombre: "contratadorid", tipo: "integer", referencia: "usuarios",
        exactos: ["contratadorid", "contratador", "idcontratador", "clienteid", "cliente", "idcliente", "empleadorid"],
        parecidos: ["contratador", "cliente", "empleador"] },
    trabajadorid: { nombre: "trabajadorid", tipo: "integer", referencia: "usuarios",
        exactos: ["trabajadorid", "trabajador", "idtrabajador"],
        parecidos: ["trabajador", "prestador", "profesional"] },
    trabajo: { nombre: "trabajo", tipo: "integer", referencia: "solicitudes", otroNombre: "solicitudid",
        exactos: ["trabajo", "trabajoid", "idtrabajo", "solicitudid", "idsolicitud", "solicitud"],
        parecidos: ["trabajo", "solicitud"], evitar: ["trabajador"] },
};
const NOMBRES_FECHA = ["fecha", "fechacreacion", "fechaalta", "fechaderesena", "creado", "creadoel", "createdat"];
const TIPOS_TEXTO = ["text", "character varying", "character"];
const TIPOS_NUMERO = ["integer", "bigint", "smallint", "numeric", "real", "double precision"];
const TIPOS_ENTERO = ["integer", "bigint", "smallint"];
const esTipoFecha = (tipo) => tipo === "date" || String(tipo).startsWith("timestamp");

const comillas = (nombre) => `"${String(nombre).replace(/"/g, '""')}"`;
// "Reseña", "reseña" (con la ñ separada), "resena" y "rese_na" quedan todos como "resena"
const normalizar = (nombre) =>
    String(nombre).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const esFecha = (columna) => NOMBRES_FECHA.includes(normalizar(columna.column_name))
    || (esTipoFecha(columna.data_type) && normalizar(columna.column_name).includes("fecha"));

// Lo que se usa si todavía no se pudo revisar la base (los nombres de siempre)
const columnasPorDefecto = () => ({
    ...Object.fromEntries(Object.entries(CAMPOS_RESENA).map(([campo, { nombre }]) => [campo, comillas(nombre)])),
    id: comillas("id"),
    fecha: comillas("fecha"),
    tipos: Object.fromEntries(Object.entries(CAMPOS_RESENA).map(([campo, { tipo }]) => [campo, tipo])),
});
let columnasResenas = Object.fromEntries(TABLAS_RESENAS.map((tabla) => [tabla, columnasPorDefecto()]));

/**
 * Nombres de columna (ya entre comillas, listos para el SQL) de una tabla de reseñas:
 * { texto, puntuacion, contratadorid, trabajadorid, trabajo, id, fecha, tipos }.
 * `id` y `fecha` pueden ser null si la tabla no las tiene. Llamar después de `await asegurarResenasYMensajes()`.
 */
export function columnasDeResena(tabla) {
    return columnasResenas[tabla] || columnasPorDefecto();
}

/**
 * Pedazos de SQL para leer una tabla de reseñas con el alias `alias`, que andan aunque
 * alguna columna sea de otro tipo (por ejemplo, el trabajo o el puntaje guardados como texto).
 */
export function sqlResena(tabla, alias = "r") {
    const c = columnasDeResena(tabla);
    const col = (campo) => `${alias}.${c[campo]}`;
    const esNumero = (campo) => TIPOS_NUMERO.includes(c.tipos?.[campo] || CAMPOS_RESENA[campo].tipo);
    return {
        col,
        // Compara una columna de la reseña con un id (de otra tabla o un parámetro como $1::integer)
        igual: (campo, expresion) => esNumero(campo)
            ? `${col(campo)} = ${expresion}`
            : `${col(campo)}::text = (${expresion})::text`,
        puntos: esNumero("puntuacion")
            ? `${col("puntuacion")}::numeric`
            : `NULLIF(regexp_replace(${col("puntuacion")}::text, '[^0-9.]', '', 'g'), '')::numeric`,
        id: c.id ? `${alias}.${c.id}` : `${alias}.ctid::text`,
        fecha: c.fecha ? `${alias}.${c.fecha}` : "NULL::timestamptz",
    };
}

// Elige qué columna de la tabla guarda cada dato (sin usar las de `excluidas`)
function elegirColumnas(columnas, excluidas) {
    const usadas = new Set(excluidas);
    const mapa = {};
    const sirve = (campo, columna, soloNumeros) => {
        if (usadas.has(columna.column_name)) return false;
        if (normalizar(columna.column_name) === "id" || esFecha(columna)) return false;
        if (CAMPOS_RESENA[campo].soloTexto) return TIPOS_TEXTO.includes(columna.data_type);
        if (esTipoFecha(columna.data_type) || columna.data_type === "boolean") return false;
        return !soloNumeros || TIPOS_NUMERO.includes(columna.data_type);
    };
    const tomar = (campo, columna) => { mapa[campo] = columna; usadas.add(columna.column_name); };
    // 1) Nombres conocidos
    for (const [campo, { exactos }] of Object.entries(CAMPOS_RESENA)) {
        for (const nombre of exactos) {
            const columna = columnas.find((c) => sirve(campo, c, false) && normalizar(c.column_name) === nombre);
            if (columna) { tomar(campo, columna); break; }
        }
    }
    // 2) Nombres parecidos (para los ids y el puntaje, solo columnas de números)
    for (const [campo, { parecidos, evitar = [] }] of Object.entries(CAMPOS_RESENA)) {
        if (mapa[campo]) continue;
        const columna = columnas.find((c) => {
            const n = normalizar(c.column_name);
            return sirve(campo, c, true) && parecidos.some((p) => n.includes(p)) && !evitar.some((p) => n.includes(p));
        });
        if (columna) tomar(campo, columna);
    }
    // 3) El texto puede tener cualquier nombre: si queda una sola columna de texto, es esa
    if (!mapa.texto) {
        const deTexto = columnas.filter((c) => sirve("texto", c, false));
        if (deTexto.length === 1) tomar("texto", deTexto[0]);
    }
    return mapa;
}

// Le pone numeración automática a una columna de números que no la tiene
async function numerarSola(client, tabla, columna) {
    const secuencia = comillas(`${tabla}_${normalizar(columna) || "id"}_seq`);
    await client.query(`CREATE SEQUENCE IF NOT EXISTS ${secuencia} OWNED BY ${tabla}.${comillas(columna)}`);
    await client.query(`SELECT setval('${secuencia.replace(/'/g, "''")}', COALESCE((SELECT MAX(${comillas(columna)}) FROM ${tabla}), 0) + 1, false)`);
    await client.query(`ALTER TABLE ${tabla} ALTER COLUMN ${comillas(columna)} SET DEFAULT nextval('${secuencia.replace(/'/g, "''")}')`);
}

// Revisa una tabla de reseñas, agrega lo que falte y devuelve qué columna usar para cada dato.
async function prepararTablaResenas(client, tabla) {
    const avisar = (que, error) => console.error(`Aviso (no grave): ${que} en ${tabla}:`, error.message);
    const leerColumnas = async () => (await client.query(
        `SELECT column_name, data_type, column_default, is_nullable, is_identity, is_generated
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = ANY (current_schemas(false))
         ORDER BY ordinal_position`,
        [tabla]
    )).rows;
    let columnas = await leerColumnas();
    const claves = await client.query(`
        SELECT a.attname AS columna, c.contype AS tipo, c.confrelid::regclass::text AS referencia
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = to_regclass($1::text) AND c.contype IN ('f', 'p')`, [tabla])
        .then((r) => r.rows)
        .catch((error) => { avisar("no se pudieron leer las claves", error); return []; });
    const tablaDe = (referencia) => String(referencia).replace(/^.*\./, "").replace(/"/g, "");

    // Una columna que apunta a otra tabla (por ejemplo "trabajo" → trabajos) no sirve para ese dato
    const excluidas = new Set();
    let elegidas = elegirColumnas(columnas, excluidas);
    for (let vuelta = 0; vuelta < 5; vuelta++) {
        const malas = Object.entries(elegidas).filter(([campo, columna]) => {
            const referencia = CAMPOS_RESENA[campo].referencia;
            const fk = claves.find((k) => k.tipo === "f" && k.columna === columna.column_name);
            return referencia && fk && tablaDe(fk.referencia) !== referencia;
        });
        if (!malas.length) break;
        malas.forEach(([, columna]) => excluidas.add(columna.column_name));
        elegidas = elegirColumnas(columnas, excluidas);
    }

    // Los datos que no tienen columna se agregan
    const nombres = new Set(columnas.map((c) => c.column_name));
    const mapa = {};
    for (const [campo, { nombre, tipo, otroNombre }] of Object.entries(CAMPOS_RESENA)) {
        if (elegidas[campo]) { mapa[campo] = elegidas[campo].column_name; continue; }
        const libre = [nombre, otroNombre, `${nombre}_laburar`].find((n) => n && !nombres.has(n));
        try {
            await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS ${comillas(libre)} ${tipo}`);
            console.log(`Columna ${libre} agregada a ${tabla}`);
        } catch (error) {
            avisar(`no se pudo agregar la columna ${libre}`, error);
        }
        mapa[campo] = libre;
        nombres.add(libre);
    }

    // id (para identificar cada reseña): si no está se agrega; si está sin numeración, se le pone
    const id = columnas.find((c) => c.column_name === "id");
    try {
        if (!id) {
            await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS id serial`);
        } else if (!id.column_default && id.is_identity !== "YES" && TIPOS_ENTERO.includes(id.data_type)) {
            await numerarSola(client, tabla, "id");
        }
    } catch (error) {
        avisar("no se pudo numerar solo el id", error);
    }

    // fecha (para ordenar): si no está se agrega; si está sin valor por defecto, se le pone "ahora"
    const fecha = columnas.find((c) => !Object.values(mapa).includes(c.column_name) && esFecha(c));
    try {
        if (!fecha) {
            await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS fecha timestamptz DEFAULT now()`);
        } else if (!fecha.column_default) {
            await client.query(`ALTER TABLE ${tabla} ALTER COLUMN ${comillas(fecha.column_name)} SET DEFAULT ${fecha.data_type === "date" ? "CURRENT_DATE" : "now()"}`);
        }
    } catch (error) {
        avisar("no se pudo preparar la fecha", error);
    }

    // Otras columnas obligatorias que la app no llena (harían fallar cada reseña nueva)
    columnas = await leerColumnas();
    for (const c of columnas) {
        if (Object.values(mapa).includes(c.column_name)) continue;
        if (c.is_nullable !== "NO" || c.column_default || c.is_identity === "YES" || c.is_generated === "ALWAYS") continue;
        const esForanea = claves.some((k) => k.tipo === "f" && k.columna === c.column_name);
        try {
            if (TIPOS_ENTERO.includes(c.data_type) && !esForanea) {
                await numerarSola(client, tabla, c.column_name);
            } else if (c.data_type === "uuid" && !esForanea) {
                await client.query(`ALTER TABLE ${tabla} ALTER COLUMN ${comillas(c.column_name)} SET DEFAULT gen_random_uuid()`);
            } else if (esTipoFecha(c.data_type)) {
                await client.query(`ALTER TABLE ${tabla} ALTER COLUMN ${comillas(c.column_name)} SET DEFAULT ${c.data_type === "date" ? "CURRENT_DATE" : "now()"}`);
            } else {
                await client.query(`ALTER TABLE ${tabla} ALTER COLUMN ${comillas(c.column_name)} DROP NOT NULL`);
            }
            console.log(`Columna obligatoria ${c.column_name} de ${tabla} preparada para las reseñas nuevas`);
        } catch (error) {
            avisar(`la columna ${c.column_name} es obligatoria y no se pudo preparar`, error);
        }
    }

    // Una sola reseña por trabajo (si ya hay repetidas, no se puede crear y se sigue igual)
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${tabla}_trabajo_unico ON ${tabla} (${comillas(mapa.trabajo)})`)
        .catch((error) => avisar("no se pudo crear el índice de un trabajo por reseña", error));

    columnas = await leerColumnas();
    const existe = (nombre) => columnas.some((c) => c.column_name === nombre);
    const fechaFinal = fecha?.column_name || "fecha";
    const resultado = {
        ...Object.fromEntries(Object.entries(mapa).map(([campo, nombre]) => [campo, comillas(nombre)])),
        id: existe("id") ? comillas("id") : null,
        fecha: existe(fechaFinal) ? comillas(fechaFinal) : null,
        tipos: Object.fromEntries(Object.entries(mapa).map(([campo, nombre]) =>
            [campo, columnas.find((c) => c.column_name === nombre)?.data_type || CAMPOS_RESENA[campo].tipo])),
    };
    console.log(`Reseñas: ${tabla} usa ${Object.keys(CAMPOS_RESENA).map((campo) => `${campo}=${resultado[campo]} (${resultado.tipos[campo]})`).join(", ")}, id=${resultado.id}, fecha=${resultado.fecha}`);
    return resultado;
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

/* ------------------------------------------------------------------ */
/* Cuentas y moderación (ver migraciones/003_cuentas_y_moderacion.sql) */
/* ------------------------------------------------------------------ */

const SENTENCIAS_CUENTAS = [
    // Datos de la cuenta: email (para entrar y recuperar la contraseña), teléfono,
    // administrador, suspensión, cuenta eliminada y verificación de identidad (DNI)
    `ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS email text,
        ADD COLUMN IF NOT EXISTS telefono text,
        ADD COLUMN IF NOT EXISTS es_admin boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS suspendido boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS motivo_suspension text,
        ADD COLUMN IF NOT EXISTS eliminado boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS dni_foto text,
        ADD COLUMN IF NOT EXISTS dni_estado text,
        ADD COLUMN IF NOT EXISTS verificado boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS fecha_alta timestamptz DEFAULT now()`,
    // Denuncias de un usuario a otro (opcionalmente sobre un trabajo o un mensaje)
    `CREATE TABLE IF NOT EXISTS denuncias (
        id serial PRIMARY KEY,
        denuncianteid integer NOT NULL,
        denunciadoid integer NOT NULL,
        motivo text NOT NULL,
        detalle text,
        solicitudid integer,
        mensajeid integer,
        estado text NOT NULL DEFAULT 'pendiente',
        nota_admin text,
        fecha timestamptz DEFAULT now(),
        fecha_resuelta timestamptz
    )`,
    // Bloqueos: el bloqueado no puede escribirle ni mandarle solicitudes al que lo bloqueó (y viceversa)
    `CREATE TABLE IF NOT EXISTS bloqueos (
        id serial PRIMARY KEY,
        bloqueadorid integer NOT NULL,
        bloqueadoid integer NOT NULL,
        fecha timestamptz DEFAULT now(),
        UNIQUE (bloqueadorid, bloqueadoid)
    )`,
    // Intentos fallidos de inicio de sesión (para frenar a quien prueba contraseñas)
    `CREATE TABLE IF NOT EXISTS intentos_login (
        id serial PRIMARY KEY,
        clave text NOT NULL,
        fecha timestamptz DEFAULT now()
    )`,
    // Códigos para recuperar la contraseña (se guarda el código hasheado, nunca el código)
    `CREATE TABLE IF NOT EXISTS recuperaciones (
        id serial PRIMARY KEY,
        userid integer NOT NULL,
        codigo text NOT NULL,
        vence timestamptz NOT NULL,
        intentos integer NOT NULL DEFAULT 0,
        usado boolean NOT NULL DEFAULT false,
        fecha timestamptz DEFAULT now()
    )`,
];

// Confianza y seguridad (ver migraciones/005_confianza_y_seguridad.sql)
SENTENCIAS_CUENTAS.push(
    // email_verificado: null = cuenta vieja (no se exige), false = falta confirmar, true = confirmado
    `ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS email_verificado boolean,
        ADD COLUMN IF NOT EXISTS avisos_email boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS telefono_verificado boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS es_empresa boolean DEFAULT false`,
    // Para frenar el spam: cada acción limitada deja una fila (se borran solas a los 2 días)
    `CREATE TABLE IF NOT EXISTS acciones_limitadas (
        id serial PRIMARY KEY,
        clave text NOT NULL,
        fecha timestamptz DEFAULT now()
    )`,
    // Links para confirmar el email (se guarda el token hasheado)
    `CREATE TABLE IF NOT EXISTS verificaciones_email (
        id serial PRIMARY KEY,
        userid integer NOT NULL,
        email text NOT NULL,
        token text NOT NULL,
        vence timestamptz NOT NULL,
        usado boolean NOT NULL DEFAULT false,
        fecha timestamptz DEFAULT now()
    )`,
    // Códigos por SMS para confirmar el teléfono (hasheados)
    `CREATE TABLE IF NOT EXISTS verificaciones_telefono (
        id serial PRIMARY KEY,
        userid integer NOT NULL,
        telefono text NOT NULL,
        codigo text NOT NULL,
        vence timestamptz NOT NULL,
        intentos integer NOT NULL DEFAULT 0,
        usado boolean NOT NULL DEFAULT false,
        fecha timestamptz DEFAULT now()
    )`,
    // Cada cita cancelada: quién, con qué motivo y si fue con menos de 24 horas de aviso
    `CREATE TABLE IF NOT EXISTS cancelaciones (
        id serial PRIMARY KEY,
        solicitudid integer,
        userid integer NOT NULL,
        rol text,
        motivo text,
        aviso_corto boolean DEFAULT false,
        fecha timestamptz DEFAULT now()
    )`,
    // Errores del servidor y del navegador (los ve el administrador)
    `CREATE TABLE IF NOT EXISTS errores_servidor (
        id serial PRIMARY KEY,
        origen text NOT NULL DEFAULT 'servidor',
        ruta text,
        metodo text,
        mensaje text,
        detalle text,
        userid integer,
        avisado boolean DEFAULT false,
        fecha timestamptz DEFAULT now()
    )`,
);

const SENTENCIAS_CUENTAS_OPCIONALES = [
    // Las cuentas de empresa no tienen DNI: si la columna era obligatoria, deja de serlo
    `DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'usuarios' AND column_name = 'dni' AND is_nullable = 'NO'
                     AND table_schema = ANY (current_schemas(false))) THEN
            ALTER TABLE usuarios ALTER COLUMN dni DROP NOT NULL;
        END IF;
    END $$`,
    // De qué trabajo es cada fila del historial (con quién trabajó cada uno)
    `ALTER TABLE historial ADD COLUMN IF NOT EXISTS solicitudid integer`,
    // Un email por cuenta (si ya hubiera repetidos, no se crea y se valida igual desde el código)
    `CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unico ON usuarios (lower(email)) WHERE email IS NOT NULL AND eliminado IS NOT TRUE`,
    `CREATE INDEX IF NOT EXISTS denuncias_estado ON denuncias (estado, fecha DESC)`,
    `CREATE INDEX IF NOT EXISTS intentos_login_clave ON intentos_login (clave, fecha)`,
    `CREATE INDEX IF NOT EXISTS acciones_limitadas_clave ON acciones_limitadas (clave, fecha)`,
    `CREATE INDEX IF NOT EXISTS verificaciones_email_token ON verificaciones_email (token)`,
    `CREATE INDEX IF NOT EXISTS cancelaciones_usuario ON cancelaciones (userid)`,
    `CREATE INDEX IF NOT EXISTS errores_servidor_fecha ON errores_servidor (fecha DESC)`,
];

/**
 * true si la cuenta es de una empresa (columna usuarios.es_empresa). Funciona aunque la
 * columna se haya creado a mano como texto ('true' / 't') en vez de boolean.
 * @param {string} alias nombre o alias de la tabla usuarios en la consulta
 */
export const esEmpresa = (alias) => `COALESCE(${alias}.es_empresa::text IN ('true', 't'), false)`;

/**
 * La columna "es empresa" lista para un SELECT (`... AS es_empresa`). Si la base todavía no
 * tiene la columna, devuelve false para todos, así la consulta nunca falla.
 * @param {string} alias nombre o alias de la tabla usuarios en la consulta
 * @param {string} [nombre] cómo se llama la columna en el resultado
 */
export async function columnaEmpresa(alias, nombre = "es_empresa") {
    return `${(await asegurarCuentas()) ? esEmpresa(alias) : "false"} AS ${nombre}`;
}

let promesaCuentas = null;

/**
 * Se asegura (una sola vez por proceso) de que existan las columnas de cuentas
 * (email, suspendido, verificado, etc.) y las tablas de denuncias, bloqueos,
 * intentos de login y recuperación de contraseña. Nunca tira error: devuelve
 * false si no pudo (y lo reintenta en el próximo pedido).
 * @returns {Promise<boolean>}
 */
export function asegurarCuentas() {
    if (!promesaCuentas) {
        promesaCuentas = (async () => {
            const client = new Client(config);
            try {
                await client.connect();
                for (const sentencia of SENTENCIAS_CUENTAS) {
                    await client.query(sentencia);
                }
                for (const sentencia of SENTENCIAS_CUENTAS_OPCIONALES) {
                    await client.query(sentencia).catch((error) =>
                        console.error("Aviso (no grave):", error.message)
                    );
                }
                return true;
            } catch (error) {
                console.error(
                    "No se pudieron preparar las cuentas/moderación. Corré backend/migraciones/003_cuentas_y_moderacion.sql en la base.",
                    error.message
                );
                promesaCuentas = null;
                return false;
            } finally {
                await client.end().catch(() => {});
            }
        })();
    }
    return promesaCuentas;
}

/* ------------------------------------------------------------------ */
/* Notificaciones (ver migraciones/004_notificaciones_y_ofertas.sql)   */
/* ------------------------------------------------------------------ */

let promesaNotificaciones = null;

/**
 * Columnas nuevas de notificaciones: fecha, si ya se leyó, un título corto, a dónde lleva
 * (enlace) y de qué trabajo es. Las que ya existían quedan como leídas (antes se marcaban
 * en el navegador) y sin fecha (no se sabe cuándo llegaron). Nunca tira error.
 * @returns {Promise<boolean>}
 */
export function asegurarNotificaciones() {
    if (!promesaNotificaciones) {
        promesaNotificaciones = (async () => {
            const client = new Client(config);
            try {
                await client.connect();
                // Si otra conexión está usando la tabla, mejor fallar rápido (y reintentar después) que quedar esperando
                await client.query("SET lock_timeout = '5s'");
                const { rows } = await client.query(
                    `SELECT column_name FROM information_schema.columns
                     WHERE table_name = 'notificaciones' AND table_schema = ANY (current_schemas(false))`);
                const existentes = new Set(rows.map((c) => c.column_name));
                if (!existentes.has("id")) {
                    await client.query("ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS id serial");
                }
                if (!existentes.has("leida")) {
                    await client.query("ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS leida boolean");
                    await client.query("UPDATE notificaciones SET leida = true WHERE leida IS NULL");
                }
                await client.query(`
                    ALTER TABLE notificaciones
                        ADD COLUMN IF NOT EXISTS fecha timestamptz,
                        ADD COLUMN IF NOT EXISTS titulo text,
                        ADD COLUMN IF NOT EXISTS enlace text,
                        ADD COLUMN IF NOT EXISTS solicitudid integer`);
                await client.query(`
                    ALTER TABLE notificaciones
                        ALTER COLUMN leida SET DEFAULT false,
                        ALTER COLUMN fecha SET DEFAULT now()`);
                await client.query("CREATE INDEX IF NOT EXISTS notificaciones_usuario ON notificaciones (userid, id DESC)")
                    .catch((error) => console.error("Aviso (no grave):", error.message));
                return true;
            } catch (error) {
                console.error(
                    "No se pudieron preparar las notificaciones. Corré backend/migraciones/004_notificaciones_y_ofertas.sql en la base.",
                    error.message
                );
                promesaNotificaciones = null;
                return false;
            } finally {
                await client.end().catch(() => {});
            }
        })();
    }
    return promesaNotificaciones;
}

/* ------------------------------------------------------------------ */
/* Ofertas de precio en los problemas (ver migraciones/004_...)        */
/* ------------------------------------------------------------------ */

const SENTENCIAS_OFERTAS = [
    // Una propuesta de un trabajador para un problema: día, hora y precio. Mientras está
    // "pendiente" va y viene (contraofertas) hasta que alguien acepta o rechaza.
    //  · estado: pendiente | aceptada | rechazada | retirada | cerrada (el problema se tomó o se borró)
    //  · turno: quién tiene que responder ahora ('cliente' o 'trabajador')
    //  · titulo: el título del problema al momento de la propuesta (por si después se borra)
    `CREATE TABLE IF NOT EXISTS ofertas (
        id serial PRIMARY KEY,
        solicitudid integer NOT NULL,
        trabajadorid integer NOT NULL,
        contratadorid integer NOT NULL,
        dia date NOT NULL,
        hora text,
        precio integer NOT NULL,
        mensaje text,
        titulo text,
        estado text NOT NULL DEFAULT 'pendiente',
        turno text NOT NULL DEFAULT 'cliente',
        rechazada_por text,
        fecha timestamptz DEFAULT now(),
        actualizada timestamptz DEFAULT now()
    )`,
    // Cada paso de la negociación (para mostrar el ida y vuelta)
    `CREATE TABLE IF NOT EXISTS ofertas_historial (
        id serial PRIMARY KEY,
        ofertaid integer NOT NULL,
        autorid integer NOT NULL,
        rol text NOT NULL,
        accion text NOT NULL,
        precio integer,
        mensaje text,
        fecha timestamptz DEFAULT now()
    )`,
    // El precio que quedó acordado (cuando el cliente o el trabajador aceptan)
    `ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS precio_acordado integer`,
];

const SENTENCIAS_OFERTAS_OPCIONALES = [
    // Un trabajador tiene a lo sumo una propuesta abierta por problema
    `CREATE UNIQUE INDEX IF NOT EXISTS ofertas_una_abierta ON ofertas (solicitudid, trabajadorid) WHERE estado = 'pendiente'`,
    `CREATE INDEX IF NOT EXISTS ofertas_solicitud ON ofertas (solicitudid)`,
    `CREATE INDEX IF NOT EXISTS ofertas_trabajador ON ofertas (trabajadorid, id DESC)`,
    `CREATE INDEX IF NOT EXISTS ofertas_contratador ON ofertas (contratadorid, id DESC)`,
    `CREATE INDEX IF NOT EXISTS ofertas_historial_oferta ON ofertas_historial (ofertaid, id)`,
];

let promesaOfertas = null;

/**
 * Se asegura (una vez por proceso) de que existan las tablas de ofertas y la columna
 * solicitudes.precio_acordado. Nunca tira error: devuelve false si no pudo.
 * @returns {Promise<boolean>}
 */
export function asegurarOfertas() {
    if (!promesaOfertas) {
        promesaOfertas = (async () => {
            const client = new Client(config);
            try {
                await client.connect();
                await client.query("SET lock_timeout = '5s'");
                for (const sentencia of SENTENCIAS_OFERTAS) {
                    await client.query(sentencia);
                }
                for (const sentencia of SENTENCIAS_OFERTAS_OPCIONALES) {
                    await client.query(sentencia).catch((error) =>
                        console.error("Aviso (no grave):", error.message)
                    );
                }
                return true;
            } catch (error) {
                console.error(
                    "No se pudieron preparar las ofertas. Corré backend/migraciones/004_notificaciones_y_ofertas.sql en la base.",
                    error.message
                );
                promesaOfertas = null;
                return false;
            } finally {
                await client.end().catch(() => {});
            }
        })();
    }
    return promesaOfertas;
}
