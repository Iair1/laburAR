import config from "../dbconfig.js";
import { Client } from "../db.js";
import {v2 as cloudinary} from "cloudinary";
import { asegurarCuentas, esEmpresa } from "../esquema.js";
import { errorConEstado } from "../moderacion.js";
import { olvidarEstadoCuenta } from "../auth.middleware.js";
import { notificar } from "../notificaciones.js";


// Abre una conexión, corre la función y la cierra siempre
async function conCliente(funcion) {
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo procesar el pedido. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        return await funcion(client);
    } finally {
        await client.end();
    }
}

/** ¿El usuario es administrador? (se marca a mano en la base: usuarios.es_admin = true) */
async function esAdmin(id) {
    return conCliente(async (client) => {
        const result = await client.query("SELECT es_admin FROM usuarios WHERE id = $1", [id]);
        return result.rows[0]?.es_admin === true;
    });
}

/** Números para el encabezado del panel */
async function resumen() {
    return conCliente(async (client) => {
        const result = await client.query(`
            SELECT
                (SELECT count(*)::int FROM denuncias WHERE estado = 'pendiente') AS denuncias_pendientes,
                (SELECT count(*)::int FROM usuarios WHERE dni_estado = 'pendiente' AND eliminado IS NOT TRUE) AS dni_pendientes,
                (SELECT count(*)::int FROM usuarios WHERE suspendido = true AND eliminado IS NOT TRUE) AS suspendidos,
                (SELECT count(*)::int FROM usuarios WHERE eliminado IS NOT TRUE) AS usuarios,
                (SELECT count(*)::int FROM errores_servidor WHERE fecha > now() - interval '1 day') AS errores_24h`);
        return result.rows[0];
    });
}

/** Los últimos errores del servidor y del navegador (los más nuevos primero) */
async function errores(origen = "") {
    return conCliente(async (client) => {
        const result = await client.query(`
            SELECT e.*, u.nombre_completo AS usuario_nombre
            FROM errores_servidor e LEFT JOIN usuarios u ON u.id = e.userid
            WHERE ($1 = '' OR e.origen = $1)
            ORDER BY e.id DESC LIMIT 150`, [["servidor", "navegador"].includes(origen) ? origen : ""]);
        return result.rows;
    });
}

const ESTADOS_DENUNCIA = ["pendiente", "resuelta", "descartada"];

/** Denuncias por estado, con los datos de las dos personas y cuántas denuncias tiene el denunciado */
async function denuncias(estado = "pendiente") {
    if (!ESTADOS_DENUNCIA.includes(estado)) estado = "pendiente";
    return conCliente(async (client) => {
        const result = await client.query(`
            SELECT d.*,
                dn.nombre_completo AS denunciante_nombre, dn.foto_perfil AS denunciante_foto,
                dd.nombre_completo AS denunciado_nombre, dd.foto_perfil AS denunciado_foto,
                COALESCE(dd.suspendido, false) AS denunciado_suspendido,
                (SELECT count(*)::int FROM denuncias x WHERE x.denunciadoid = d.denunciadoid) AS denuncias_al_denunciado,
                s.solicitud AS solicitud_texto,
                m.contenido AS mensaje_texto, m.imagen AS mensaje_imagen
            FROM denuncias d
            LEFT JOIN usuarios dn ON dn.id = d.denuncianteid
            LEFT JOIN usuarios dd ON dd.id = d.denunciadoid
            LEFT JOIN solicitudes s ON s.id = d.solicitudid
            LEFT JOIN mensajes m ON m.id = d.mensajeid
            WHERE d.estado = $1
            ORDER BY d.fecha ${estado === "pendiente" ? "ASC" : "DESC"}
            LIMIT 100`, [estado]);
        return result.rows;
    });
}

async function resolverDenuncia(id, estado, nota) {
    if (!["resuelta", "descartada"].includes(estado)) {
        throw errorConEstado("Estado inválido", 400);
    }
    return conCliente(async (client) => {
        const result = await client.query(`
            UPDATE denuncias SET estado = $2, nota_admin = $3, fecha_resuelta = now()
            WHERE id = $1 RETURNING *`, [id, estado, String(nota ?? "").trim().slice(0, 1000) || null]);
        if (result.rowCount === 0) throw errorConEstado("Denuncia no encontrada", 404);
        const notificacion = await client.query(`INSERT INTO notificaciones
        (tipo, userid, contenido) 
        VALUES ('Denuncia atendida', $1, $2)`,
    [result.rows[0].denuncianteid, `Su denuncia contra ${result.rows[0].denunciadoid} ha sido ${result.rows[0].estado} por un administrador. Mensaje: ${String(nota ?? "").trim().slice(0, 1000)}`])
        return result.rows[0];
    });
}

const COLUMNAS_USUARIO = `u.id, u.nombre_completo, u.foto_perfil, u.email, u.localidad,
    COALESCE(u.es_admin, false) AS es_admin, COALESCE(u.suspendido, false) AS suspendido, u.motivo_suspension,
    COALESCE(u.eliminado, false) AS eliminado, COALESCE(u.verificado, false) AS verificado, u.dni_estado,
    ${esEmpresa("u")} AS es_empresa, u.puntuacion_trabajador, u.puntuacion_contratador, u.fecha_alta,
    (SELECT count(*)::int FROM denuncias x WHERE x.denunciadoid = u.id) AS denuncias_recibidas,
    (SELECT count(*)::int FROM denuncias x WHERE x.denunciadoid = u.id AND x.estado = 'pendiente') AS denuncias_pendientes`;

