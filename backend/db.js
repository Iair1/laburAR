// db.js
// Conexiones a la base compartidas (un "pool" por proceso) en vez de abrir una nueva en cada pedido.
//
// Los services siguen usando `new Client(config)`, `connect()`, `query()` y `end()` como antes:
// esta clase hace lo mismo, pero toma una conexión del pool al conectar y la devuelve al terminar.
// Además:
//  · si quedó una transacción abierta, la deshace antes de devolver la conexión
//  · si se cambió algún parámetro de la sesión (SET ...), lo vuelve a dejar como estaba
//  · lo que se pide hacer "después de guardar" (por ejemplo, mandar un email) se hace recién
//    cuando la transacción se confirma (COMMIT); si se deshace (ROLLBACK), no se hace.
//
// Con muchos usuarios, conviene además usar el "pooler" de tu proveedor de base de datos
// (ver CONFIGURACION.md: DB_HOST del pooler y DB_PORT).
import pkg from "pg";
import config from "./dbconfig.js";
const { Pool } = pkg;

const pool = new Pool({
    ...config,
    max: Number(process.env.DB_POOL_MAX) || 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    query_timeout: 25000,
    allowExitOnIdle: true,
});
pool.on("error", (error) => console.error("Se cortó una conexión a la base (se abre otra sola):", error.message));

const textoDe = (consulta) => (typeof consulta === "string" ? consulta : consulta?.text || "");

export class Client {
    constructor() {
        this.conexion = null;
        this.enTransaccion = false;
        this.cambioSesion = false;
        this.pendientes = [];
    }

    async connect() {
        if (!this.conexion) this.conexion = await pool.connect();
        return this;
    }

    async query(consulta, valores) {
        if (!this.conexion) throw new Error("La conexión a la base no está abierta");
        const sql = textoDe(consulta);
        const resultado = await this.conexion.query(consulta, valores);
        if (/^\s*(BEGIN|START\s+TRANSACTION)\b/i.test(sql)) {
            this.enTransaccion = true;
        } else if (/^\s*(COMMIT|END)\s*;?\s*$/i.test(sql)) {
            this.enTransaccion = false;
            await this.#hacerPendientes();
        } else if (/^\s*ROLLBACK\s*;?\s*$/i.test(sql)) {
            this.enTransaccion = false;
            this.pendientes = [];
        } else if (/^\s*(SET|RESET)\s/i.test(sql) && !/^\s*SET\s+(LOCAL|TRANSACTION)\b/i.test(sql)) {
            this.cambioSesion = true;
        }
        return resultado;
    }

    /**
     * Hace `tarea` cuando lo guardado quede firme: enseguida si no hay una transacción abierta,
     * o después del COMMIT. Si la tarea falla, solo queda en el log.
     */
    async despuesDeGuardar(tarea) {
        if (this.enTransaccion) {
            this.pendientes.push(tarea);
            return;
        }
        await Promise.resolve().then(tarea).catch((error) => console.error("Aviso (no grave):", error.message));
    }

    async #hacerPendientes() {
        const tareas = this.pendientes;
        this.pendientes = [];
        for (const tarea of tareas) {
            await Promise.resolve().then(tarea).catch((error) => console.error("Aviso (no grave):", error.message));
        }
    }

    async end() {
        const conexion = this.conexion;
        if (!conexion) return;
        this.conexion = null;
        this.pendientes = [];
        let error;
        try {
            if (this.enTransaccion) await conexion.query("ROLLBACK");
            if (this.cambioSesion) await conexion.query("RESET ALL");
        } catch (e) {
            error = e;
        }
        this.enTransaccion = false;
        this.cambioSesion = false;
        conexion.release(error); // con error, la conexión se descarta en vez de volver al pool
    }
}

/** Hoy en Argentina (la base y el servidor pueden estar en otra zona horaria, por ejemplo UTC). */
export const HOY = "(now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date";
