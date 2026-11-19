import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarCuentas } from "../esquema.js";
import { errorConEstado } from "../moderacion.js";
const {Client} = pkg;

export const MOTIVOS_DENUNCIA = [
    "Estafa o fraude",
    "Acoso, amenazas o violencia",
    "Comportamiento inapropiado",
    "No se presentó o no cumplió",
    "Trabajo peligroso o mal hecho",
    "Perfil falso o se hace pasar por otra persona",
    "Contenido ofensivo",
    "Spam o publicidad",
    "Otro",
];

/**
 * Denuncia a otro usuario. Puede ir sobre un trabajo (solicitudid) o un mensaje (mensajeid)
 * en el que participaron los dos; si no, se guarda sin eso.
 */
async function nuevaDenuncia(id, { denunciadoid, motivo, detalle, solicitudid, mensajeid }) {
    id = Number(id);
    denunciadoid = Number(denunciadoid);
    if (!Number.isInteger(denunciadoid) || denunciadoid <= 0) {
        throw errorConEstado("Usuario inválido", 400);
    }
    if (denunciadoid === id) {
        throw errorConEstado("No te podés denunciar a vos mismo", 400);
    }
    if (!MOTIVOS_DENUNCIA.includes(motivo)) {
        throw errorConEstado("Elegí un motivo de la lista", 400);
    }
    const texto = String(detalle ?? "").trim();
    if (texto.length > 1000) {
        throw errorConEstado("El detalle puede tener hasta 1000 caracteres", 400);
    }
    if (motivo === "Otro" && texto.length < 10) {
        throw errorConEstado("Contanos un poco qué pasó (al menos 10 caracteres)", 400);
    }
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo enviar la denuncia. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        const denunciado = await client.query("SELECT id FROM usuarios WHERE id = $1", [denunciadoid]);
        if (denunciado.rowCount === 0) {
            throw errorConEstado("Usuario no encontrado", 404);
        }
        const recientes = await client.query(
            "SELECT count(*)::int AS cantidad FROM denuncias WHERE denuncianteid = $1 AND fecha > now() - interval '1 day'", [id]);
        if (recientes.rows[0].cantidad >= 10) {
            throw errorConEstado("Mandaste muchas denuncias hoy. Probá de nuevo mañana.", 429);
        }
        const repetida = await client.query(
            "SELECT 1 FROM denuncias WHERE denuncianteid = $1 AND denunciadoid = $2 AND estado = 'pendiente'", [id, denunciadoid]);
        if (repetida.rowCount > 0) {
            throw errorConEstado("Ya denunciaste a esta persona y lo estamos revisando.", 409);
        }
        // Solo se guarda el trabajo o el mensaje si es entre los dos
        let trabajo = null;
        if (solicitudid) {
            const s = await client.query(`
                SELECT id FROM solicitudes WHERE id = $1
                  AND ((contratadorid = $2 AND trabajadorid = $3) OR (contratadorid = $3 AND trabajadorid = $2)
                       OR (contratadorid = $3 AND dirigida = false))`, [Number(solicitudid) || 0, id, denunciadoid]);
            trabajo = s.rows[0]?.id ?? null;
        }
        let mensaje = null;
        if (mensajeid) {
            const m = await client.query(
                "SELECT id FROM mensajes WHERE id = $1 AND emisorid = $3 AND receptorid = $2", [Number(mensajeid) || 0, id, denunciadoid]);
            mensaje = m.rows[0]?.id ?? null;
        }
        const result = await client.query(`
            INSERT INTO denuncias (denuncianteid, denunciadoid, motivo, detalle, solicitudid, mensajeid)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, motivo, estado, fecha`,
            [id, denunciadoid, motivo, texto || null, trabajo, mensaje]);
        return result.rows[0];
    } finally {
        await client.end();
    }
}

const DenunciasService = {
    nuevaDenuncia,
};
export default DenunciasService;
