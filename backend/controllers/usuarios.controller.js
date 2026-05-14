import UsuariosService from "../services/usuarios.service.js";

const prueba = async(req, res)=>{
    try{
        const result = await UsuariosService.prueba();
        res.status(201).json({ message: "Prueba pasada exitosamente"});
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}


const UsuariosController={
    prueba
}
export default UsuariosController;