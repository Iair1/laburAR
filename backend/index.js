import express from 'express';
import cors from 'cors';
import "dotenv/config";

import UsuariosRouter from "./routers/usuarios.router.js"
import SolicitudesRouter from "./routers/solicitudes.router.js"
import AplicacionesRouter from "./routers/aplicaciones.router.js"
import Usuarios_AptitudesRouter from "./routers/usuarios_aptitudes.router.js"
import Usuarios_Aptitudes_EspecificasRouter from "./routers/usuarios_aptitudes_especificas.router.js"
import AptitudesRouter from "./routers/aptitudes.router.js"
import Aptitudes_EspecificasRouter from "./routers/aptitudes_especificas.router.js"
import MensajesRouter from "./routers/mensajes.router.js"



/*
import AptitudesRouter from "./routers/aptitudes.router.js"
import TdrRouter from "./routers/tdr.router.js"
import HistorialRouter from "./routers/historial.router.js"
import TrabajosRouter from "./routers/trabajos.router.js"
*/

const app = express();
app.use(express.json());
app.use(cors());

app.get("/api", (__, res) => res.send("Bienvenido a laburAR"));


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


app.use("/api/usuarios", UsuariosRouter);
app.use("/api/solicitudes", SolicitudesRouter);
app.use("/api/aplicaciones", AplicacionesRouter);
app.use("/api/usuarios_aptitudes", Usuarios_AptitudesRouter); 
app.use("/api/usuarios_aptitudes_especificas", Usuarios_Aptitudes_EspecificasRouter);
app.use("/api/aptitudes", AptitudesRouter); 
app.use("/api/aptitudes_especificas", Aptitudes_EspecificasRouter);
app.use("/api/mensajes", MensajesRouter);
/*
app.use("/api/aptitudes", AptitudesRouter); 
app.use("/api/tdr", TdrRouter);
app.use("/api/historial", HistorialRouter);
app.use("/api/trabajos", TrabajosRouter);
*/




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


export default app;
