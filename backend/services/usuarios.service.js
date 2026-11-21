import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
import crypto from "crypto";
import { asegurarColumnasServicio, asegurarCuentas, asegurarNotificaciones } from "../esquema.js";
import { notificar, tituloDeSolicitud } from "../notificaciones.js";
import { enviarEmail, escaparHTML } from "../email.js";
import { verificarCredencialGoogle } from "../google.js";
import { hayBloqueo, cuentaActiva, errorConEstado } from "../moderacion.js";
import { olvidarEstadoCuenta } from "../auth.middleware.js";
const {Client} = pkg;


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function cambiarContraseña(id, contraseñaVieja, contraseñaNueva) {
    const client = new Client(config);
    await client.connect();
    try{
        const user = await client.query("SELECT * FROM usuarios WHERE id = $1", [id]);
        if (user.rowCount === 0) {
            throw new Error("Usuario no encontrado");
        }
        const dbUser = user.rows[0];
        const contraCorrecta = await bcrypt.compare(contraseñaVieja, dbUser.contraseña);
        if (!contraCorrecta) {
            throw new Error("Contraseña invalida");
        }
        const hasheada = await bcrypt.hash(contraseñaNueva, 11);
        const result = await client.query("UPDATE usuarios SET contraseña = $1 WHERE id = $2", [hasheada, id]);
        return result;
    } catch(error){
        console.error("Error al cambiar contraseña:", error);
        throw error;
    } finally{
        await client.end();
    }
}

