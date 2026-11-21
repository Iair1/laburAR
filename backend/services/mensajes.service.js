import config from "../dbconfig.js";
import pkg from "pg";
import {v2 as cloudinary} from "cloudinary";
import { asegurarResenasYMensajes, asegurarCuentas, asegurarOfertas } from "../esquema.js";
import { hayBloqueo, cuentaActiva } from "../moderacion.js";
const {Client} = pkg;

function errorConEstado(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Hay (o hubo) una solicitud/cita entre los dos, o ya se escribieron antes
const PUEDEN_HABLAR = `
    EXISTS (SELECT 1 FROM solicitudes s
            WHERE s.trabajadorid IS NOT NULL
              AND ((s.contratadorid = $1 AND s.trabajadorid = $2) OR (s.contratadorid = $2 AND s.trabajadorid = $1)))
    OR EXISTS (SELECT 1 FROM mensajes m
               WHERE (m.emisorid = $1 AND m.receptorid = $2) OR (m.emisorid = $2 AND m.receptorid = $1))`;
// ...o están negociando una propuesta de precio (para preguntar detalles antes de aceptar)
const NEGOCIAN = `
    OR EXISTS (SELECT 1 FROM ofertas o
               WHERE o.estado IN ('pendiente', 'aceptada')
                 AND ((o.trabajadorid = $1 AND o.contratadorid = $2) OR (o.trabajadorid = $2 AND o.contratadorid = $1)))`;
const puedenHablar = async () => PUEDEN_HABLAR + ((await asegurarOfertas()) ? NEGOCIAN : "");

// Fotos del chat: se achican hasta 1200px sin recortarlas
async function subirImagenMensaje(imagen) {
    const result = await cloudinary.uploader.upload(imagen);
    return cloudinary.url(result.public_id, {
        secure: true,
        version: result.version,
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
    });
}

async function mandarMensaje(id, receptor, texto, imagen = null) {
    id = Number(id);
    receptor = Number(receptor);
    if(!Number.isInteger(receptor) || receptor === id) {
        throw errorConEstado("No se puede mandar un mensaje a ese usuario", 400);
    }
    await asegurarResenasYMensajes();
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    try {
        await client.connect();
        const permiso = await client.query(`SELECT (${await puedenHablar()}) AS puede`, [id, receptor]);
        if(!permiso.rows[0].puede) {
            throw errorConEstado("Solo podés escribirle a alguien con quien tenés una cita o una solicitud", 403);
        }
        if(cuentasListas) {
            const bloqueo = await client.query(`
                SELECT ${hayBloqueo("$1::int", "$2::int")} AS bloqueado,
                    (SELECT ${cuentaActiva("u")} FROM usuarios u WHERE u.id = $2::int) AS activa`, [id, receptor]);
            if(bloqueo.rows[0].bloqueado || bloqueo.rows[0].activa === false) {
                throw errorConEstado("No podés escribirle a este usuario.", 403);
            }
        }
        const imagenUrl = imagen ? await subirImagenMensaje(imagen) : null;
        const result = await client.query(
            "INSERT INTO mensajes (emisorid, receptorid, contenido, imagen) VALUES ($1, $2, $3, $4) RETURNING *",
            [id, receptor, texto || "", imagenUrl]);
        return result.rows[0];
    }finally{
        await client.end();
    }
}

async function borrarMensaje(id, mensaje) {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("DELETE FROM mensajes WHERE id = $2 AND emisorid=$1 RETURNING *", [id, mensaje]);
        if(result.rows.length === 0){
            throw new Error("El mensaje que desea eliminar no existe o no es suyo.")
        }
        return result.rows[0].contenido
    }finally{
        await client.end();
    }
}

/**
 * Mensajes entre el usuario y otro, del más viejo al más nuevo.
 *  - despuesDe (opcional): solo los mensajes con id mayor (para ir actualizando el chat abierto)
 * Marca como leídos los que le mandó el otro. Si no viene despuesDe, también trae
 * los datos del otro y las citas/solicitudes que tienen entre los dos.
 */
