import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarResenasYMensajes, columnasDeResena } from "../esquema.js";
const {Client} = pkg;

// Un trabajo (solicitud) se puede reseñar cuando terminó: el sistema lo marcó como
// "terminada" o el día de la cita ya pasó (el cron revisarTerminadas tarda hasta 2 días).
const TRABAJO_TERMINADO = `(s.estado = 'terminada' OR (s.estado = 'pendiente' AND s.periodo[2] < CURRENT_DATE))`;

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

/**
 * Deja una reseña sobre la otra persona de un trabajo terminado.
 * Quién reseña a quién sale del trabajo (no de lo que manda el navegador):
 *  - si el que reseña es el contratador → va a resena_al_trabajador
 *  - si es el trabajador → va a resena_al_contratador
 * `otroid` y `rol` se aceptan por compatibilidad, pero si no coinciden con el trabajo se rechaza.
 */
async function nuevaReseña(id, reseña, puntuacion, otroid, rol, trabajo) {
    id = Number(id);
    await asegurarResenasYMensajes();
    const client = new Client(config);
    try{
        await client.connect();
        const busqueda = await client.query(
            `SELECT s.*, ${TRABAJO_TERMINADO} AS terminado FROM solicitudes s WHERE s.id = $1`, [trabajo]);
        const s = busqueda.rows[0];
        if(!s || !s.trabajadorid || (s.contratadorid !== id && s.trabajadorid !== id)) {
            throw errorConEstado("Ese trabajo no existe o no participaste en él", 404);
        }
        if(!s.terminado) {
            throw errorConEstado("Solo se puede dejar una reseña cuando el trabajo ya terminó", 400);
        }
        const soyTrabajador = s.trabajadorid === id;
        const otro = soyTrabajador ? s.contratadorid : s.trabajadorid;
        if((otroid && Number(otroid) !== otro) || (rol && (rol === "trabajador") !== soyTrabajador)) {
            throw errorConEstado("Los datos de la reseña no coinciden con el trabajo", 400);
        }

        const tabla = soyTrabajador ? "resena_al_contratador" : "resena_al_trabajador";
        const c = columnasDeResena(tabla);
        const columnaPromedio = soyTrabajador ? "puntuacion_contratador" : "puntuacion_trabajador";
        const columnaOtro = soyTrabajador ? c.contratadorid : c.trabajadorid;

        await client.query("BEGIN");
        const anteriores = await client.query(`SELECT 1 FROM ${tabla} WHERE ${c.trabajo} = $1`, [trabajo]);
        if(anteriores.rowCount > 0){
            await client.query("ROLLBACK");
            throw errorConEstado("Ya dejaste una reseña para este trabajo", 409);
        }
        const result = await client.query(
            `INSERT INTO ${tabla} (${c.texto}, ${c.puntuacion}, ${c.contratadorid}, ${c.trabajadorid}, ${c.trabajo}) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [reseña, puntuacion, s.contratadorid, s.trabajadorid, trabajo]);
        const puntuacionActualizada = await client.query(
            `UPDATE usuarios SET ${columnaPromedio} = (SELECT ROUND(AVG(${c.puntuacion})::numeric, 1) FROM ${tabla} WHERE ${columnaOtro} = $1)
             WHERE id = $1 RETURNING id, ${columnaPromedio}`, [otro]);
        const autor = await client.query("SELECT nombre_completo FROM usuarios WHERE id = $1", [id]);
        const estrellas = "★".repeat(puntuacion) + "☆".repeat(5 - puntuacion);
        await client.query(
            "INSERT INTO notificaciones (tipo, userid, contenido, otroid) VALUES ('reseña', $1, $2, $3)",
            [otro, `${autor.rows[0]?.nombre_completo || "Alguien"} te dejó una reseña: ${estrellas}\n"${reseña}"`, id]);
        await client.query("COMMIT");
        return { message: "Reseña agregada exitosamente", result: result.rows[0], puntuacionActualizada: puntuacionActualizada.rows[0] };
    } catch(error){
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally{
        await client.end();
    }
}

/**
 * Trabajos terminados en los que participó el usuario y todavía no dejó su reseña.
 */
async function pendientes(id) {
    await asegurarResenasYMensajes();
    const ct = columnasDeResena("resena_al_trabajador");
    const cc = columnasDeResena("resena_al_contratador");
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.id AS trabajo, s.solicitud, s.periodo, s.dirigida, a.aptitud,
                CASE WHEN s.trabajadorid = $1 THEN 'trabajador' ELSE 'contratador' END AS mi_rol,
                o.id AS otroid, o.nombre_completo AS otro_nombre, o.foto_perfil AS otro_foto
            FROM solicitudes s
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            INNER JOIN usuarios o ON o.id = CASE WHEN s.trabajadorid = $1 THEN s.contratadorid ELSE s.trabajadorid END
            WHERE (s.contratadorid = $1 OR s.trabajadorid = $1) AND s.trabajadorid IS NOT NULL
              AND ${TRABAJO_TERMINADO}
              AND NOT (s.trabajadorid = $1 AND EXISTS (SELECT 1 FROM resena_al_contratador r WHERE r.${cc.trabajo} = s.id))
              AND NOT (s.contratadorid = $1 AND EXISTS (SELECT 1 FROM resena_al_trabajador r WHERE r.${ct.trabajo} = s.id))
            ORDER BY s.periodo[2] DESC, s.id DESC
            LIMIT 20`, [id]);
        return result.rows;
    } finally{
        await client.end();
    }
}

