import config from "../dbconfig.js";
import { Client, HOY } from "../db.js";
import { asegurarOfertas, asegurarCuentas } from "../esquema.js";
import { verificarQuePuedenInteractuar, errorConEstado, hayBloqueo, cuentaActiva, exigirEmailVerificado } from "../moderacion.js";
import { notificar, nombreDe, primerNombre, tituloDeSolicitud, textoDia, pesos } from "../notificaciones.js";


// Propuestas de precio para los problemas publicados (solicitudes con dirigida = false).
//  1. El trabajador propone día, hora y precio (queda "pendiente", le toca responder al cliente).
//  2. Quien tiene el turno puede aceptar, mandar una contraoferta (le pasa el turno al otro) o rechazar.
//  3. Al aceptar, el problema queda agendado con ese trabajador, ese día y ese precio, y las
//     demás propuestas se cierran. El pago lo arreglan entre ellos: el sitio no cobra.

export const PRECIO_MINIMO = 100;
export const PRECIO_MAXIMO = 100000000;
const MAX_PASOS = 12;                     // idas y vueltas por propuesta
const MAX_PROPUESTAS_POR_PROBLEMA = 3;    // un trabajador puede volver a proponer si lo rechazaron
const MAX_PROPUESTAS_POR_DIA = 40;        // para frenar el spam

// A dónde lleva cada aviso: los problemas publicados se ven en "Mis problemas" / "Mis propuestas";
// las solicitudes directas (a un trabajador puntual), en "Mis pedidos" / "Solicitudes recibidas".
const enlaceTrabajador = (dirigida) => (dirigida ? "/solicitudes-recibidas" : "/problemas?vista=propuestas");
const enlaceCliente = (solicitudid, dirigida = false) =>
    dirigida ? `/mis-pedidos?pedido=${solicitudid}` : `/mis-problemas?problema=${solicitudid}`;
const esDirigida = (valor) => valor !== false; // las viejas (null) son dirigidas
const recortar = (texto, largo = 80) => {
    const t = String(texto || "").trim().replace(/\s+/g, " ");
    return t.length > largo ? `${t.slice(0, largo - 1).trim()}…` : t;
};

const MENSAJE_ESTADO = {
    aceptada: "Esta propuesta ya se aceptó.",
    rechazada: "Esta propuesta ya se rechazó.",
    retirada: "El trabajador retiró esta propuesta.",
    cerrada: "Esta propuesta se cerró: el problema ya tiene trabajador o se eliminó.",
};

// Abre una conexión con las tablas listas; si algo falla, deshace la transacción abierta
async function conOfertas(tarea) {
    if (!(await asegurarOfertas())) {
        throw errorConEstado("Las propuestas no están disponibles en este momento. Probá de nuevo en un rato.", 503);
    }
    const cuentas = await asegurarCuentas();
    const client = new Client(config);
    await client.connect();
    try {
        return await tarea(client, cuentas);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
            throw errorConEstado("Ya mandaste una propuesta para este problema. La podés ver en Mis propuestas.", 409);
        }
        throw error;
    } finally {
        await client.end().catch(() => {});
    }
}

// Cada paso de la negociación, en orden (para mostrar el ida y vuelta)
const HISTORIAL = `COALESCE((
    SELECT json_agg(json_build_object('id', h.id, 'rol', h.rol, 'accion', h.accion, 'precio', h.precio, 'mensaje', h.mensaje, 'fecha', h.fecha) ORDER BY h.id)
    FROM ofertas_historial h WHERE h.ofertaid = o.id), '[]'::json) AS historial`;

async function anotar(client, ofertaid, autorid, rol, accion, precio = null, mensaje = null) {
    await client.query(
        "INSERT INTO ofertas_historial (ofertaid, autorid, rol, accion, precio, mensaje) VALUES ($1, $2, $3, $4, $5, $6)",
        [ofertaid, autorid, rol, accion, precio, mensaje || null]);
}

/**
 * Cierra las propuestas abiertas de un problema (porque se tomó otra o se eliminó) y les avisa
 * a esos trabajadores. `excepto`: la propuesta que se aceptó. Se usa dentro de una transacción.
 */