/** Busca usuarios por nombre, email o número de id. Con filtro "dni" trae los que esperan verificación. */
async function usuarios(busqueda = "", filtro = "") {
    const texto = String(busqueda).trim();
    return conCliente(async (client) => {
        const condiciones = ["u.eliminado IS NOT TRUE"];
        const valores = [];
        if (texto) {
            valores.push(`%${texto.toLowerCase()}%`);
            condiciones.push(`(lower(u.nombre_completo) LIKE $${valores.length} OR lower(COALESCE(u.email, '')) LIKE $${valores.length}
                ${/^\d{1,9}$/.test(texto) ? `OR u.id = ${Number(texto)}` : ""})`);
        }
        if (filtro === "dni") condiciones.push("u.dni_estado = 'pendiente'");
        if (filtro === "suspendidos") condiciones.push("u.suspendido = true");
        if (filtro === "denunciados") condiciones.push("EXISTS (SELECT 1 FROM denuncias x WHERE x.denunciadoid = u.id AND x.estado = 'pendiente')");
        const result = await client.query(`
            SELECT ${COLUMNAS_USUARIO}
            FROM usuarios u
            WHERE ${condiciones.join(" AND ")}
            ORDER BY u.id DESC
            LIMIT 50`, valores);
        return result.rows;
    });
}

/** Ficha de un usuario: datos, denuncias recibidas y hechas, y un link al DNI que vence en 10 minutos */
async function usuario(id) {
    return conCliente(async (client) => {
        const result = await client.query(`SELECT ${COLUMNAS_USUARIO}, u.telefono, u.dni, u.dni_foto FROM usuarios u WHERE u.id = $1`, [id]);
        const u = result.rows[0];
        if (!u) throw errorConEstado("Usuario no encontrado", 404);
        const recibidas = await client.query(`
            SELECT d.id, d.motivo, d.detalle, d.estado, d.fecha, dn.nombre_completo AS denunciante_nombre
            FROM denuncias d LEFT JOIN usuarios dn ON dn.id = d.denuncianteid
            WHERE d.denunciadoid = $1 ORDER BY d.fecha DESC LIMIT 30`, [id]);
        const hechas = await client.query(`
            SELECT d.id, d.motivo, d.estado, d.fecha, dd.nombre_completo AS denunciado_nombre
            FROM denuncias d LEFT JOIN usuarios dd ON dd.id = d.denunciadoid
            WHERE d.denuncianteid = $1 ORDER BY d.fecha DESC LIMIT 30`, [id]);
        let dni_url = null;
        if (u.dni_foto) {
            try {
                dni_url = cloudinary.utils.private_download_url(u.dni_foto, "jpg", {
                    type: "authenticated",
                    expires_at: Math.floor(Date.now() / 1000) + 600,
                });
            } catch (error) {
                console.error("No se pudo generar el link del DNI:", error.message);
            }
        }
        delete u.dni_foto;
        return { ...u, dni_url, denuncias_recibidas_lista: recibidas.rows, denuncias_hechas_lista: hechas.rows };
    });
}

async function suspender(adminid, userid, suspendido, motivo) {
    if (Number(userid) === Number(adminid)) {
        throw errorConEstado("No te podés suspender a vos mismo", 400);
    }
    return conCliente(async (client) => {
        const objetivo = await client.query("SELECT es_admin FROM usuarios WHERE id = $1", [userid]);
        if (objetivo.rowCount === 0) throw errorConEstado("Usuario no encontrado", 404);
        if (objetivo.rows[0].es_admin && suspendido) throw errorConEstado("No se puede suspender a otro administrador", 400);
        const result = await client.query(`
            UPDATE usuarios SET suspendido = $2, motivo_suspension = $3
            WHERE id = $1 RETURNING id, suspendido, motivo_suspension`,
            [userid, suspendido === true, suspendido ? (String(motivo ?? "").trim().slice(0, 300) || null) : null]);
        olvidarEstadoCuenta(userid);
        return result.rows[0];
    });
}

/** Aprueba o rechaza el DNI y le avisa a la persona */
async function verificarDni(userid, aprobado, nota) {
    return conCliente(async (client) => {
        const result = await client.query(`
            UPDATE usuarios SET dni_estado = $2, verificado = $3
            WHERE id = $1 AND dni_foto IS NOT NULL RETURNING id, dni_estado, verificado`,
            [userid, aprobado ? "verificado" : "rechazado", aprobado === true]);
        if (result.rowCount === 0) throw errorConEstado("Ese usuario no subió su DNI", 404);
        const motivo = String(nota ?? "").trim().slice(0, 300);
        await notificar(client, aprobado
            ? {
                userid, tipo: "verificacion", enlace: "/mi-cuenta#identidad",
                titulo: "Verificamos tu identidad",
                contenido: "Tu perfil ya muestra la insignia de identidad verificada",
            }
            : {
                userid, tipo: "verificacion", enlace: "/mi-cuenta#identidad",
                titulo: "No pudimos verificar tu identidad",
                contenido: motivo ? `${motivo} · Subí otra foto del DNI` : "Subí otra foto del DNI desde Mi cuenta",
            });
        return result.rows[0];
    });
}

const AdminService = {
    errores,
    esAdmin,
    resumen,
    denuncias,
    resolverDenuncia,
    usuarios,
    usuario,
    suspender,
    verificarDni,
};
export default AdminService;
