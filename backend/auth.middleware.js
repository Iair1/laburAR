import jwt from "jsonwebtoken";
import config from "./dbconfig.js";
import { Client } from "./db.js";
import { asegurarCuentas } from "./esquema.js";
import { EN_PRODUCCION } from "./entorno.js";


// Clave con la que se firman las sesiones. La misma para firmar (al iniciar sesión) y para revisar.
// En producción no hay clave de prueba: sin JWT_SECRET nadie puede iniciar sesión, y nadie puede
// inventarse una sesión firmándola con la clave de prueba. En la compu de desarrollo sí se usa.
export const JWT_SECRET = process.env.JWT_SECRET || (EN_PRODUCCION ? null : "dev_secret");

if (!process.env.JWT_SECRET) {
    if (EN_PRODUCCION) {
        console.error("❌ Falta la variable JWT_SECRET: nadie va a poder iniciar sesión hasta que la cargues en Vercel.");
    } else {
        console.warn("⚠️  Falta la variable JWT_SECRET: en esta compu se usa una clave de prueba. En Vercel es obligatoria.");
    }
}

// Estado de cada cuenta (activa / suspendida / eliminada) y si es administradora.
// Se guarda 30 segundos para no consultar la base en cada pedido.
const DURACION_CACHE_MS = 30 * 1000;
const estados = new Map();

async function estadoCuenta(id) {
    const guardado = estados.get(id);
    if (guardado && guardado.hasta > Date.now()) return guardado;
    let estado = "activa";
    let esAdmin = false;
    try {
        if (await asegurarCuentas()) {
            const client = new Client(config);
            try {
                await client.connect();
                const result = await client.query("SELECT suspendido, eliminado, es_admin FROM usuarios WHERE id = $1", [id]);
                const usuario = result.rows[0];
                estado = !usuario || usuario.eliminado ? "eliminada" : usuario.suspendido ? "suspendida" : "activa";
                esAdmin = usuario?.es_admin === true;
            } finally {
                await client.end().catch(() => {});
            }
        }
    } catch (error) {
        // Si la base falla, se deja pasar como antes (el pedido mismo va a dar el error)
        console.error("No se pudo revisar el estado de la cuenta:", error.message);
        return { estado: "activa", esAdmin: false };
    }
    if (estados.size > 5000) estados.clear();
    const datos = { estado, esAdmin, hasta: Date.now() + DURACION_CACHE_MS };
    estados.set(id, datos);
    return datos;
}

// Para que una suspensión o una cuenta eliminada se note enseguida en este servidor
export function olvidarEstadoCuenta(id) {
    estados.delete(Number(id));
}

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token no proporcionado" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if(decoded === undefined || decoded.userid === undefined){
            return res.status(401).json({ message: "No se pudo verificar el token" });
        }
        req.id = decoded.userid;
    } catch (error) {
        return res.status(401).json({ message: "Tu sesión venció. Volvé a iniciar sesión.", error: error.message });
    }
    const { estado, esAdmin } = await estadoCuenta(Number(req.id));
    req.esAdmin = esAdmin; // los administradores ven el detalle de los errores internos (ver index.js)
    if (estado === "suspendida") {
        return res.status(403).json({ message: "Tu cuenta está suspendida. Si creés que es un error, escribinos.", suspendida: true });
    }
    if (estado === "eliminada") {
        return res.status(401).json({ message: "Esta cuenta ya no existe." });
    }
    next();
};

export {verifyToken}