async function conseguirChat(id, otroid, despuesDe = null) {
    id = Number(id);
    otroid = Number(otroid);
    await asegurarResenasYMensajes();
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    try{
        await client.connect();
        const mensajes = await client.query(`
            SELECT * FROM mensajes
            WHERE ((emisorid = $1 AND receptorid = $2) OR (emisorid = $2 AND receptorid = $1))
              AND ($3::int IS NULL OR id > $3::int)
            ORDER BY id`, [id, otroid, despuesDe]);
        await client.query(
            "UPDATE mensajes SET leido = true WHERE emisorid = $2 AND receptorid = $1 AND leido IS NOT TRUE",
            [id, otroid]);
        if(despuesDe) {
            return { mensajes: mensajes.rows };
        }
        const otro = await client.query(
            "SELECT id, nombre_completo, foto_perfil, localidad, puntuacion_trabajador, puntuacion_contratador FROM usuarios WHERE id = $1",
            [otroid]);
        const citas = await client.query(`
            SELECT s.id, s.solicitud, s.periodo, s.estado, s.dirigida, a.aptitud,
                CASE WHEN s.trabajadorid = $1 THEN 'trabajador' ELSE 'contratador' END AS mi_rol
            FROM solicitudes s
            LEFT JOIN aptitudes a ON a.id = s.aptitudid
            WHERE s.trabajadorid IS NOT NULL
              AND ((s.contratadorid = $1 AND s.trabajadorid = $2) OR (s.contratadorid = $2 AND s.trabajadorid = $1))
            ORDER BY s.id DESC
            LIMIT 5`, [id, otroid]);
        const permiso = await client.query(`SELECT (${await puedenHablar()}) AS puede`, [id, otroid]);
        // Bloqueos: "yoBloquee" para mostrar "Desbloquear"; si hay bloqueo (de cualquiera) no se puede escribir
        let yoBloquee = false, bloqueado = false, otroActivo = true;
        if(cuentasListas) {
            const b = await client.query(`
                SELECT EXISTS (SELECT 1 FROM bloqueos WHERE bloqueadorid = $1 AND bloqueadoid = $2) AS yo,
                    ${hayBloqueo("$1::int", "$2::int")} AS alguno,
                    (SELECT ${cuentaActiva("u")} FROM usuarios u WHERE u.id = $2::int) AS activa`, [id, otroid]);
            yoBloquee = b.rows[0].yo;
            bloqueado = b.rows[0].alguno;
            otroActivo = b.rows[0].activa !== false;
        }
        return {
            mensajes: mensajes.rows,
            otro: otro.rows[0] || null,
            citas: citas.rows,
            puedeEscribir: permiso.rows[0].puede && !bloqueado && otroActivo,
            yoBloquee,
            bloqueado,
        };
    }finally{
        await client.end();
    }
}

/**
 * Conversaciones del usuario, la más reciente primero, con el último mensaje
 * y cuántos no leyó. (Sigue devolviendo id, nombre_completo y foto_perfil como antes.)
 */
async function misChats(id) {
    id = Number(id);
    await asegurarResenasYMensajes();
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            WITH mios AS (
                SELECT m.*, CASE WHEN m.emisorid = $1 THEN m.receptorid ELSE m.emisorid END AS otro
                FROM mensajes m
                WHERE m.emisorid = $1 OR m.receptorid = $1
            ), ultimos AS (
                SELECT DISTINCT ON (otro) otro, id, contenido, imagen, fecha, emisorid
                FROM mios
                ORDER BY otro, id DESC
            )
            SELECT u.id, u.nombre_completo, u.foto_perfil,
                ul.id AS ultimo_id, ul.contenido AS ultimo_mensaje, (ul.imagen IS NOT NULL) AS ultimo_es_imagen,
                ul.fecha AS ultima_fecha, ul.emisorid AS ultimo_emisorid,
                (SELECT count(*)::int FROM mensajes x
                 WHERE x.emisorid = u.id AND x.receptorid = $1 AND x.leido IS NOT TRUE) AS no_leidos
            FROM ultimos ul
            INNER JOIN usuarios u ON u.id = ul.otro
            ORDER BY ul.id DESC`, [id]);
        return result.rows;
    }finally{
        await client.end();
    }
}

/**
 * Personas con las que el usuario tiene (o tuvo) una cita o solicitud: con ellas puede empezar un chat.
 */
async function contactos(id) {
    id = Number(id);
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT * FROM (
                SELECT DISTINCT ON (o.id) o.id, o.nombre_completo, o.foto_perfil,
                    s.id AS solicitudid, s.solicitud, s.periodo, s.estado, s.dirigida, a.aptitud,
                    CASE WHEN s.trabajadorid = $1 THEN 'trabajador' ELSE 'contratador' END AS mi_rol
                FROM solicitudes s
                INNER JOIN usuarios o ON o.id = CASE WHEN s.trabajadorid = $1 THEN s.contratadorid ELSE s.trabajadorid END
                LEFT JOIN aptitudes a ON a.id = s.aptitudid
                WHERE (s.contratadorid = $1 OR s.trabajadorid = $1) AND s.trabajadorid IS NOT NULL
                ORDER BY o.id, (s.estado = 'pendiente') DESC, s.id DESC
            ) c
            ORDER BY c.solicitudid DESC`, [id]);
        return result.rows;
    }finally{
        await client.end();
    }
}

// Cantidad de mensajes sin leer (para el globito de la barra)
async function noLeidos(id) {
    await asegurarResenasYMensajes();
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(
            "SELECT count(*)::int AS cantidad FROM mensajes WHERE receptorid = $1 AND leido IS NOT TRUE", [id]);
        return result.rows[0].cantidad;
    }finally{
        await client.end();
    }
}

const MensajesService ={
    mandarMensaje,
    borrarMensaje,
    conseguirChat,
    misChats,
    contactos,
    noLeidos
}
export default MensajesService