export async function cerrarOfertasDelProblema(client, solicitudid, { excepto = null, titulo = "", motivo = "eliminado", dirigida = false } = {}) {
    const cerradas = await client.query(`
        UPDATE ofertas SET estado = 'cerrada', actualizada = now()
        WHERE solicitudid = $1 AND estado = 'pendiente' AND ($2::int IS NULL OR id <> $2::int)
        RETURNING id, trabajadorid, contratadorid, titulo`, [solicitudid, excepto]);
    for (const o of cerradas.rows) {
        await anotar(client, o.id, o.contratadorid, "sistema", "cerrada");
        const nombreProblema = titulo || o.titulo || "Un problema";
        await notificar(client, {
            userid: o.trabajadorid,
            tipo: "oferta-cerrada",
            titulo: motivo === "tomado" ? "El cliente eligió otra propuesta" : dirigida ? "Se canceló un pedido" : "Un problema ya no está disponible",
            contenido: `«${nombreProblema}»${motivo === "tomado" ? " ya tiene trabajador" : dirigida ? " · El cliente lo canceló" : " se eliminó"}`,
            enlace: enlaceTrabajador(dirigida),
            otroid: o.contratadorid,
            solicitudid,
        }, { transaccion: true });
    }
    return cerradas.rowCount;
}

/** El trabajador manda una propuesta para un problema abierto. */
async function nueva(id, { solicitudid, dia, hora, precio, mensaje }) {
    id = Number(id);
    return conOfertas(async (client, cuentas) => {
        await exigirEmailVerificado(client, id);
        await client.query("BEGIN");
        const busqueda = await client.query(`
            SELECT s.*,
                ($2::date BETWEEN s.periodo[1] AND s.periodo[2]
                 AND COALESCE(s.diassemana[EXTRACT(ISODOW FROM $2::date)::int], TRUE) = TRUE
                 AND $2::date >= ${HOY}) AS dia_valido
            FROM solicitudes s WHERE s.id = $1 FOR UPDATE`, [solicitudid, dia]);
        const s = busqueda.rows[0];
        if (!s) throw errorConEstado("Ese problema no existe.", 404);
        const dirigida = esDirigida(s.dirigida);
        if (s.contratadorid === id) throw errorConEstado("No podés mandarle una propuesta a tu propio problema.", 400);
        // Una solicitud directa solo la puede presupuestar el trabajador al que se la mandaron
        if (dirigida && s.trabajadorid !== id) throw errorConEstado("Esa solicitud no es para vos.", 404);
        if (s.estado !== "por revisar") {
            throw errorConEstado("Este problema ya no está disponible: otro trabajador lo tomó o el cliente lo cerró.", 409);
        }
        if (!s.dia_valido) throw errorConEstado("Elegí uno de los días que pidió el cliente (de hoy en adelante).", 400);
        if (cuentas) {
            await verificarQuePuedenInteractuar(client, id, s.contratadorid, "No podés mandarle propuestas a este usuario.");
        }
        const anteriores = await client.query(
            "SELECT estado FROM ofertas WHERE solicitudid = $1 AND trabajadorid = $2", [solicitudid, id]);
        if (anteriores.rows.some((o) => o.estado === "pendiente")) {
            throw errorConEstado("Ya mandaste una propuesta para este problema. La podés ver en Mis propuestas.", 409);
        }
        if (anteriores.rowCount >= MAX_PROPUESTAS_POR_PROBLEMA) {
            throw errorConEstado("Ya mandaste varias propuestas para este problema.", 429);
        }
        const hoy = await client.query(
            "SELECT count(*)::int AS n FROM ofertas WHERE trabajadorid = $1 AND fecha > now() - interval '1 day'", [id]);
        if (hoy.rows[0].n >= MAX_PROPUESTAS_POR_DIA) {
            throw errorConEstado("Mandaste muchas propuestas hoy. Probá de nuevo mañana.", 429);
        }
        const titulo = tituloDeSolicitud(s.solicitud);
        const result = await client.query(`
            INSERT INTO ofertas (solicitudid, trabajadorid, contratadorid, dia, hora, precio, mensaje, titulo, turno)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'cliente') RETURNING *`,
            [solicitudid, id, s.contratadorid, dia, hora, precio, mensaje || null, titulo]);
        const oferta = result.rows[0];
        await anotar(client, oferta.id, id, "trabajador", "propuesta", precio, mensaje);
        const trabajador = await nombreDe(client, id, "Un trabajador");
        await notificar(client, {
            userid: s.contratadorid,
            tipo: "oferta-nueva",
            titulo: dirigida
                ? `${primerNombre(trabajador)} te mandó un presupuesto: ${pesos(precio)}`
                : `${primerNombre(trabajador)} te ofreció ${pesos(precio)}`,
            contenido: `«${titulo}» · ${textoDia(dia, hora)}`,
            enlace: enlaceCliente(s.id, dirigida),
            otroid: id,
            solicitudid: s.id,
        }, { transaccion: true });
        await client.query("COMMIT");
        return oferta;
    });
}

