import { Client, HOY } from "../db.js";
import { asegurarCuentas, asegurarResenasYMensajes, esEmpresa } from "../esquema.js";
import { errorConEstado } from "../moderacion.js";

// Datos para confiar en alguien (se muestran en su perfil y en sus propuestas):
// desde cuándo está, cuántos trabajos hizo, cuántas citas canceló, qué tan rápido responde
// los mensajes y qué tiene verificado.
async function estadisticas(userid) {
    const cuentas = await asegurarCuentas();
    const mensajesListos = await asegurarResenasYMensajes();
    const client = new Client();
    try {
        await client.connect();
        const terminado = `(s.estado = 'terminada' OR (s.estado = 'pendiente' AND s.periodo[2] < ${HOY}))`;
        const result = await client.query(`
            SELECT u.id,
                ${cuentas
                    ? `u.fecha_alta, COALESCE(u.verificado, false) AS identidad_verificada,
                       COALESCE(u.telefono_verificado, false) AS telefono_verificado, u.email_verificado, u.eliminado,
                       ${esEmpresa("u")} AS es_empresa,
                       (SELECT count(*)::int FROM cancelaciones c WHERE c.userid = u.id AND c.rol = 'trabajador') AS cancelaciones_como_trabajador,
                       (SELECT count(*)::int FROM cancelaciones c WHERE c.userid = u.id AND c.rol = 'cliente') AS cancelaciones_como_cliente`
                    : `NULL AS fecha_alta, false AS identidad_verificada, false AS telefono_verificado, NULL AS email_verificado, false AS eliminado,
                       false AS es_empresa,
                       0 AS cancelaciones_como_trabajador, 0 AS cancelaciones_como_cliente`},
                (SELECT count(*)::int FROM solicitudes s WHERE s.trabajadorid = u.id AND ${terminado}) AS trabajos_como_trabajador,
                (SELECT count(*)::int FROM solicitudes s WHERE s.contratadorid = u.id AND s.trabajadorid IS NOT NULL AND ${terminado}) AS trabajos_como_cliente,
                (SELECT count(*)::int FROM solicitudes s WHERE s.trabajadorid = u.id AND s.estado IN ('pendiente', 'terminada', 'cancelado')) AS citas_como_trabajador,
                (SELECT count(*)::int FROM solicitudes s WHERE s.contratadorid = u.id AND s.trabajadorid IS NOT NULL AND s.estado IN ('pendiente', 'terminada', 'cancelado')) AS citas_como_cliente
            FROM usuarios u WHERE u.id = $1`, [userid]);
        const fila = result.rows[0];
        if (!fila || fila.eliminado) throw errorConEstado("Usuario no encontrado", 404);

        // Cuánto tarda en contestar: de cada primer mensaje que le mandan (después de su última
        // respuesta), cuántos minutos pasan hasta que contesta. Se usa la mediana de los últimos 90 días.
        let respuesta = { muestras: 0, minutos: null };
        if (mensajesListos) {
            const r = await client.query(`
                WITH recibidos AS (
                    SELECT m.emisorid, m.fecha FROM mensajes m
                    WHERE m.receptorid = $1 AND m.fecha > now() - interval '90 days'
                      AND NOT EXISTS (
                        SELECT 1 FROM mensajes p
                        WHERE p.emisorid = m.emisorid AND p.receptorid = $1 AND p.fecha < m.fecha
                          AND p.fecha > COALESCE((SELECT max(q.fecha) FROM mensajes q
                                                  WHERE q.emisorid = $1 AND q.receptorid = m.emisorid AND q.fecha < m.fecha), '-infinity'))
                    ORDER BY m.fecha DESC LIMIT 60
                ), tiempos AS (
                    SELECT extract(epoch FROM (SELECT min(r2.fecha) FROM mensajes r2
                                               WHERE r2.emisorid = $1 AND r2.receptorid = rc.emisorid AND r2.fecha > rc.fecha) - rc.fecha) / 60 AS minutos
                    FROM recibidos rc
                )
                SELECT count(*)::int AS muestras, percentile_cont(0.5) WITHIN GROUP (ORDER BY minutos) AS minutos
                FROM tiempos WHERE minutos IS NOT NULL`, [userid]).catch(() => null);
            if (r?.rows[0]) respuesta = { muestras: r.rows[0].muestras, minutos: r.rows[0].minutos === null ? null : Math.round(r.rows[0].minutos) };
        }
        return {
            userid: fila.id,
            miembro_desde: fila.fecha_alta,
            trabajos_como_trabajador: fila.trabajos_como_trabajador,
            trabajos_como_cliente: fila.trabajos_como_cliente,
            citas_como_trabajador: fila.citas_como_trabajador,
            citas_como_cliente: fila.citas_como_cliente,
            cancelaciones_como_trabajador: fila.cancelaciones_como_trabajador,
            cancelaciones_como_cliente: fila.cancelaciones_como_cliente,
            // Solo si hay al menos 3 conversaciones para medir
            respuesta_minutos: respuesta.muestras >= 3 ? respuesta.minutos : null,
            identidad_verificada: fila.identidad_verificada === true,
            telefono_verificado: fila.telefono_verificado === true,
            email_verificado: fila.email_verificado === true,
            es_empresa: fila.es_empresa === true,
        };
    } finally {
        await client.end();
    }
}

const EstadisticasService = { estadisticas };
export default EstadisticasService;
