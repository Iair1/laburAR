import {
  AvisoValidationError,
  publicarAviso,
} from "../services/avisos.service.js";

export async function publicarAvisoHttp(req, res) {
  const { canal, mensaje } = req.body ?? {};

  try {
    const resultado = await publicarAviso(canal, mensaje);
    return res.json(resultado);
  } catch (error) {
    if (error instanceof AvisoValidationError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error al publicar en Pusher:", error.message);
    return res.status(502).json({ error: error.message });
  }
}
