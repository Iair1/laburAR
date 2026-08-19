import MensajesService from "../services/mensajes.service.js"
/*
mandarMensaje
conseguirChat
borrarMensaje
conseguirChats*/

const mandarMensaje = async(req, res)=>{
    const{id} = req.id
    const{receptor, mensaje} = req.body
    if(!receptor || !mensaje){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await MensajesService.mandarMensaje(id, receptor, texto)
        res.status(201).json({message: "Mensaje exitoso", result})
    } catch(error){
        res.status(500).json({message: error.message})
    }
}

const borrarMensaje = async(req, res)=>{
    const id = req.id
    const{mensaje} = req.body
    if(!mensaje){
        res.status(400).json({message: "Debe completar todos los campos"});
    }
    try{
        const result = await MensajesService.borrarMensaje(id, mensaje)
        res.status(201).json({message: "Mensaje borrado exitosamente", result})
    }catch(error){
        res.status(500).json({message: error.message})
    }
}

const conseguirChat = async(req, res)=>{
    const id = req.id
    const{otroid} = req.body
    if(!otroid){
        res.status(400).json({message: "Debe completar todos los campos"});
    }
    try{
        const result = await MensajesService.conseguirChat(id, otroid)
        res.status(201).json({message: "Mensaje borrado exitosamente", result, userid: id})
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

const MensajesController = {
    mandarMensaje, 
    borrarMensaje,
    conseguirChat,
    misChats
}
export default MensajesController