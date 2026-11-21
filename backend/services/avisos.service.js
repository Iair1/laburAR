import Pusher from "pusher";
import { randomUUID } from "node:crypto";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
  timeout: 5000,
});

export class AvisoValidationError extends Error {}

export async function publicarAviso(canal, mensaje) {
  if (typeof canal !== "string" || !/^[a-zA-Z0-9_\-=@,.;]+$/.test(canal) || canal.length > 164) {
    throw new AvisoValidationError("Nombre de canal inválido.");
  }
  if (typeof mensaje !== "string" || !mensaje.trim() || mensaje.length > 500) {
    throw new AvisoValidationError("Enviá un mensaje de entre 1 y 500 caracteres.");
  }

  const aviso = {
    id: randomUUID(),
    texto: mensaje.trim(),
    fecha: new Date().toISOString(),
  };

  await pusher.trigger(canal, "nuevo-aviso", aviso);

  return { publicado: true, aviso };
}
