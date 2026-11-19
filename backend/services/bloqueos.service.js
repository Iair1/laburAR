import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarCuentas } from "../esquema.js";
import { errorConEstado } from "../moderacion.js";
const {Client} = pkg;

async function prepararse() {
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo procesar el pedido. Probá de nuevo en un rato.", 503);
    }
}

function validarOtro(id, otroid) {
    otroid = Number(otroid);
    if (!Number.isInteger(otroid) || otroid <= 0) {
        throw errorConEstado("Usuario inválido", 400);
    }
    if (otroid === Number(id)) {
        throw errorConEstado("No te podés bloquear a vos mismo", 400);
    }
    return otroid;
}

/** Bloquea a otro usuario: no se pueden escribir, mandar solicitudes ni ver en las búsquedas. */
async function bloquear(id, otroid) {
    otroid = validarOtro(id, otroid);
    await prepararse();
    const client = new Client(config);
    try {
        await client.connect();
        const existe = await client.query("SELECT 1 FROM usuarios WHERE id = $1", [otroid]);
        if (existe.rowCount === 0) {
            throw errorConEstado("Usuario no encontrado", 404);
        }
        await client.query(
            "INSERT INTO bloqueos (bloqueadorid, bloqueadoid) VALUES ($1, $2) ON CONFLICT (bloqueadorid, bloqueadoid) DO NOTHING",
            [id, otroid]);
        return { bloqueadoid: otroid };
    } finally {
        await client.end();
    }
}

async function desbloquear(id, otroid) {
    otroid = validarOtro(id, otroid);
    await prepararse();
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query("DELETE FROM bloqueos WHERE bloqueadorid = $1 AND bloqueadoid = $2", [id, otroid]);
        return { desbloqueado: result.rowCount > 0 };
    } finally {
        await client.end();
    }
}

/** Personas que bloqueó el usuario (para poder desbloquearlas desde Mi cuenta). */
async function misBloqueados(id) {
    await prepararse();
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            SELECT u.id, u.nombre_completo, u.foto_perfil, b.fecha
            FROM bloqueos b
            INNER JOIN usuarios u ON u.id = b.bloqueadoid
            WHERE b.bloqueadorid = $1
            ORDER BY b.fecha DESC`, [id]);
        return result.rows;
    } finally {
        await client.end();
    }
}

const BloqueosService = {
    bloquear,
    desbloquear,
    misBloqueados,
};
export default BloqueosService;
