import OfertasService, { PRECIO_MINIMO, PRECIO_MAXIMO } from "../services/ofertas.service.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Devuelve el precio como número entero de pesos, o un mensaje de error
// (acepta 25000, "25000", "25.000" o "$ 25.000"; el punto separa los miles, como se escribe acá)
function leerPrecio(valor) {
    let precio;
    if (typeof valor === "number") {
        precio = valor;
    } else {
        const texto = String(valor ?? "").replace(/[$\s]/g, "");
        if (/^\d+$/.test(texto)) precio = Number(texto);
        else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(texto)) precio = Number(texto.replace(/\./g, "").replace(",", "."));
        else if (/^\d+[.,]\d+$/.test(texto)) precio = Number(texto.replace(",", "."));
        else precio = NaN;
    }
    if (!Number.isFinite(precio)) return { error: "Poné cuánto cobrarías (en pesos)." };
    if (!Number.isInteger(precio)) return { error: "El precio tiene que ser un número entero de pesos." };
    if (precio < PRECIO_MINIMO) return { error: `El precio mínimo es de ${PRECIO_MINIMO} pesos.` };
    if (precio > PRECIO_MAXIMO) return { error: "Ese precio es demasiado alto. Revisalo." };
    return { precio };
}

function leerMensaje(valor) {
    const mensaje = String(valor ?? "").trim();
    if (mensaje.length > 500) return { error: "El mensaje puede tener hasta 500 caracteres." };
    return { mensaje: mensaje || null };
}

const responder = (res, error) => res.status(error.status || 500).json({ message: error.message });

const nueva = async (req, res) => {
    const { solicitudid, dia, hora } = req.body;
    if (!Number.isInteger(Number(solicitudid)) || Number(solicitudid) <= 0) {
        return res.status(400).json({ message: "Falta el problema." });
    }
    if (!FECHA.test(String(dia || ""))) return res.status(400).json({ message: "Elegí qué día irías." });
    if (!HORA.test(String(hora || ""))) return res.status(400).json({ message: "Elegí a qué hora irías." });
    const { precio, error: errorPrecio } = leerPrecio(req.body.precio);
    if (errorPrecio) return res.status(400).json({ message: errorPrecio });
    const { mensaje, error: errorMensaje } = leerMensaje(req.body.mensaje);
    if (errorMensaje) return res.status(400).json({ message: errorMensaje });
    try {
        const result = await OfertasService.nueva(req.id, { solicitudid: Number(solicitudid), dia, hora, precio, mensaje });
        res.status(201).json({ message: "Propuesta enviada", result });
    } catch (error) {
        responder(res, error);
    }
};

const leerOferta = (req, res) => {
    const ofertaid = Number(req.body.ofertaid);
    if (!Number.isInteger(ofertaid) || ofertaid <= 0) {
        res.status(400).json({ message: "Falta la propuesta." });
        return null;
    }
    return ofertaid;
};

const aceptar = async (req, res) => {
    const ofertaid = leerOferta(req, res);
    if (!ofertaid) return;
    try {
        const result = await OfertasService.aceptar(req.id, ofertaid);
        res.status(200).json({ message: "Propuesta aceptada: la cita quedó agendada", result });
    } catch (error) {
        responder(res, error);
    }
};

const contraofertar = async (req, res) => {
    const ofertaid = leerOferta(req, res);
    if (!ofertaid) return;
    const { precio, error: errorPrecio } = leerPrecio(req.body.precio);
    if (errorPrecio) return res.status(400).json({ message: errorPrecio });
    const { mensaje, error: errorMensaje } = leerMensaje(req.body.mensaje);
    if (errorMensaje) return res.status(400).json({ message: errorMensaje });
    try {
        const result = await OfertasService.contraofertar(req.id, ofertaid, precio, mensaje);
        res.status(200).json({ message: "Contraoferta enviada", result });
    } catch (error) {
        responder(res, error);
    }
};

const rechazar = async (req, res) => {
    const ofertaid = leerOferta(req, res);
    if (!ofertaid) return;
    const { mensaje, error: errorMensaje } = leerMensaje(req.body.mensaje);
    if (errorMensaje) return res.status(400).json({ message: errorMensaje });
    try {
        const result = await OfertasService.rechazar(req.id, ofertaid, {
            eliminarPublicacion: req.body.eliminarPublicacion === true,
            mensaje,
        });
        res.status(200).json({
            message: result.publicacionEliminada ? "Propuesta rechazada y publicación eliminada" : "Propuesta rechazada",
            result,
        });
    } catch (error) {
        responder(res, error);
    }
};

const mias = async (req, res) => {
    try {
        res.status(200).json({ message: "Mis propuestas", result: await OfertasService.mias(req.id) });
    } catch (error) {
        responder(res, error);
    }
};

const recibidas = async (req, res) => {
    try {
        res.status(200).json({ message: "Propuestas recibidas", result: await OfertasService.recibidas(req.id) });
    } catch (error) {
        responder(res, error);
    }
};

const OfertasController = { nueva, aceptar, contraofertar, rechazar, mias, recibidas };
export default OfertasController;