// Busca la propuesta (bloqueándola junto con su problema) y revisa que el usuario pueda responderla.
// Se bloquea primero el problema y después la propuesta (siempre en ese orden): así, si el cliente
// acepta dos propuestas a la vez, la segunda espera a la primera y después ve que ya se cerró.
async function tomarParaResponder(client, id, ofertaid, { exigirTurno = true } = {}) {
    const base = await client.query("SELECT solicitudid FROM ofertas WHERE id = $1", [ofertaid]);
    if (!base.rows[0]) throw errorConEstado("Esa propuesta no existe.", 404);
    await client.query("SELECT id FROM solicitudes WHERE id = $1 FOR UPDATE", [base.rows[0].solicitudid]);
    const busqueda = await client.query(`
        SELECT o.*, s.estado AS estado_problema, s.solicitud, s.dirigida, (o.dia < ${HOY}) AS vencida
        FROM ofertas o
        LEFT JOIN solicitudes s ON s.id = o.solicitudid
        WHERE o.id = $1
        FOR UPDATE OF o`, [ofertaid]);
    const o = busqueda.rows[0];
    if (!o || (o.contratadorid !== id && o.trabajadorid !== id)) throw errorConEstado("Esa propuesta no existe.", 404);
    const rol = o.contratadorid === id ? "cliente" : "trabajador";
    if (o.estado !== "pendiente") throw errorConEstado(MENSAJE_ESTADO[o.estado] || "Esta propuesta ya no está abierta.", 409);
    if (exigirTurno && o.turno !== rol) {
        throw errorConEstado("Ahora le toca responder a la otra persona. Te avisamos cuando conteste.", 409);
    }
    if (o.estado_problema !== "por revisar") {
        throw errorConEstado("Este problema ya no está disponible: ya tiene una cita agendada o se cerró.", 409);
    }
    return { o, rol, otro: rol === "cliente" ? o.trabajadorid : o.contratadorid };
}

/** Acepta el precio vigente: el problema queda agendado con ese trabajador. */
async function aceptar(id, ofertaid) {
    id = Number(id);
    return conOfertas(async (client, cuentas) => {
        await client.query("BEGIN");
        const { o, rol, otro } = await tomarParaResponder(client, id, ofertaid);
        if (o.vencida) throw errorConEstado("El día de esta propuesta ya pasó: no se puede aceptar.", 409);
        if (cuentas) await verificarQuePuedenInteractuar(client, id, otro, "No podés aceptar esta propuesta.");
        const agendado = await client.query(`
            UPDATE solicitudes
            SET estado = 'pendiente',
                trabajadorid = $2,
                periodo = ARRAY[$3::date, $3::date],
                solicitud = CASE WHEN $4::text IS NULL THEN solicitud
                                 ELSE solicitud || E'\\nHora acordada: ' || $4::text || ' hs' END,
                precio_acordado = $5
            WHERE id = $1 AND estado = 'por revisar'
            RETURNING *`, [o.solicitudid, o.trabajadorid, o.dia, o.hora, o.precio]);
        if (agendado.rowCount === 0) throw errorConEstado("Este problema ya no está disponible.", 409);
        const aceptada = await client.query(
            "UPDATE ofertas SET estado = 'aceptada', actualizada = now() WHERE id = $1 RETURNING *", [o.id]);
        await anotar(client, o.id, id, rol, "aceptada", o.precio);
        const titulo = o.titulo || tituloDeSolicitud(o.solicitud);
        const dirigida = esDirigida(o.dirigida);
        await cerrarOfertasDelProblema(client, o.solicitudid, { excepto: o.id, titulo, motivo: "tomado", dirigida });
        const yo = await nombreDe(client, id);
        await notificar(client, {
            userid: otro,
            tipo: "oferta-aceptada",
            titulo: rol === "cliente"
                ? `${primerNombre(yo)} aceptó tu ${dirigida ? "presupuesto" : "propuesta"}`
                : `${primerNombre(yo)} aceptó tu contraoferta`,
            contenido: `Cita: ${textoDia(o.dia, o.hora)} · ${pesos(o.precio)} · «${titulo}»`,
            enlace: rol === "cliente"
                ? (dirigida ? "/trabajos-pendientes" : "/problemas?vista=citas")
                : (dirigida ? "/mis-pedidos?vista=aceptados" : enlaceCliente(o.solicitudid)),
            otroid: id,
            solicitudid: o.solicitudid,
        }, { transaccion: true });
        await client.query("COMMIT");
        return { oferta: aceptada.rows[0], solicitud: agendado.rows[0] };
    });
}

