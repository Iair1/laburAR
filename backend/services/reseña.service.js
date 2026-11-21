import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarResenasYMensajes, columnasDeResena, sqlResena } from "../esquema.js";
import { notificar, primerNombre } from "../notificaciones.js";
const {Client} = pkg;

// Un trabajo (solicitud) se puede reseñar cuando terminó: el sistema lo marcó como
// "terminada" o el día de la cita ya pasó (el cron revisarTerminadas tarda hasta 2 días).
const TRABAJO_TERMINADO = `(s.estado = 'terminada' OR (s.estado = 'pendiente' AND s.periodo[2] < CURRENT_DATE))`;

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Un paso que no es imprescindible (el puntaje promedio, el aviso): si falla, la reseña
// igual se guarda. Va dentro de un SAVEPOINT para no arruinar la transacción.
async function pasoOpcional(client, que, consulta) {
    await client.query("SAVEPOINT paso_opcional");
    try {
        const resultado = await consulta();
        await client.query("RELEASE SAVEPOINT paso_opcional");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK TO SAVEPOINT paso_opcional").catch(() => {});
        console.error(`Aviso (no grave): la reseña se guardó, pero no se pudo ${que}:`, error.message);
        return null;
    }
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
        const r = sqlResena(tabla, "r");
        const columnaPromedio = soyTrabajador ? "puntuacion_contratador" : "puntuacion_trabajador";
        const campoOtro = soyTrabajador ? "contratadorid" : "trabajadorid";

        await client.query("BEGIN");
        const anteriores = await client.query(`SELECT 1 FROM ${tabla} r WHERE ${r.igual("trabajo", "$1::integer")} LIMIT 1`, [trabajo]);
        if(anteriores.rowCount > 0){
            await client.query("ROLLBACK");
            throw errorConEstado("Ya dejaste una reseña para este trabajo", 409);
        }
        let result;
        try {
            result = await client.query(
                `INSERT INTO ${tabla} (${c.texto}, ${c.puntuacion}, ${c.contratadorid}, ${c.trabajadorid}, ${c.trabajo}) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [reseña, puntuacion, s.contratadorid, s.trabajadorid, trabajo]);
        } catch (error) {
            if (error.code === "23505") throw errorConEstado("Ya dejaste una reseña para este trabajo", 409);
            console.error(`No se pudo guardar la reseña en ${tabla} (columnas: ${JSON.stringify(c)}):`, error.message);
            throw error;
        }
        // Lo que sigue no es imprescindible: si falla, la reseña igual queda guardada
        const puntuacionActualizada = await pasoOpcional(client, "actualizar el puntaje promedio", () => client.query(
            `UPDATE usuarios SET ${columnaPromedio} = (SELECT ROUND(AVG(${r.puntos}), 1) FROM ${tabla} r WHERE ${r.igual(campoOtro, "$1::integer")})
             WHERE id = $1::integer RETURNING id, ${columnaPromedio}`, [otro]));
        await pasoOpcional(client, "avisarle a la otra persona", async () => {
            const autor = await client.query("SELECT nombre_completo FROM usuarios WHERE id = $1", [id]);
            const estrellas = "★".repeat(puntuacion) + "☆".repeat(5 - puntuacion);
            const texto = reseña.length > 70 ? `${reseña.slice(0, 69).trim()}…` : reseña;
            await notificar(client, {
                userid: otro,
                tipo: "reseña",
                titulo: `${primerNombre(autor.rows[0]?.nombre_completo)} te dejó una reseña`,
                contenido: `${estrellas} “${texto}”`,
                enlace: "/mi-cuenta#resenas",
                otroid: id,
                solicitudid: trabajo,
            }, { transaccion: true });
        });
        await client.query("COMMIT");
        return { message: "Reseña agregada exitosamente", result: result.rows[0], puntuacionActualizada: puntuacionActualizada?.rows[0] ?? null };
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
    const rt = sqlResena("resena_al_trabajador", "r");
    const rc = sqlResena("resena_al_contratador", "r");
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
              AND NOT (s.trabajadorid = $1 AND EXISTS (SELECT 1 FROM resena_al_contratador r WHERE ${rc.igual("trabajo", "s.id")}))
              AND NOT (s.contratadorid = $1 AND EXISTS (SELECT 1 FROM resena_al_trabajador r WHERE ${rt.igual("trabajo", "s.id")}))
            ORDER BY s.periodo[2] DESC, s.id DESC
            LIMIT 20`, [id]).catch((error) => {
                console.error(`No se pudieron buscar las reseñas pendientes (columnas: ${JSON.stringify(columnasDeResena("resena_al_trabajador"))} / ${JSON.stringify(columnasDeResena("resena_al_contratador"))}):`, error.message);
                throw error;
            });
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
            const r = sqlResena(tabla, "r");
            return client.query(`
            SELECT ${r.id} AS id, ${r.puntos} AS puntuacion, ${r.col("texto")} AS texto, ${r.fecha} AS fecha, ${r.col("trabajo")} AS trabajo, a.aptitud,
                au.id AS autorid, au.nombre_completo AS autor_nombre, au.foto_perfil AS autor_foto
            FROM ${tabla} r
            LEFT JOIN usuarios au ON ${r.igual(campoAutor, "au.id")}
            LEFT JOIN solicitudes s ON ${r.igual("trabajo", "s.id")}
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            WHERE ${r.igual(campoUsuario, "$1::integer")}
            ORDER BY 4 DESC NULLS LAST, 1 DESC
            LIMIT 50`, [userid]).catch((error) => {
                console.error(`No se pudieron leer las reseñas de ${tabla} (columnas: ${JSON.stringify(columnasDeResena(tabla))}):`, error.message);
                throw error;
            });
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
