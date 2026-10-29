import "dotenv/config";
import express from "express";
import Pusher from "pusher";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const app = express();

app.use(express.json({ limit: "8kb" }));

// Express entrega al navegador los archivos de la carpeta public.
app.use(
  express.static(fileURLToPath(new URL("./public", import.meta.url)))
);

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
  timeout: 5000,
});

// El navegador recibe únicamente la configuración pública.
app.get("/config", (req, res) => {
  res.json({
    key: process.env.PUSHER_KEY,
    cluster: process.env.PUSHER_CLUSTER,
  });
});

app.post("/avisos", async (req, res) => {
  const texto = "ESTOY PROBANDO, PROBANDO, PROBANDO"

  if (
    typeof texto !== "string" ||
    !texto.trim() ||
    texto.length > 500
  ) {
    return res.status(400).json({
      error: "Enviá un texto de entre 1 y 500 caracteres.",
    });
  }

  const aviso = {
    id: randomUUID(),
    texto: texto.trim(),
    fecha: new Date().toISOString(),
  };

  try {
    // Publicamos el aviso para los navegadores suscritos.
    await pusher.trigger("avisos", "nuevo-aviso", aviso);

    // Respondemos a quien hizo el POST.
    res.json({ publicado: true, aviso });
  } catch (error) {
    console.error("Error al publicar en Pusher:", error.message);

    res.status(502).json({
      error: "No se pudo confirmar la publicación.",
    });
  }
});

app.listen(3000, "127.0.0.1", () => {
  console.log("Abrí http://localhost:3000 en dos pestañas.");
});