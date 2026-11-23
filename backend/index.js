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
import HistorialBusquedaRouter from "./routers/historial_busqueda.router.js"
import HistorialRouter from "./routers/historial.router.js"
import ReseñaRouter from "./routers/reseña.router.js"
import ImagenesTrabajosRouter from "./routers/imagenes_trabajos.router.js"
import DenunciasRouter from "./routers/denuncias.router.js"
import BloqueosRouter from "./routers/bloqueos.router.js"
import AdminRouter from "./routers/admin.router.js"
import OfertasRouter from "./routers/ofertas.router.js"
import ErroresRouter from "./routers/errores.router.js"
import { registrarErrorRapido } from "./errores.js"



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

// Los errores internos de la base (nombres de tablas/columnas, conexión, etc.) no se le
// muestran a la gente: se guardan en el log y se responde un mensaje general.
// A los administradores (usuarios.es_admin) sí se les agrega el detalle, para poder arreglarlo.
// Todos los errores 500 se guardan (los ve el administrador en el panel y le llega un aviso por email).
const ERROR_INTERNO = /column|relation|syntax error|malformed|value too long|violates|duplicate key|does not exist|invalid input|null value|operator does not exist|cannot cast|out of range|ECONN|ETIMEDOUT|ENOTFOUND|timeout|SSL|password authentication|too many clients|remaining connection|Connection terminated/i;
app.use((req, res, next) => {
    const json = res.json.bind(res);
    res.json = (cuerpo) => {
        if (res.statusCode >= 500 && cuerpo && typeof cuerpo.message === "string" && !res.errorAnotado) {
            res.errorAnotado = true;
            const original = cuerpo.message;

            /*if (ERROR_INTERNO.test(original)) {
                console.error(`Error interno en ${req.method} ${req.path}:`, original);
                const detalle = req.esAdmin ? ` (Detalle para administradores: ${original})` : "";
                cuerpo = { ...cuerpo, message: `Hubo un problema en el servidor. Probá de nuevo en un rato.${detalle}` };
            }*/
            // Se anota el error (sin demorar la respuesta más de un segundo y medio)
            const final = cuerpo;
            registrarErrorRapido({ origen: "servidor", ruta: req.originalUrl, metodo: req.method, mensaje: original, userid: req.id })
                .finally(() => json(final));
            return res;
        }
        return json(cuerpo);
    };
    next();
});

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
app.use("/api/resenas", ReseñaRouter); // sin ñ: es la que usa el navegador
app.use("/api/imagenes_trabajos", ImagenesTrabajosRouter);
app.use("/api/denuncias", DenunciasRouter);
app.use("/api/ofertas", OfertasRouter);
app.use("/api/bloqueos", BloqueosRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/errores", ErroresRouter);
/*
app.use("/api/tdr", TdrRouter);
app.use("/api/trabajos", TrabajosRouter);
*/




// Lo que no atrapó ninguna ruta: JSON mal armado, fotos demasiado pesadas o errores inesperados
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    if (error?.type === "entity.parse.failed") return res.status(400).json({ message: "Los datos enviados no son válidos" });
    if (error?.type === "entity.too.large") return res.status(413).json({ message: "Es demasiado pesado. Si es una foto, probá con una más chica." });
    console.error(`Error inesperado en ${req.method} ${req.path}:`, error?.message);
    res.status(500).json({ message: error?.message || "Error inesperado" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


export default app;