cloudinary.config({
    cloud_name: 'dntg1hezf',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Antes el front mandaba los textos ya entre comillas simples ('CABA') porque
// el valor se pegaba directo en el SQL. Ahora va como parámetro ($2, $3...),
// así que si llega en ese formato viejo le sacamos las comillas.
function sacarComillasViejas(valor) {
    if (typeof valor === "string" && valor.length >= 2 && valor.startsWith("'") && valor.endsWith("'")) {
        return valor.slice(1, -1).replace(/''/g, "'");
    }
    return valor;
}

async function cambiarDato(id, inf) {
    const client = new Client(config);
    await client.connect();
    try{
        // Los nombres de columna ya vienen validados por el controller (lista "allowed"),
        // y los valores van como parámetros para evitar inyección SQL.
        const columnas = [];
        const valores = [id];
        if (inf.some((item) => item.dato === "email" || item.dato === "telefono")) {
            if (!(await asegurarCuentas())) {
                throw errorConEstado("No se pudo guardar. Probá de nuevo en un rato.", 503);
            }
        }
        for(let i = 0; i < inf.length; i++){
            let valor = sacarComillasViejas(inf[i].valor);
            if(inf[i].dato === "email"){
                valor = await validarEmailLibre(client, valor, id);
            }
            if(inf[i].dato === "telefono"){
                valor = limpiarTelefono(valor);
            }
            if(inf[i].dato==="foto_perfil"){
                valor = await subirImagen(valor);
            }
            valores.push(valor);
            columnas.push(`${inf[i].dato} = $${valores.length}`);
        }
        const result = await client.query(
            `UPDATE usuarios SET ${columnas.join(", ")} WHERE id = $1 RETURNING id, nombre_completo, foto_perfil`,
            valores
        );
        return result.rows[0];
    } catch(error){
        console.error("Error al cambiar dato:", error);
        throw error;
    } finally{
        await client.end();
    }
}

async function subirImagen(imagen) {
    if(!imagen) return null;
    const result = await cloudinary.uploader.upload(imagen);
    // Ojo: Cloudinary devuelve "public_id" (antes se leía "publicid", que no
    // existe, y por eso la foto se guardaba como NULL en la base).
    // crop "fill" + gravity "face" recorta un cuadrado centrado en la cara sin deformarla.
    const url = cloudinary.url(result.public_id, {
        secure: true,
        version: result.version,
        transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" }
        ]
    });
    return url;
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Valida el email y que no lo use otra cuenta. Devuelve el email en minúsculas.
async function validarEmailLibre(client, email, idPropio = null) {
    const limpio = String(email || "").trim().toLowerCase();
    if (!EMAIL_VALIDO.test(limpio) || limpio.length > 254) {
        throw errorConEstado("Ese email no es válido.", 400);
    }
    const usado = await client.query(
        "SELECT 1 FROM usuarios WHERE lower(email) = $1 AND eliminado IS NOT TRUE AND ($2::int IS NULL OR id <> $2::int)",
        [limpio, idPropio]);
    if (usado.rowCount > 0) {
        throw errorConEstado("Ya hay una cuenta con ese email.", 409);
    }
    return limpio;
}

function limpiarTelefono(telefono) {
    const limpio = String(telefono ?? "").replace(/[^\d+\s()-]/g, "").trim().slice(0, 30);
    return limpio || null;
}

/**
 * Crea la cuenta. `extra` puede traer { email, telefono, googleCredential }.
 * Con googleCredential (registro con Google) el email sale de Google y no hace falta contraseña.
 */
const crearCuenta = async (nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil, disponibilidad, sobre_mi, cobro_por_hora, extra = {}) => {
    let { email, telefono, googleCredential } = extra;
    let fotoGoogle = null;
    if (googleCredential) {
        const google = await verificarCredencialGoogle(googleCredential);
        email = google.email;
        fotoGoogle = google.foto;
        contraseña = crypto.randomBytes(24).toString("hex"); // entra siempre con Google
    }
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    try {
        await client.connect();
        if (email) {
            if (!cuentasListas) {
                throw errorConEstado("No se pudo crear la cuenta. Probá de nuevo en un rato.", 503);
            }
            email = await validarEmailLibre(client, email);
        }
        const hasheada = await bcrypt.hash(contraseña, 11);
        const fpurl = foto_perfil ? await subirImagen(foto_perfil) : fotoGoogle;
        const result = await client.query(
            "INSERT INTO usuarios (nombre_completo, contraseña, localidad, direccion_calle, direccion_altura, codigo_postal, dni, foto_perfil, disponibilidad, sobre_mi, cobro_por_hora) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, nombre_completo, dni, foto_perfil",
            [nombre_completo, hasheada, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, fpurl, disponibilidad, sobre_mi, cobro_por_hora]
        );
        const usuario = result.rows[0];
        if (cuentasListas && (email || telefono)) {
            await client.query("UPDATE usuarios SET email = $2, telefono = $3 WHERE id = $1",
                [usuario.id, email || null, limpiarTelefono(telefono)]);
        }
        return { ...usuario, email: email || null };
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

const MAXIMO_INTENTOS_LOGIN = 5;

// Las últimas 60 notificaciones del usuario (de la más vieja a la más nueva), con la foto y el
// nombre de la otra persona cuando la notificación es del formato nuevo (con título).
async function leerNotificaciones(client, id) {
    if (!(await asegurarNotificaciones())) {
        const result = await client.query("SELECT * FROM notificaciones WHERE userid = $1", [id]);
        return result.rows;
    }
    const result = await client.query(`
        SELECT * FROM (
            SELECT n.*,
                CASE WHEN n.titulo IS NOT NULL THEN o.foto_perfil END AS otro_foto,
                CASE WHEN n.titulo IS NOT NULL THEN o.nombre_completo END AS otro_nombre
            FROM notificaciones n
            LEFT JOIN usuarios o ON o.id = n.otroid
            WHERE n.userid = $1
            ORDER BY n.id DESC
            LIMIT 60
        ) ultimas
        ORDER BY id`, [id]);
    return result.rows;
}

// Arma la respuesta de un inicio de sesión correcto: token (7 días), notificaciones y datos públicos
async function emitirSesion(client, dbUser) {
    if (dbUser.suspendido) {
        throw errorConEstado(`Tu cuenta está suspendida${dbUser.motivo_suspension ? ` (${dbUser.motivo_suspension})` : ""}. Si creés que es un error, escribinos.`, 403);
    }
    const token = jwt.sign(
        { userid: dbUser.id, nombre_completo: dbUser.nombre_completo},
        JWT_SECRET,
        { expiresIn: "7d" }
    );
    const notificaciones = await leerNotificaciones(client, dbUser.id).catch(() => []);
    // Datos públicos del usuario para que el front muestre su nombre y foto
    const usuario = {
        id: dbUser.id,
        nombre_completo: dbUser.nombre_completo,
        foto_perfil: dbUser.foto_perfil,
        email: dbUser.email || null,
        es_admin: dbUser.es_admin === true,
    };
    return {token, notificaciones, usuario};
}

/**
 * Inicia sesión con el email o con el nombre completo (como antes).
 * Si hay varias cuentas con el mismo nombre, entra a la que tenga esa contraseña.
 * Después de 5 intentos fallidos seguidos hay que esperar 15 minutos.
 */
const iniciarSesion = async (identificador, contraseña) => {
    const cuentasListas = await asegurarCuentas();
    const texto = String(identificador).trim();
    const clave = texto.toLowerCase();
    const client = new Client(config);
    try {
        await client.connect();
        if (cuentasListas) {
            const intentos = await client.query(
                "SELECT count(*)::int AS cantidad FROM intentos_login WHERE clave = $1 AND fecha > now() - interval '15 minutes'", [clave]);
            if (intentos.rows[0].cantidad >= MAXIMO_INTENTOS_LOGIN) {
                throw errorConEstado("Demasiados intentos fallidos. Esperá 15 minutos o recuperá tu contraseña.", 429);
            }
        }
        const result = cuentasListas && texto.includes("@")
            ? await client.query("SELECT * FROM usuarios WHERE lower(email) = $1 AND eliminado IS NOT TRUE", [clave])
            : await client.query(
                `SELECT * FROM usuarios WHERE nombre_completo = $1 ${cuentasListas ? "AND eliminado IS NOT TRUE" : ""} ORDER BY id`, [texto]);
        let dbUser = null;
        for (const fila of result.rows) {
            const correcta = await bcrypt.compare(String(contraseña), fila.contraseña || "").catch(() => false);
            if (correcta) {
                dbUser = fila;
                break;
            }
        }
        if (!dbUser) {
            if (cuentasListas) {
                await client.query("INSERT INTO intentos_login (clave) VALUES ($1)", [clave]);
            }
            throw errorConEstado("El email/usuario o la contraseña no son correctos.", 401);
        }
        const sesion = await emitirSesion(client, dbUser);
        if (cuentasListas) {
            await client.query("DELETE FROM intentos_login WHERE clave = $1", [clave]);
        }
        return sesion;
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Inicia sesión con Google. Si no hay una cuenta con ese email, responde 404 con los
 * datos de Google para que el front ofrezca registrarse.
 */
const iniciarSesionGoogle = async (credential) => {
    const google = await verificarCredencialGoogle(credential);
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo iniciar sesión. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(
            "SELECT * FROM usuarios WHERE lower(email) = $1 AND eliminado IS NOT TRUE ORDER BY id LIMIT 1", [google.email]);
        if (result.rowCount === 0) {
            const error = errorConEstado("Todavía no tenés una cuenta con ese email. Completá tus datos para registrarte.", 404);
            error.datos = { registrarse: true, perfil: { email: google.email, nombre: google.nombre, foto: google.foto } };
            throw error;
        }
        return await emitirSesion(client, result.rows[0]);
    } finally {
        await client.end();
    }
}

/**
 * "Olvidé mi contraseña": manda un código de 6 números al email (vence en 15 minutos).
 * Responde igual exista o no la cuenta, para no revelar qué emails están registrados.
 */
const recuperarContraseña = async (email) => {
    const limpio = String(email || "").trim().toLowerCase();
    if (!EMAIL_VALIDO.test(limpio)) {
        throw errorConEstado("Ese email no es válido.", 400);
    }
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo procesar el pedido. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        const result = await client.query(
            "SELECT id, nombre_completo FROM usuarios WHERE lower(email) = $1 AND eliminado IS NOT TRUE ORDER BY id LIMIT 1", [limpio]);
        const usuario = result.rows[0];
        if (!usuario) return;
        // Como mucho 3 códigos por hora
        const recientes = await client.query(
            "SELECT count(*)::int AS cantidad FROM recuperaciones WHERE userid = $1 AND fecha > now() - interval '1 hour'", [usuario.id]);
        if (recientes.rows[0].cantidad >= 3) return;
        const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
        const hasheado = await bcrypt.hash(codigo, 8);
        await client.query(
            "INSERT INTO recuperaciones (userid, codigo, vence) VALUES ($1, $2, now() + interval '15 minutes')", [usuario.id, hasheado]);
        const nombre = String(usuario.nombre_completo || "").split(" ")[0];
        await enviarEmail({
            para: limpio,
            asunto: `${codigo} es tu código para recuperar la contraseña de LaburAR`,
            texto: `Hola ${nombre}:\n\nTu código para crear una contraseña nueva es ${codigo}.\nVence en 15 minutos.\n\nSi no lo pediste vos, ignorá este email: tu contraseña no cambia.\n\nLaburAR`,
            html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#222">
                <h2 style="color:#570101">LaburAR</h2>
                <p>Hola ${escaparHTML(nombre)}:</p>
                <p>Tu código para crear una contraseña nueva es:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${codigo}</p>
                <p>Vence en 15 minutos.</p>
                <p style="color:#777;font-size:13px">Si no lo pediste vos, ignorá este email: tu contraseña no cambia.</p>
            </div>`,
        });
    } finally {
        await client.end();
    }
}

/** Cambia la contraseña con el código que llegó por email. */
const restablecerContraseña = async (email, codigo, contraseñaNueva) => {
    const limpio = String(email || "").trim().toLowerCase();
    if (String(contraseñaNueva || "").length < 6) {
        throw errorConEstado("La contraseña nueva tiene que tener al menos 6 caracteres.", 400);
    }
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo procesar el pedido. Probá de nuevo en un rato.", 503);
    }
    const invalido = () => errorConEstado("El código no es correcto o ya venció. Pedí uno nuevo.", 400);
    const client = new Client(config);
    try {
        await client.connect();
        const usuario = (await client.query(
            "SELECT id, nombre_completo FROM usuarios WHERE lower(email) = $1 AND eliminado IS NOT TRUE ORDER BY id LIMIT 1", [limpio])).rows[0];
        if (!usuario) throw invalido();
        const pedido = (await client.query(`
            SELECT * FROM recuperaciones
            WHERE userid = $1 AND usado = false AND vence > now()
            ORDER BY id DESC LIMIT 1`, [usuario.id])).rows[0];
        if (!pedido || pedido.intentos >= 5) throw invalido();
        const correcto = await bcrypt.compare(String(codigo || "").trim(), pedido.codigo);
        if (!correcto) {
            await client.query("UPDATE recuperaciones SET intentos = intentos + 1 WHERE id = $1", [pedido.id]);
            throw invalido();
        }
        const hasheada = await bcrypt.hash(String(contraseñaNueva), 11);
        await client.query("UPDATE usuarios SET contraseña = $2 WHERE id = $1", [usuario.id, hasheada]);
        await client.query("UPDATE recuperaciones SET usado = true WHERE userid = $1", [usuario.id]);
        await client.query("DELETE FROM intentos_login WHERE clave = ANY($1)", [[limpio, String(usuario.nombre_completo || "").toLowerCase()]]);
    } finally {
        await client.end();
    }
}

/**
 * Elimina la cuenta: borra los datos personales, saca sus servicios, fotos y problemas
 * abiertos, y cancela sus citas pendientes (avisándole a la otra persona). Los mensajes y
 * reseñas quedan para la otra persona, a nombre de "Usuario eliminado".
 */
const eliminarCuenta = async (id) => {
    id = Number(id);
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo eliminar la cuenta. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        const actual = (await client.query("SELECT dni_foto, nombre_completo FROM usuarios WHERE id = $1", [id])).rows[0];
        if (!actual) throw errorConEstado("Usuario no encontrado", 404);

        // Cada dato personal se borra (NULL) o, si la columna no lo permite, queda vacío
        const columnas = (await client.query(`
            SELECT column_name, data_type, is_nullable FROM information_schema.columns
            WHERE table_name = 'usuarios' AND table_schema = ANY (current_schemas(false))`)).rows;
        const PERSONALES = ["email", "telefono", "foto_perfil", "dni", "dni_foto", "direccion_calle", "direccion_altura",
            "codigo_postal", "sobre_mi", "disponibilidad", "motivo_suspension"];
        const cambios = [`nombre_completo = 'Usuario eliminado'`, `eliminado = true`, `verificado = false`, `dni_estado = NULL`];
        for (const c of columnas.filter((c) => PERSONALES.includes(c.column_name))) {
            const vacio = c.is_nullable === "YES" ? "NULL"
                : ["text", "character varying", "character"].includes(c.data_type) ? "''"
                : ["integer", "bigint", "smallint", "numeric", "real", "double precision"].includes(c.data_type) ? "0"
                : null;
            if (vacio) cambios.push(`"${c.column_name}" = ${vacio}`);
        }
        const contraseñaImposible = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 8);
        await client.query(`UPDATE usuarios SET ${cambios.join(", ")}, contraseña = $2 WHERE id = $1`, [id, contraseñaImposible]);

        // Citas pendientes: se cancelan y se le avisa a la otra persona
        const citas = await client.query(`
            UPDATE solicitudes SET estado = 'cancelado'
            WHERE estado = 'pendiente' AND (contratadorid = $1 OR trabajadorid = $1)
            RETURNING id, solicitud, contratadorid, trabajadorid, dirigida`, [id]).catch(() => ({ rows: [] }));
        for (const cita of citas.rows) {
            const otro = cita.contratadorid === id ? cita.trabajadorid : cita.contratadorid;
            if (!otro) continue;
            const eraElCliente = cita.contratadorid === id;
            await notificar(client, {
                userid: otro,
                tipo: "trabajo-cancelado",
                titulo: "Se canceló una cita",
                contenido: `«${tituloDeSolicitud(cita.solicitud)}» · La otra persona eliminó su cuenta`,
                enlace: eraElCliente
                    ? (cita.dirigida === false ? "/problemas?vista=citas" : "/trabajos-pendientes")
                    : (cita.dirigida === false ? "/mis-problemas?vista=historial" : "/mis-pedidos"),
                solicitudid: cita.id,
            });
        }
        // Lo que ya no tiene sentido que quede publicado (si alguna tabla no existe, se sigue)
        const borrar = [
            ["DELETE FROM solicitudes WHERE contratadorid = $1 AND estado = 'por revisar'"],
            ["UPDATE solicitudes SET trabajadorid = NULL WHERE trabajadorid = $1 AND estado = 'por revisar' AND dirigida = false"],
            ["DELETE FROM usuarios_aptitudes_especificas WHERE userid = $1"],
            ["DELETE FROM usuarios_aptitudes WHERE userid = $1"],
            ["DELETE FROM usuarios_tdr WHERE userid = $1"],
            ["DELETE FROM imagenes_trabajos WHERE userid = $1"],
            ["DELETE FROM historial_busqueda WHERE userid = $1"],
            ["DELETE FROM notificaciones WHERE userid = $1"],
            ["DELETE FROM bloqueos WHERE bloqueadorid = $1"],
            ["DELETE FROM recuperaciones WHERE userid = $1"],
            // Propuestas de precio abiertas (como trabajador o como cliente): se cierran
            ["UPDATE ofertas SET estado = 'cerrada', actualizada = now() WHERE estado = 'pendiente' AND (trabajadorid = $1 OR contratadorid = $1)"],
        ];
        for (const [sql] of borrar) {
            await client.query(sql, [id]).catch((error) => console.error("Aviso al eliminar cuenta:", error.message));
        }
        // Solicitudes dirigidas a esta persona que nadie respondió: se borran y se avisa
        const dirigidas = await client.query(
            "DELETE FROM solicitudes WHERE trabajadorid = $1 AND estado = 'por revisar' RETURNING contratadorid, solicitud", [id])
            .catch(() => ({ rows: [] }));
        for (const s of dirigidas.rows) {
            await notificar(client, {
                userid: s.contratadorid,
                tipo: "solicitud-rechazada",
                titulo: "Se cerró una solicitud tuya",
                contenido: `«${tituloDeSolicitud(s.solicitud)}» · El trabajador eliminó su cuenta`,
                enlace: "/buscar",
            });
        }
        if (actual.dni_foto) {
            cloudinary.uploader.destroy(actual.dni_foto, { type: "authenticated", invalidate: true })
                .catch((error) => console.error("No se pudo borrar la foto del DNI:", error.message));
        }
        olvidarEstadoCuenta(id);
        return { eliminado: true };
    } finally {
        await client.end();
    }
}

/**
 * Guarda la foto del DNI de forma PRIVADA (no queda un link público): solo un
 * administrador la puede ver, con un link que vence. Queda "pendiente" de verificación.
 */
const subirDni = async (id, imagen) => {
    if (typeof imagen !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(imagen)) {
        throw errorConEstado("Mandá una foto del DNI (JPG, PNG o WEBP).", 400);
    }
    if (!(await asegurarCuentas())) {
        throw errorConEstado("No se pudo guardar el DNI. Probá de nuevo en un rato.", 503);
    }
    const client = new Client(config);
    try {
        await client.connect();
        const anterior = (await client.query("SELECT dni_foto FROM usuarios WHERE id = $1", [id])).rows[0];
        const subida = await cloudinary.uploader.upload(imagen, { type: "authenticated", folder: "dni", format: "jpg" });
        await client.query(
            "UPDATE usuarios SET dni_foto = $2, dni_estado = 'pendiente', verificado = false WHERE id = $1", [id, subida.public_id]);
        if (anterior?.dni_foto && anterior.dni_foto !== subida.public_id) {
            cloudinary.uploader.destroy(anterior.dni_foto, { type: "authenticated", invalidate: true }).catch(() => {});
        }
        return { dni_estado: "pendiente" };
    } finally {
        await client.end();
    }
}

const buscarTrabajadores = async(id, zonas)=>{
    const columnasServicio = await asegurarColumnasServicio();
    const cuentasListas = await asegurarCuentas();
    // Cada servicio con su precio/descripción/experiencia. Los servicios viejos que no
    // tienen datos propios usan el precio y el "sobre mí" del usuario.
    // Se comparan como texto (::text) para que funcione sea cual sea el tipo de
    // usuarios.cobro_por_hora; el front los convierte a número.
    const servicios = columnasServicio
        ? `COALESCE(JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
                'aptitudid', a.id,
                'aptitud', a.aptitud,
                'cobro_por_hora', COALESCE(ua.cobro_por_hora::text, NULLIF(u.cobro_por_hora::text, '')),
                'descripcion', COALESCE(ua.descripcion, u.sobre_mi::text),
                'anios_experiencia', ua.anios_experiencia
            )) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb) AS servicios,`
        : "";
    const client = new Client(config);
    console.log(zonas)
    try{
        await client.connect();
        const result = await client.query(`
            SELECT u.id, u.nombre_completo,  u.localidad, u.foto_perfil, u.puntuacion_trabajador, u.sobre_mi, u.disponibilidad, u.cobro_por_hora,
            ${cuentasListas ? "COALESCE(u.verificado, false) AS verificado," : ""}

            ${servicios}

            ARRAY_AGG(DISTINCT a.aptitud)
                FILTER (WHERE a.aptitud IS NOT NULL) AS aptitudes,

            ARRAY_AGG(DISTINCT ae.aptitud_especifica)
                FILTER (WHERE ae.aptitud_especifica IS NOT NULL) AS aptitudes_especificas,

            ARRAY_AGG(DISTINCT t.trabajo)
                FILTER (WHERE t.trabajo IS NOT NULL) AS trabajos

        FROM usuarios u

        INNER JOIN usuarios_aptitudes ua
            ON ua.userid = u.id
        INNER JOIN aptitudes a
            ON a.id = ua.aptitudid

        LEFT JOIN usuarios_aptitudes_especificas uae
            ON uae.userid = u.id
        LEFT JOIN aptitudes_especificas ae
            ON ae.id = uae.aptitud_especificaid

        LEFT JOIN usuarios_tdr utdr
            ON utdr.userid = u.id
        LEFT JOIN tdr t
            ON t.id = utdr.trabajoid

        WHERE ($1::text[] IS NULL OR cardinality($1::text[]) = 0 OR u.localidad = ANY($1::text[])) AND u.id != $2
            ${cuentasListas ? `AND ${cuentaActiva("u")} AND NOT ${hayBloqueo("u.id", "$2")}` : ""}

        GROUP BY
            u.id, u.nombre_completo,  u.localidad, u.foto_perfil, u.puntuacion_trabajador, u.sobre_mi, u.disponibilidad, u.cobro_por_hora
            ${cuentasListas ? ", u.verificado" : ""}
        ;`, [Array.isArray(zonas) && zonas.length > 0 ? zonas : null, id])
        return result.rows
    }catch(error){
        throw error
    }finally{
        await client.end();
    }
}
/*
const buscarClientes = async(id)=>{
    const client = await Client(config);
    try{
        const result = await client.query(`SELECT s.*,  u.id, u.nombre_completo,  u.localidad, u.foto_perfil, u.puntuacion_contratador
            FROM solicitudes s INNER JOIN usuarios u
            ON s.contratadorid = u.id
            WHERE s.trabajadorid = $1`)
    }
}*/

// Notificaciones del usuario (las mismas que llegan al iniciar sesión), para actualizarlas sin salir
const misNotificaciones = async(id)=>{
    const client = new Client(config);
    try{
        await client.connect();
        return await leerNotificaciones(client, id);
    }finally{
        await client.end();
    }
}

// Marca como leídas las notificaciones del usuario (todas, o solo las de `ids`)
const leerMisNotificaciones = async(id, ids = null)=>{
    if (!(await asegurarNotificaciones())) return 0;
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            UPDATE notificaciones SET leida = true
            WHERE userid = $1 AND leida IS NOT TRUE ${ids ? "AND id = ANY($2::int[])" : ""}`,
            ids ? [id, ids] : [id]);
        return result.rowCount;
    }finally{
        await client.end();
    }
}

// Datos del usuario logueado (para mostrar y editar su perfil)
const miPerfil = async(id)=>{
    const cuentasListas = await asegurarCuentas();
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query(`
            SELECT id, nombre_completo, foto_perfil, localidad, disponibilidad, cobro_por_hora, sobre_mi,
                puntuacion_trabajador, puntuacion_contratador, direccion_calle, direccion_altura, codigo_postal
                ${cuentasListas ? ", email, telefono, COALESCE(es_admin, false) AS es_admin, COALESCE(verificado, false) AS verificado, dni_estado" : ""}
            FROM usuarios WHERE id = $1
        `, [id]);
        if(result.rowCount === 0){
            throw new Error("Usuario no encontrado");
        }
        return result.rows[0];
    }finally{
        await client.end();
    }
}

const UsuariosService={
    crearCuenta, 
    iniciarSesion,
    iniciarSesionGoogle,
    recuperarContraseña,
    restablecerContraseña,
    eliminarCuenta,
    subirDni,
    cambiarDato,
    cambiarContraseña,
    buscarTrabajadores,
    miPerfil,
    misNotificaciones,
    leerMisNotificaciones
}
export default UsuariosService;