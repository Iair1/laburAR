// moderacion.js
// Piezas que comparten varios services para respetar bloqueos y cuentas suspendidas.
// Los parámetros a y b son expresiones SQL fijas del código (ej: "$1", "u.id"), nunca datos del usuario.
import { asegurarCuentas } from "./esquema.js";
import { emailConfigurado } from "./email.js";

/** Condición SQL: hay un bloqueo entre a y b (en cualquiera de los dos sentidos). */
export const hayBloqueo = (a, b) => `EXISTS (
    SELECT 1 FROM bloqueos bq
    WHERE (bq.bloqueadorid = ${a} AND bq.bloqueadoid = ${b}) OR (bq.bloqueadorid = ${b} AND bq.bloqueadoid = ${a}))`;

/** Condición SQL: la cuenta (alias de la tabla usuarios) no está suspendida ni eliminada. */
export const cuentaActiva = (alias) => `(${alias}.suspendido IS NOT TRUE AND ${alias}.eliminado IS NOT TRUE)`;

export function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

/**
 * Tira un error 403 si a y b se bloquearon o si la cuenta de b ya no está activa.
 * @param {import("pg").Client} client - cliente ya conectado
 */
export async function verificarQuePuedenInteractuar(client, a, b, mensaje = "No podés interactuar con este usuario.") {
    const result = await client.query(`
        SELECT ${hayBloqueo("$1::int", "$2::int")} AS bloqueado,
            (SELECT ${cuentaActiva("u")} FROM usuarios u WHERE u.id = $2::int) AS activa`, [a, b]);
    const fila = result.rows[0];
    if (fila.bloqueado || fila.activa === false) {
        throw errorConEstado(mensaje, 403);
    }
}

export const MENSAJE_CONFIRMAR_EMAIL = "Confirmá tu email para seguir: te mandamos un link a tu casilla. Si no te llegó, pedí otro desde el aviso de arriba o desde Mi cuenta.";

/**
 * Las cuentas nuevas tienen que confirmar el email antes de publicar, mandar solicitudes,
 * propuestas o mensajes (las cuentas de antes, con email_verificado en null, no).
 * Llamar antes de abrir una transacción.
 */
export async function exigirEmailVerificado(client, id) {
    if (!emailConfigurado() || !(await asegurarCuentas())) return;
    const result = await client.query("SELECT email_verificado FROM usuarios WHERE id = $1", [id]);
    if (result.rows[0]?.email_verificado === false) {
        const error = errorConEstado(MENSAJE_CONFIRMAR_EMAIL, 403);
        error.confirmarEmail = true;
        throw error;
    }
}
