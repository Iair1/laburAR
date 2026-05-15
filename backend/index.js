import express from 'express';
import cors from 'cors';
import "dotenv/config";

import UsuariosRouter from "./routers/usuarios.router.js"
/*
import AptitudesRouter from "./routers/aptitudes.router.js"
import TdrRouter from "./routers/tdr.router.js"
import HistorialRouter from "./routers/historial.router.js"
import MensajesRouter from "./routers/mensajes.router.js"
import SolicitudesRouter from "./routers/solicitudes.router.js"
import AplicacionesRouter from "./routers/aplicaciones.router.js"
import TrabajosRouter from "./routers/trabajos.router.js"
*/

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (__, res) => res.send("Bienvenido a laburAR"));

app.get("/usuarios", UsuariosRouter);
/*
app.use("/aptitudes", AptitudesRouter);
app.use("/tdr", TdrRouter);
app.use("/historial", HistorialRouter);
app.use("/mensajes", MensajesRouter);
app.use("/solicitudes", SolicitudesRouter);
app.use("/aplicaciones", AplicacionesRouter);
app.use("/trabajos", TrabajosRouter);
*/


/*
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
*/

export default app;
