import UsuariosService from "../services/usuarios.service.js";

const prueba = async(req, res)=>{
    try{
        const result = await UsuariosService.prueba();
        res.status(201).json({ message: "Prueba pasada exitosamente", result});
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const crearCuenta = async (req, res) => {
    try{
        const { nombre_completo, contraseña, localidad, domicilio, dni, foto_perfil } = req.body;
        if (!nombre_completo || !contraseña || !localidad || !domicilio || !dni) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        const usuario = await UsuariosService.crearCuenta(nombre_completo, contraseña, localidad, domicilio, dni, foto_perfil);
        res.status(201).json({ message: "Cuenta creada exitosamente", usuario });
    }
    catch(error){
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
        res.status(500).json({ message: error.message });
    }
}


const UsuariosController={
    prueba,
    crearCuenta,
    iniciarSesion
}
export default UsuariosController; 