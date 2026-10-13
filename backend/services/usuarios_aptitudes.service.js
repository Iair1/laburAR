import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarColumnasServicio } from "../esquema.js";
const {Client} = pkg;

async function nuevaAptitud(id, aptitud, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria, cobro_por_hora = null, descripcion = null, anios_experiencia = null) {
    const columnasServicio = await asegurarColumnasServicio();
    const client = new Client(config);
    try{
        await client.connect();
        const aptId = await client.query(`
            INSERT INTO aptitudes (aptitud) 
            VALUES ($1)
            ON CONFLICT (aptitud) 
            DO UPDATE SET aptitud = EXCLUDED.aptitud
            RETURNING id;
        `, [aptitud]);
        
        const result = columnasServicio
            ? await client.query(`
                INSERT INTO usuarios_aptitudes
                (userid, aptitudid, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria, cobro_por_hora, descripcion, anios_experiencia)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `, [id, aptId.rows[0].id, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria, cobro_por_hora, descripcion, anios_experiencia])
            : await client.query(`
                INSERT INTO usuarios_aptitudes
                (userid, aptitudid, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `, [id, aptId.rows[0].id, matricula_numero, matricula_dni, matricula_jurisdiccion, matricula_categoria]);
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

async function eliminarAptitud(id, aptitud) {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
          DELETE FROM usuarios_aptitudes
          WHERE userid = $1 AND aptitudid = (SELECT id FROM aptitudes WHERE aptitud = $2)
          RETURNING *;
        `, [id, aptitud]);
        return result.rows[0];
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

async function misAptitudes(id) {
    const columnasServicio = await asegurarColumnasServicio();
    const client = new Client(config);
    try{
        await client.connect();
        // Si el servicio todavía no tiene precio/descripción propios (servicios viejos),
        // se muestran los del usuario. Van como texto (::text) para que funcione sea
        // cual sea el tipo de usuarios.cobro_por_hora; el front los convierte a número.
        const result = columnasServicio
            ? await client.query(`
                SELECT DISTINCT ON (a.aptitud) a.aptitud, a.id,
                    COALESCE(ua.cobro_por_hora::text, NULLIF(u.cobro_por_hora::text, '')) AS cobro_por_hora,
                    COALESCE(ua.descripcion, u.sobre_mi::text) AS descripcion,
                    ua.anios_experiencia
                FROM aptitudes a
                INNER JOIN usuarios_aptitudes ua ON a.id = ua.aptitudid
                INNER JOIN usuarios u ON u.id = ua.userid
                WHERE ua.userid = $1
                ORDER BY a.aptitud;
            `, [id])
            : await client.query(`
                SELECT a.aptitud, a.id
                FROM aptitudes a INNER JOIN usuarios_aptitudes ua ON a.id = ua.aptitudid
                WHERE ua.userid = $1;
            `, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

async function editarAptitud(id, aptitud, cobro_por_hora, descripcion, anios_experiencia) {
    const columnasServicio = await asegurarColumnasServicio();
    if (!columnasServicio) {
        throw new Error("Falta actualizar la base: corré backend/migraciones/001_servicios_por_aptitud.sql");
    }
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            UPDATE usuarios_aptitudes
            SET cobro_por_hora = $3, descripcion = $4, anios_experiencia = $5
            WHERE userid = $1 AND aptitudid = (SELECT id FROM aptitudes WHERE aptitud = $2)
            RETURNING aptitudid, cobro_por_hora, descripcion, anios_experiencia;
        `, [id, aptitud, cobro_por_hora, descripcion, anios_experiencia]);
        if (result.rowCount === 0) {
            throw new Error("No ofrecés ese servicio");
        }
        return { aptitud, ...result.rows[0] };
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const Usuarios_AptitudesService = {
    nuevaAptitud,
    eliminarAptitud,
    misAptitudes,
    editarAptitud
};
export default Usuarios_AptitudesService;