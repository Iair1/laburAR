import MensajesService from "../services/mensajes.service.js"
/*
mandarMensaje
conseguirChat
borrarMensaje
conseguirChats*/

const mandarMensaje = async(req, res)=>{
    const{id} = req.id
    const{destinatario, mensaje} = req.body
    if(!destinatario || !mensaje){
        return res.status(400).json({ message: "Debe completar todos los campos"});
    }
    try{
        const result = await MensajesService.mandarMensaje(id, destinatario, texto)
        res.status(201).json({message: "Mensaje exitoso", result})
    } catch(error){
        res.status(500).json({message: error.message})
    }
}