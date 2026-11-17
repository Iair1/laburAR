import MensajesService from "../services/mensajes.service.js"

const MAXIMO_TEXTO = 2000;

const mandarMensaje = async(req, res)=>{
    const id = req.id
    const{receptor, mensaje, imagen} = req.body
    const texto = typeof mensaje === "string" ? mensaje.trim() : "";
    if(!receptor || (!texto && !imagen)){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    if(texto.length > MAXIMO_TEXTO){
        return res.status(400).json({ message: `El mensaje puede tener hasta ${MAXIMO_TEXTO} caracteres`});
    }
    if(imagen && (typeof imagen !== "string" || !imagen.startsWith("data:image/"))){
        return res.status(400).json({ message: "La foto no es válida"});
    }
    try{
        const result = await MensajesService.mandarMensaje(id, receptor, texto, imagen || null)
        res.status(201).json({message: "Mensaje exitoso", result})
    } catch(error){
        res.status(error.status || 500).json({message: error.message})
    }
}

const borrarMensaje = async(req, res)=>{
    const id = req.id
    const{mensaje} = req.body
    if(!mensaje){
        return res.status(400).json({message: "Debe completar todos los campos"});
    }
    try{
        const result = await MensajesService.borrarMensaje(id, mensaje)
        res.status(201).json({message: "Mensaje borrado exitosamente", result})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

// body: { otroid, despuesDe? } → result: mensajes (del más viejo al más nuevo)
// Sin despuesDe también devuelve otro (sus datos), citas (las que tienen entre los dos) y puedeEscribir
const conseguirChat = async(req, res)=>{
    const id = req.id
    const{otroid, despuesDe} = req.body
    if(!otroid){
        return res.status(400).json({message: "Debe completar todos los campos"});
    }
    try{
        const datos = await MensajesService.conseguirChat(id, otroid, despuesDe ? Number(despuesDe) : null)
        res.status(201).json({message: "Mensajes encontrados exitosamente", result: datos.mensajes, otro: datos.otro, citas: datos.citas, puedeEscribir: datos.puedeEscribir, userid: id})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

const misChats = async(req, res)=>{
    const id = req.id
    try{
        const result = await MensajesService.misChats(id)
        res.status(201).json({message: "Chats encontrados exitosamente", result})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

// Personas con las que se puede empezar un chat (tienen una cita o solicitud en común)
const contactos = async(req, res)=>{
    try{
        const result = await MensajesService.contactos(req.id)
        res.status(200).json({message: "Contactos encontrados", result})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

const noLeidos = async(req, res)=>{
    try{
        const cantidad = await MensajesService.noLeidos(req.id)
        res.status(200).json({message: "Mensajes sin leer", cantidad})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

const MensajesController = {
    mandarMensaje,
    borrarMensaje,
    conseguirChat,
    misChats,
    contactos,
    noLeidos
}
export default MensajesController