/** Contraoferta: otro precio (y un mensaje opcional). Le pasa el turno a la otra persona. */
async function contraofertar(id, ofertaid, precio, mensaje) {
    id = Number(id);
    return conOfertas(async (client, cuentas) => {
        await client.query("BEGIN");
        const { o, rol, otro } = await tomarParaResponder(client, id, ofertaid);
        if (o.vencida) throw errorConEstado("El día de esta propuesta ya pasó.", 409);
        if (Number(precio) === Number(o.precio)) {
            throw errorConEstado("Es el mismo precio que ya está propuesto: si te sirve, tocá Aceptar.", 400);
        }
        const pasos = await client.query("SELECT count(*)::int AS n FROM ofertas_historial WHERE ofertaid = $1", [o.id]);
        if (pasos.rows[0].n >= MAX_PASOS) {
            throw errorConEstado("Ya hubo muchas idas y vueltas con esta propuesta: aceptala o rechazala.", 400);
        }
        if (cuentas) await verificarQuePuedenInteractuar(client, id, otro, "No podés responder esta propuesta.");
        const otroTurno = rol === "cliente" ? "trabajador" : "cliente";
        const actualizada = await client.query(
            "UPDATE ofertas SET precio = $2, turno = $3, actualizada = now() WHERE id = $1 RETURNING *",
            [o.id, precio, otroTurno]);
        await anotar(client, o.id, id, rol, "contraoferta", precio, mensaje);
        const yo = await nombreDe(client, id);
        const titulo = o.titulo || tituloDeSolicitud(o.solicitud);
        await notificar(client, {
            userid: otro,
            tipo: "contraoferta",
            titulo: `${primerNombre(yo)} te propuso ${pesos(precio)}`,
            contenido: mensaje ? `«${titulo}» · “${recortar(mensaje, 60)}”` : `Contraoferta para «${titulo}»`,
            enlace: rol === "cliente" ? enlaceTrabajador(esDirigida(o.dirigida)) : enlaceCliente(o.solicitudid, esDirigida(o.dirigida)),
            otroid: id,
            solicitudid: o.solicitudid,
        }, { transaccion: true });
        await client.query("COMMIT");
        return actualizada.rows[0];
    });
}

/**
 * Rechaza la propuesta.
 *  - El cliente puede rechazar en cualquier momento. Con eliminarPublicacion, además borra el
 *    problema (y se cierran las demás propuestas); si no, sigue publicado para otros trabajadores.
 *  - El trabajador rechaza la contraoferta del cliente, o retira su propuesta si todavía no le contestaron.
 */
