import UsuariosService from "../services/usuarios.service.js";

const cambiarContraseña = async(req, res)=>{
    try{
        const id = req.id;
        const {contraseñaVieja, contraseñaNueva} = req.body;
        if(!contraseñaVieja || !contraseñaNueva){
            return res.status(400).json({ message: "Debe completar todos los campos"});
        }
        const result = await UsuariosService.cambiarContraseña(id, contraseñaVieja, contraseñaNueva);
        res.status(201).json({ message: "Contraseña cambiada exitosamente", result});
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const cambiarDato = async(req, res)=>{
    try{
        const id = req.id;
        const {inf} = req.body;
        if(!inf){
            return res.status(400).json({ message: "Debe completar todos los campos"});
        }
        console.log(inf);
        for(let i = 0; i < inf.length; i++){
            if(inf[i].dato != "nombre_completo" && inf[i].dato != "localidad" && inf[i].dato != "direccion_calle" && inf[i].dato != "direccion_altura" && inf[i].dato != "codigo_postal" && inf[i].dato != "dni" && inf[i].dato != "foto_perfil"){
                return res.status(400).json({ message: "No se puede cambiar, ingrsese un dato válido"});
            }
        }
        const result = await UsuariosService.cambiarDato(id, inf);
        res.status(201).json({ message: "Dato cambiado exitosamente", result});
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const prueba = async(req, res)=>{
    try{
        const result = await UsuariosService.prueba();
        res.status(201).json({ message: "Prueba pasada exitosamente", result});
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const sip = async(req, res)=>{
    try{
        const result = await UsuariosService.sip()
        res.status(201).json({message: "¿Imagen subida exitosamente?", result})
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const crearCuenta = async (req, res) => {
    try{
        const { nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil } = req.body;
        if (!nombre_completo || !contraseña || !localidad || !domicilio_calle || !domicilio_altura || !codigo_postal || !dni) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        const usuario = await UsuariosService.crearCuenta(nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil);
        res.status(201).json({ message: "Cuenta creada exitosamente", usuario });
    }
    catch(error){
        console.error("❌ Error en crearCuenta:", error);
        res.status(500).json({ message: error.message });
    }
}

const iniciarSesion = async (req, res) => {
    try{
        const { nombre_completo, contraseña } = req.body;
        if (!nombre_completo || !contraseña) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        const token = await UsuariosService.iniciarSesion(nombre_completo, contraseña);
        res.status(200).json({ token: token });
    }
    catch(error){
        console.error("❌ Error en iniciarSesion:", error);
        res.status(500).json({ message: error.message });
    }
}


const UsuariosController={
    crearCuenta,
    iniciarSesion,
    cambiarDato,
    cambiarContraseña,
    prueba,
    sip
}
export default UsuariosController; 