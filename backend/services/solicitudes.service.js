import config from "../dbconfig.js";
import pkg from "pg";
import { asegurarCuentas, asegurarOfertas } from "../esquema.js";
import { hayBloqueo, cuentaActiva, verificarQuePuedenInteractuar, errorConEstado } from "../moderacion.js";
import { notificar, nombreDe, primerNombre, tituloDeSolicitud, textoDia } from "../notificaciones.js";
import { cerrarOfertasDelProblema } from "./ofertas.service.js";
const {Client} = pkg;

/*async function entregarS (solicitudes) {
    const sCompletas = {}
    try{
        for(const solicitud of solicitudes){
            const completa = await client.query("SELECT * FROM solicitudes WHERE id = $1", [solicitud]);
            sCompletas[solicitud] = completa.rows[0];
        }
        return sCompletas;
    }catch(error){
        console.error("Error al entregar solicitudes completas:", error);
        throw error;
    } 
}*/
async function borrarSolicitud(id, solicitudid) {
    const conOfertas = await asegurarOfertas();
    const client = new Client(config);
    try{
        await client.connect();
        await client.query("BEGIN");
        const result = await client.query("DELETE FROM solicitudes WHERE contratadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea borrar no existe o no le pertenece a este usuario");
        }
        // Si era un problema con propuestas abiertas, se cierran y se les avisa a esos trabajadores
        if(conOfertas && result.rows[0].dirigida === false) {
            await cerrarOfertasDelProblema(client, result.rows[0].id, { titulo: tituloDeSolicitud(result.rows[0].solicitud), motivo: "eliminado" });
        }
        await client.query("COMMIT");
    } catch(error){
        await client.query("ROLLBACK").catch(() => {});
        console.error("Error al borrar la solicitud:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function subirSolicitud(id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida, aptitud) {
    const cuentasListas = trabajadorid ? await asegurarCuentas() : false;
    const client = new Client(config);
    try {
        await client.connect();
        if(cuentasListas) {
            await verificarQuePuedenInteractuar(client, Number(id), Number(trabajadorid),
                "No podés mandarle una solicitud a este trabajador.");
        }
        // Si no vienen días (o vienen todos en false), se aceptan todos los días.
        // (Antes decía "diassemana = [...]", que asigna en vez de comparar y siempre pisaba los días.)
        if(!Array.isArray(diassemana) || diassemana.length !== 7 || diassemana.every((d) => !d)){
            diassemana = [true, true, true, true, true, true, true];
        }
        // La categoría puede venir por nombre (ej: "Plomería"): se busca o se crea, igual que en nuevaAptitud
        if(!aptitudid && aptitud){
            const apt = await client.query(`
                INSERT INTO aptitudes (aptitud) VALUES ($1)
                ON CONFLICT (aptitud) DO UPDATE SET aptitud = EXCLUDED.aptitud
                RETURNING id`, [aptitud]);
            aptitudid = apt.rows[0].id;
        }
        const result = await client.query(
            "INSERT INTO solicitudes (contratadorid, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [id, localidad, solicitud, periodo, aptitudid, aptitud_especificaid, trabajoid, diassemana, trabajadorid, dirigida]
        );
        // Un pedido directo a un trabajador: le llega el aviso
        if(trabajadorid) {
            const cliente = await nombreDe(client, id);
            await notificar(client, {
                userid: Number(trabajadorid),
                tipo: "solicitud-nueva",
                titulo: `${primerNombre(cliente)} te mandó una solicitud`,
                contenido: `«${tituloDeSolicitud(solicitud)}»${aptitud ? ` · ${aptitud}` : ""}`,
                enlace: "/solicitudes-recibidas",
                otroid: Number(id),
                solicitudid: result.rows[0].id,
            });
        }
        return result.rows[0];
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

async function misProblemas(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, a.aptitud,
                ut.nombre_completo AS trabajador_nombre, ut.foto_perfil AS trabajador_foto, ut.puntuacion_trabajador
            FROM solicitudes s
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            LEFT JOIN usuarios ut ON ut.id = s.trabajadorid
            WHERE s.contratadorid = $1 AND s.dirigida = FALSE
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener mis problemas:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function misSolicitudes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador, u.puntuacion_trabajador, a.aptitud
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.trabajadorid
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            WHERE s.contratadorid = $1 AND s.estado = 'por revisar'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos solicitudes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function trabajosPendientes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.contratadorid
            WHERE s.trabajadorid = $1 AND s.estado = 'pendiente'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos pendientes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function serviciosPendientes(id) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT s.*, u.nombre_completo, u.foto_perfil, u.puntuacion_contratador, u.puntuacion_trabajador, a.aptitud
            FROM solicitudes s
            INNER JOIN usuarios u ON u.id = s.trabajadorid
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            WHERE s.contratadorid = $1 AND s.estado = 'pendiente'
            ORDER BY s.id DESC;
        `, [id]);
        return result.rows;
    } catch(error){
        console.error("Error al obtener trabajos pendientes:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function busqueda(id) {
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, s.diassemana, s.contratadorid, s.localidad, s.estado, a.aptitud, ae.aptitud_especifica, t.trabajo, uc.nombre_completo, uc.foto_perfil, uc.puntuacion_contratador,
                (
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes ua
                        WHERE ua.userid = $1 AND ua.aptitudid = s.aptitudid AND s.aptitudid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes_especificas uae
                        WHERE uae.userid = $1 AND uae.aptitud_especificaid = s.aptitud_especificaid AND s.aptitud_especificaid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_tdr ut
                        WHERE ut.userid = $1 AND ut.trabajoid = s.trabajoid AND s.trabajoid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                ) AS coincidencias
            FROM solicitudes s
            INNER JOIN usuarios u
                ON u.id = $1 AND u.id=s.trabajadorid
            LEFT JOIN aptitudes a
                ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae
                ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t
                ON t.id = s.trabajoid
            INNER JOIN usuarios uc
                ON uc.id = s.contratadorid
            WHERE s.estado = 'por revisar'
              ${cuentasListas ? `AND ${cuentaActiva("uc")} AND NOT ${hayBloqueo("uc.id", "$1")}` : ""}
            ORDER BY coincidencias DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}

const aceptarSolicitud = async(id, solicitudid, dia, hora = null) => {
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    try {
        await client.connect();
        // Un problema publicado (dirigida = false) no se agenda directo: el trabajador manda una
        // propuesta con día, hora y precio, y el cliente la acepta (ver ofertas.service.js)
        const tipo = await client.query("SELECT dirigida FROM solicitudes WHERE id = $1", [solicitudid]);
        if(tipo.rows[0]?.dirigida === false) {
            throw errorConEstado("Para tomar un problema publicado, mandale una propuesta al cliente con el día, la hora y tu precio.", 400);
        }
        if(cuentasListas) {
            const duenio = await client.query("SELECT contratadorid FROM solicitudes WHERE id = $1", [solicitudid]);
            if(duenio.rows[0]?.contratadorid) {
                await verificarQuePuedenInteractuar(client, Number(id), Number(duenio.rows[0].contratadorid),
                    "No podés tomar el pedido de este usuario.");
            }
        }
        let result;
        if(dia){
            // El trabajador elige un día dentro del período y en los días de la semana pedidos.
            //  - solicitud dirigida (o vieja, con dirigida en NULL): solo el trabajador al que va dirigida
            //  - problema abierto (dirigida = false): cualquier trabajador menos el que lo publicó
            // diassemana va de Lunes [1] a Domingo [7], igual que ISODOW.
            // Si elige hora, se agrega al texto como "Hora acordada: 10:00 hs" (no hay columna para la hora).
            result = await client.query(`
                UPDATE solicitudes
                SET estado = 'pendiente',
                    trabajadorid = $1,
                    periodo = ARRAY[$3::date, $3::date],
                    solicitud = CASE WHEN $4::text IS NULL THEN solicitud
                                     ELSE solicitud || E'\nHora acordada: ' || $4::text || ' hs' END
                WHERE id = $2
                  AND estado = 'por revisar'
                  AND $3::date BETWEEN periodo[1] AND periodo[2]
                  AND COALESCE(diassemana[EXTRACT(ISODOW FROM $3::date)::int], TRUE) = TRUE
                  AND (
                        (COALESCE(dirigida, TRUE) = TRUE AND trabajadorid = $1)
                     OR (dirigida = FALSE AND contratadorid <> $1)
                  )
                RETURNING *`, [id, solicitudid, dia, hora]);
        } else {
            // Sin día (como lo manda hoy "Aceptar solicitud"): solo solicitudes dirigidas, sin tocar el período
            result = await client.query(`
                UPDATE solicitudes SET estado = 'pendiente'
                WHERE trabajadorid = $1 AND id = $2 AND estado = 'por revisar' AND COALESCE(dirigida, TRUE) = TRUE
                RETURNING *`, [id, solicitudid]);
        }
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea aceptar no existe, no le pertenece a este usuario, o no coincide con las fechas propuestas por el usuario.-");
        }
        const s = result.rows[0];
        const trabajador = await nombreDe(client, id, "El trabajador");
        const aviso = await notificar(client, {
            userid: s.contratadorid,
            tipo: "solicitud-aceptada",
            titulo: `${primerNombre(trabajador)} aceptó tu solicitud`,
            contenido: `${dia ? `Cita: ${textoDia(dia, hora)} · ` : ""}«${tituloDeSolicitud(s.solicitud)}»`,
            enlace: "/mis-pedidos?vista=aceptados",
            otroid: Number(id),
            solicitudid: s.id,
        });
        return{solicitud: s, aviso};
    } catch(error) {
        if(!error.status) console.error("Error al aceptar la solicitud:", error);
        throw error;
    } finally {
        await client.end();
    }
}

const rechazarSolicitud = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query("DELETE FROM solicitudes WHERE trabajadorid = $1 AND id = $2 RETURNING *", [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea rechazar no existe o no le pertenece a este usuario");
        }
        const trabajador = await nombreDe(client, id, "El trabajador");
        const aviso = await notificar(client, {
            userid: result.rows[0].contratadorid,
            tipo: "solicitud-rechazada",
            titulo: `${primerNombre(trabajador)} no puede tomar tu pedido`,
            contenido: `«${tituloDeSolicitud(result.rows[0].solicitud)}» · Buscá otro trabajador`,
            enlace: "/buscar",
            otroid: Number(id),
            solicitudid: result.rows[0].id,
        });
        return{solicitud: result.rows[0], aviso};
    } catch(error) {
        console.error("Error al rechazar la solicitud:", error);
        throw error;
    } finally {
        await client.end();
    }
}

const cancelarTrabajo = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            UPDATE solicitudes s
            SET estado = 'cancelado'
            FROM usuarios u
            WHERE (s.contratadorid = $1 OR s.trabajadorid = $1) AND s.id = $2 AND s.estado = 'pendiente'
            AND u.id = CASE WHEN s.contratadorid = $1 THEN s.contratadorid ELSE s.trabajadorid END
            RETURNING s.*, u.nombre_completo`, [id, solicitudid]);
        if(result.rowCount === 0) {
            throw new Error("La solicitud que desea cancelar no existe o no le pertenece a este usuario");
        }
        const c = result.rows[0];
        const canceloElCliente = c.contratadorid === Number(id);
        const otro = canceloElCliente ? c.trabajadorid : c.contratadorid;
        // A dónde lleva el aviso: a donde la otra persona veía esa cita
        const enlace = c.dirigida === false
            ? (canceloElCliente ? "/problemas?vista=citas" : "/mis-problemas?vista=historial")
            : (canceloElCliente ? "/trabajos-pendientes" : "/mis-pedidos");
        await notificar(client, {
            userid: otro,
            tipo: "trabajo-cancelado",
            titulo: `${primerNombre(c.nombre_completo)} canceló la cita`,
            contenido: `«${tituloDeSolicitud(c.solicitud)}» · ${textoDia(Array.isArray(c.periodo) ? c.periodo[0] : null)}`.replace(/ · $/, ""),
            enlace,
            otroid: Number(id),
            solicitudid: c.id,
        });
        return c;
    } catch(error) {
        console.error("Error al cancelar el trabajo:", error);
        throw error;
    } finally {
        await client.end();
    }
}
       


// El trabajador o el cliente marcan el trabajo como terminado, desde el día de la cita.
const terminarTrabajo = async(id, solicitudid) => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            UPDATE solicitudes s
            SET estado = 'terminada'
            WHERE s.id = $2 AND s.estado = 'pendiente'
              AND (s.contratadorid = $1 OR s.trabajadorid = $1)
              AND s.periodo[1] <= CURRENT_DATE
            RETURNING s.*`, [id, solicitudid]);
        if(result.rowCount === 0) {
            const error = new Error("No se puede terminar: el trabajo no existe, no es tuyo, no está agendado o todavía no llegó el día");
            error.status = 400;
            throw error;
        }
        const s = result.rows[0];
        const otro = s.contratadorid === Number(id) ? s.trabajadorid : s.contratadorid;
        const yo = await nombreDe(client, id, "La otra persona");
        await notificar(client, {
            userid: otro,
            tipo: "trabajo-terminado",
            titulo: `${primerNombre(yo)} marcó el trabajo como terminado`,
            contenido: `«${tituloDeSolicitud(s.solicitud)}» · Dejale una reseña`,
            enlace: `resena:${s.id}`,
            otroid: Number(id),
            solicitudid: s.id,
        });
        return s;
    } finally {
        await client.end();
    }
}

const revisarTerminadas = async() => {
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(`
            WITH updated_solicitudes AS (
                UPDATE solicitudes
                SET estado = 'terminada'
                WHERE estado = 'pendiente' AND periodo[2] < CURRENT_DATE
                RETURNING id, trabajadorid, contratadorid, solicitud
            )
            SELECT 
                s.id,
                s.trabajadorid, 
                ut.nombre_completo AS trabajador_nombre,
                s.contratadorid, 
                uc.nombre_completo AS contratador_nombre,
                s.solicitud
            FROM updated_solicitudes s
            JOIN usuarios ut ON s.trabajadorid = ut.id
            JOIN usuarios uc ON s.contratadorid = uc.id;
        `);
        let notificaciones=[]
        for(const trabajo of result.rows){
            const titulo = tituloDeSolicitud(trabajo.solicitud);
            const avisoC = await notificar(client, {
                userid: trabajo.contratadorid,
                tipo: "trabajo-terminado",
                titulo: `¿Cómo te fue con ${primerNombre(trabajo.trabajador_nombre)}?`,
                contenido: `«${titulo}» terminó · Dejale una reseña`,
                enlace: `resena:${trabajo.id}`,
                otroid: trabajo.trabajadorid,
                solicitudid: trabajo.id,
            });
            const avisoT = await notificar(client, {
                userid: trabajo.trabajadorid,
                tipo: "trabajo-terminado",
                titulo: `¿Cómo te fue con ${primerNombre(trabajo.contratador_nombre)}?`,
                contenido: `«${titulo}» terminó · Dejale una reseña`,
                enlace: `resena:${trabajo.id}`,
                otroid: trabajo.contratadorid,
                solicitudid: trabajo.id,
            });
            notificaciones.push({avisoC, avisoT});
        }
        return notificaciones.rows;
    }catch(error) {
        console.error("Error al revisar solicitudes terminadas:", error.message);
        throw error;
    } finally {
        await client.end();
    }
}

//puede que la saque

async function busquedaAA(id) {
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    console.log(id);
    try {
        await client.connect();
        const sUtiles = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, s.diassemana, s.localidad, s.contratadorid, s.aptitudid,
                a.aptitud, ae.aptitud_especifica, t.trabajo, uc.nombre_completo, uc.foto_perfil, uc.puntuacion_contratador,
                (
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes ua
                        WHERE ua.userid = $1 AND ua.aptitudid = s.aptitudid AND s.aptitudid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_aptitudes_especificas uae
                        WHERE uae.userid = $1 AND uae.aptitud_especificaid = s.aptitud_especificaid AND s.aptitud_especificaid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                    + CASE WHEN EXISTS (
                        SELECT 1 FROM usuarios_tdr ut
                        WHERE ut.userid = $1 AND ut.trabajoid = s.trabajoid AND s.trabajoid IS NOT NULL
                    ) THEN 1 ELSE 0 END
                ) AS coincidencias
            FROM solicitudes s
            LEFT JOIN aptitudes a
                ON a.id = s.aptitudid
            LEFT JOIN aptitudes_especificas ae
                ON ae.id = s.aptitud_especificaid
            LEFT JOIN tdr t
                ON t.id = s.trabajoid
            INNER JOIN usuarios uc
                ON uc.id = s.contratadorid
            WHERE s.estado = 'por revisar' AND s.dirigida = FALSE
              AND s.contratadorid <> $1
              AND s.periodo[2] >= CURRENT_DATE - 1
              ${cuentasListas ? `AND ${cuentaActiva("uc")} AND NOT ${hayBloqueo("uc.id", "$1")}` : ""}
            ORDER BY coincidencias DESC, s.id DESC;`, [id]);

        return sUtiles.rows
    }catch(error){
        console.error("Error en la busqueda:", error);
        throw error;
    }finally{
        await client.end();
    }
}





const SolicitudesService = {
    misProblemas,
    busqueda,
    busquedaAA,
    misSolicitudes,
    trabajosPendientes,
    subirSolicitud,
    borrarSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    serviciosPendientes,
    cancelarTrabajo,
    terminarTrabajo,
    revisarTerminadas
}

export default SolicitudesService;