async function rechazar(id, ofertaid, { eliminarPublicacion = false, mensaje = null } = {}) {
    id = Number(id);
    return conOfertas(async (client) => {
        await client.query("BEGIN");
        const { o, rol, otro } = await tomarParaResponder(client, id, ofertaid, { exigirTurno: false });
        const estado = rol === "trabajador" && o.turno === "cliente" ? "retirada" : "rechazada";
        const result = await client.query(
            "UPDATE ofertas SET estado = $2, rechazada_por = $3, actualizada = now() WHERE id = $1 RETURNING *",
            [o.id, estado, rol]);
        await anotar(client, o.id, id, rol, estado, null, mensaje);
        const yo = await nombreDe(client, id);
        const titulo = o.titulo || tituloDeSolicitud(o.solicitud);
        const borrar = rol === "cliente" && eliminarPublicacion;
        const dirigida = esDirigida(o.dirigida);

        let tituloAviso;
        if (rol === "cliente") tituloAviso = `${primerNombre(yo)} rechazó tu propuesta`;
        else if (estado === "retirada") tituloAviso = `${primerNombre(yo)} retiró su propuesta`;
        else tituloAviso = `${primerNombre(yo)} rechazó tu contraoferta`;
        await notificar(client, {
            userid: otro,
            tipo: estado === "retirada" ? "oferta-retirada" : "oferta-rechazada",
            titulo: tituloAviso,
            contenido: rol === "cliente"
                ? `«${titulo}»${borrar ? (dirigida ? " · Canceló el pedido" : " · El cliente eliminó la publicación") : ""}`
                : dirigida ? `«${titulo}»` : `«${titulo}» · Sigue publicado para otros trabajadores`,
            enlace: rol === "cliente" ? enlaceTrabajador(dirigida) : enlaceCliente(o.solicitudid, dirigida),
            otroid: id,
            solicitudid: o.solicitudid,
        }, { transaccion: true });

        if (borrar) {
            await cerrarOfertasDelProblema(client, o.solicitudid, { titulo, motivo: "eliminado", dirigida });
            await client.query(
                "DELETE FROM solicitudes WHERE id = $1 AND contratadorid = $2 AND estado = 'por revisar'",
                [o.solicitudid, id]);
        }
        await client.query("COMMIT");
        return { oferta: result.rows[0], publicacionEliminada: borrar };
    });
}

/** Propuestas que mandó el trabajador (las abiertas primero), con el problema y el cliente. */
async function mias(id) {
    id = Number(id);
    return conOfertas(async (client) => {
        const result = await client.query(`
            SELECT o.*, to_char(o.dia, 'YYYY-MM-DD') AS dia_texto, (o.dia < ${HOY}) AS vencida,
                s.estado AS estado_problema, s.periodo, s.diassemana, s.localidad, s.solicitud, s.trabajadorid AS trabajador_asignado, s.dirigida,
                a.aptitud,
                u.nombre_completo AS cliente_nombre, u.foto_perfil AS cliente_foto, u.puntuacion_contratador,
                ${HISTORIAL}
            FROM ofertas o
            LEFT JOIN solicitudes s ON s.id = o.solicitudid
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            LEFT JOIN usuarios u ON u.id = o.contratadorid
            WHERE o.trabajadorid = $1
              AND (o.estado = 'pendiente' OR o.actualizada > now() - interval '60 days')
            ORDER BY (o.estado = 'pendiente') DESC, (o.turno = 'trabajador') DESC, o.actualizada DESC
            LIMIT 100`, [id]);
        return result.rows;
    });
}

/** Propuestas que recibió el cliente en sus problemas (las de trabajadores bloqueados o suspendidos no se muestran). */
async function recibidas(id) {
    id = Number(id);
    return conOfertas(async (client, cuentas) => {
        const result = await client.query(`
            SELECT o.*, to_char(o.dia, 'YYYY-MM-DD') AS dia_texto, (o.dia < ${HOY}) AS vencida,
                u.nombre_completo AS trabajador_nombre, u.foto_perfil AS trabajador_foto, u.puntuacion_trabajador, s.dirigida,
                ${cuentas ? "COALESCE(u.verificado, false)" : "false"} AS verificado,
                ${HISTORIAL}
            FROM ofertas o
            INNER JOIN solicitudes s ON s.id = o.solicitudid AND s.contratadorid = $1
            LEFT JOIN usuarios u ON u.id = o.trabajadorid
            WHERE o.contratadorid = $1
              AND (o.estado = 'pendiente' OR o.actualizada > now() - interval '60 days')
              ${cuentas ? `AND NOT (o.estado = 'pendiente' AND (NOT ${cuentaActiva("u")} OR ${hayBloqueo("u.id", "$1")}))` : ""}
            ORDER BY o.solicitudid DESC, (o.estado = 'pendiente') DESC, o.precio ASC, o.id
            LIMIT 300`, [id]);
        return result.rows;
    });
}

const OfertasService = { nueva, aceptar, contraofertar, rechazar, mias, recibidas };
export default OfertasService;
