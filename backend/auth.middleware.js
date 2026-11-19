import jwt from "jsonwebtoken";
import config from "./dbconfig.js";
import pkg from "pg";
import { asegurarCuentas } from "./esquema.js";
const {Client} = pkg;

if (!process.env.JWT_SECRET) {
    console.warn("⚠️  Falta la variable JWT_SECRET: se está usando una clave de prueba. Cargala en Vercel antes de salir al público.");
}

// Estado de cada cuenta (activa / suspendida / eliminada). Se guarda 30 segundos
// para no consultar la base en cada pedido.
const DURACION_CACHE_MS = 30 * 1000;
const estados = new Map();

async function estadoCuenta(id) {
    const guardado = estados.get(id);
    if (guardado && guardado.hasta > Date.now()) return guardado.estado;
    let estado = "activa";
    try {
        if (await asegurarCuentas()) {
            const client = new Client(config);
            try {
                await client.connect();
                const result = await client.query("SELECT suspendido, eliminado FROM usuarios WHERE id = $1", [id]);
                const usuario = result.rows[0];
                estado = !usuario || usuario.eliminado ? "eliminada" : usuario.suspendido ? "suspendida" : "activa";
            } finally {
                await client.end().catch(() => {});
            }
        }
    } catch (error) {
        // Si la base falla, se deja pasar como antes (el pedido mismo va a dar el error)
        console.error("No se pudo revisar el estado de la cuenta:", error.message);
        return "activa";
    }
    if (estados.size > 5000) estados.clear();
    estados.set(id, { estado, hasta: Date.now() + DURACION_CACHE_MS });
    return estado;
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
        if(decoded === undefined || decoded.userid === undefined){
            return res.status(401).json({ message: "No se pudo verificar el token" });
        }
        req.id = decoded.userid;
    } catch (error) {
        return res.status(401).json({ message: "Tu sesión venció. Volvé a iniciar sesión.", error: error.message });
    }
    const estado = await estadoCuenta(Number(req.id));
    if (estado === "suspendida") {
        return res.status(403).json({ message: "Tu cuenta está suspendida. Si creés que es un error, escribinos.", suspendida: true });
    }
    if (estado === "eliminada") {
        return res.status(401).json({ message: "Esta cuenta ya no existe." });
    }
    next();
};

export {verifyToken}