/**
 * Reseñas que recibió un usuario (como trabajador y como cliente), para mostrarlas en su perfil.
 */
async function reseñasDe(userid) {
    await asegurarResenasYMensajes();
    const client = new Client(config);
    try{
        await client.connect();
        const usuario = await client.query(`
            SELECT id, nombre_completo, foto_perfil, localidad, sobre_mi, puntuacion_trabajador, puntuacion_contratador
            FROM usuarios WHERE id = $1`, [userid]);
        if(usuario.rowCount === 0) {
            throw errorConEstado("Usuario no encontrado", 404);
        }
        const consulta = (tabla, campoUsuario, campoAutor) => {
            const c = columnasDeResena(tabla);
            return client.query(`
            SELECT r.id, r.${c.puntuacion} AS puntuacion, r.${c.texto} AS texto, r.fecha, r.${c.trabajo} AS trabajo, a.aptitud,
                au.id AS autorid, au.nombre_completo AS autor_nombre, au.foto_perfil AS autor_foto
            FROM ${tabla} r
            LEFT JOIN usuarios au ON au.id = r.${c[campoAutor]}
            LEFT JOIN solicitudes s ON s.id = r.${c.trabajo}
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            WHERE r.${c[campoUsuario]} = $1
            ORDER BY r.fecha DESC NULLS LAST, r.id DESC
            LIMIT 50`, [userid]);
        };
        const [comoTrabajador, comoCliente] = await Promise.all([
            consulta("resena_al_trabajador", "trabajadorid", "contratadorid"),
            consulta("resena_al_contratador", "contratadorid", "trabajadorid"),
        ]);
        const resumen = (filas) => ({
            cantidad: filas.length,
            promedio: filas.length ? Math.round((filas.reduce((t, f) => t + Number(f.puntuacion), 0) / filas.length) * 10) / 10 : null,
            reseñas: filas,
        });
        return {
            usuario: usuario.rows[0],
            como_trabajador: resumen(comoTrabajador.rows),
            como_cliente: resumen(comoCliente.rows),
        };
    } finally{
        await client.end();
    }
}

const ReseñaService = {
    nuevaReseña,
    pendientes,
    reseñasDe
}
export default ReseñaService;
