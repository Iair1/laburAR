import express from 'express';
import cors from 'cors';
import "dotenv/config";

//de pusher
import Pusher from "pusher";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
//termnona lo de pusher

import UsuariosRouter from "./routers/usuarios.router.js"
import SolicitudesRouter from "./routers/solicitudes.router.js"
import AplicacionesRouter from "./routers/aplicaciones.router.js"
import Usuarios_AptitudesRouter from "./routers/usuarios_aptitudes.router.js"
import Usuarios_Aptitudes_EspecificasRouter from "./routers/usuarios_aptitudes_especificas.router.js"
import AptitudesRouter from "./routers/aptitudes.router.js"
import Aptitudes_EspecificasRouter from "./routers/aptitudes_especificas.router.js"
import MensajesRouter from "./routers/mensajes.router.js"
import HistorialBusquedaRouter from "./routers/historial_busqueda.router.js"
import HistorialRouter from "./routers/historial.router.js"
import ReseñaRouter from "./routers/reseña.router.js"
import ImagenesTrabajosRouter from "./routers/imagenes_trabajos.router.js"



/*
import AptitudesRouter from "./routers/aptitudes.router.js"
import TdrRouter from "./routers/tdr.router.js"
import TrabajosRouter from "./routers/trabajos.router.js"
*/

const app = express();
// 5mb: las fotos (perfil, DNI) viajan en base64 y el límite por defecto (100kb) no alcanza.
// Vercel igual corta los requests de más de 4.5mb.
app.use(express.json({ limit: "5mb" }));
app.use(cors());

app.get("/api", (__, res) => res.send("Bienvenido a laburAR"));

/*
import PruebaChatService from "./services/pruebaChat.service.js"
const pruebaChat= async(req, res)=>{
    try{
        const {prompt} = req.body
        const result = await PruebaChatService.probar(prompt)
        res.status(201).json({message: "Mensaje exitoso", result})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}
app.post("/api/pruebaChat", pruebaChat)
*/

app.use("/api/usuarios", UsuariosRouter);
app.use("/api/solicitudes", SolicitudesRouter);
app.use("/api/aplicaciones", AplicacionesRouter);
app.use("/api/usuarios_aptitudes", Usuarios_AptitudesRouter);
app.use("/api/aptitudes", AptitudesRouter);  
app.use("/api/usuarios_aptitudes_especificas", Usuarios_Aptitudes_EspecificasRouter);
app.use("/api/aptitudes", AptitudesRouter); 
app.use("/api/aptitudes_especificas", Aptitudes_EspecificasRouter);
app.use("/api/mensajes", MensajesRouter);
app.use("/api/historial_busqueda", HistorialBusquedaRouter);
app.use("/api/historial", HistorialRouter);
app.use("/api/reseñas", ReseñaRouter);
app.use("/api/imagenes_trabajos", ImagenesTrabajosRouter);
/*
app.use("/api/tdr", TdrRouter);
app.use("/api/trabajos", TrabajosRouter);
*/

//aca va lo de pusher
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
//aca termina lo de pusher


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


export default app;
