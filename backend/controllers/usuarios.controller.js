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
        res.status(error.status || (/invalida/i.test(error.message) ? 400 : 500)).json({ message: error.message });
    }
}

const cambiarDato = async(req, res)=>{
    try{
        const id = req.id;
        const {inf} = req.body;
        if(!Array.isArray(inf) || inf.length === 0){
            return res.status(400).json({ message: "Debe completar todos los campos"});
        }
        // No logueamos la foto (es un base64 enorme)
        console.log(inf.map((item) => item.dato === "foto_perfil" ? { dato: item.dato, valor: "[imagen]" } : item));
        const allowed = new Set([
            "disponibilidad",
            "nombre_completo",
            "localidad",
            "direccion_calle",
            "direccion_altura",
            "codigo_postal",
            "dni",
            "foto_perfil",
            "sobre_mi",
            "cobro_por_hora",
            "email",
            "telefono"
        ]);
        for (const item of inf) {
            if (!allowed.has(item.dato)) {
                return res.status(400).json({ message: "No se puede cambiar, ingrese un dato válido" });
            }
        }
        const result = await UsuariosService.cambiarDato(id, inf);
        res.status(201).json({ message: "Dato cambiado exitosamente", result});
    }catch(error){
        res.status(error.status || 500).json({ message: error.message });
    }
}

const crearCuenta = async (req, res) => {
    try{
        const { nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil, disponibilidad, sobre_mi, cobro_por_hora,
            email, correo, telefono, google_credential } = req.body;
        // Con Google no hace falta contraseña (el email lo da Google)
        if (!nombre_completo || (!contraseña && !google_credential) || !localidad || !domicilio_calle || !domicilio_altura || !codigo_postal || !dni) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        if (contraseña && !google_credential && String(contraseña).length < 6) {
            return res.status(400).json({ message: "La contraseña tiene que tener al menos 6 caracteres" });
        }
        const usuario = await UsuariosService.crearCuenta(nombre_completo, contraseña, localidad, domicilio_calle, domicilio_altura, codigo_postal, dni, foto_perfil, disponibilidad,
            undefined, undefined, { email: email || correo, telefono, googleCredential: google_credential });
        res.status(201).json({ message: "Cuenta creada exitosamente", usuario });
    }
    catch(error){
        if (!error.status) console.error("❌ Error en crearCuenta:", error.message);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const iniciarSesion = async (req, res) => {
    try{
        const { nombre_completo, contraseña } = req.body;
        if (!nombre_completo || !contraseña) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        const result = await UsuariosService.iniciarSesion(nombre_completo, contraseña);
        res.status(200).json({ token: result.token, notificaciones: result.notificaciones, usuario: result.usuario });
    }
    catch(error){
        if (!error.status) console.error("Error al iniciar sesion:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const iniciarSesionGoogle = async (req, res) => {
    try{
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Falta la cuenta de Google" });
        }
        const result = await UsuariosService.iniciarSesionGoogle(credential);
        res.status(200).json({ token: result.token, notificaciones: result.notificaciones, usuario: result.usuario });
    }
    catch(error){
        if (!error.status) console.error("Error al iniciar sesion con Google:", error);
        res.status(error.status || 500).json({ message: error.message, ...(error.datos || {}) });
    }
}

const recuperarContraseña = async (req, res) => {
    try{
        await UsuariosService.recuperarContraseña(req.body.email);
        res.status(200).json({ message: "Si el email está registrado, te mandamos un código. Revisá también la carpeta de spam." });
    }
    catch(error){
        if (!error.status) console.error("Error al recuperar contraseña:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const restablecerContraseña = async (req, res) => {
    try{
        const { email, codigo } = req.body;
        const nueva = req.body["contraseña"] ?? req.body.contrasena;
        if (!email || !codigo || !nueva) {
            return res.status(400).json({ message: "Debe completar todos los campos" });
        }
        await UsuariosService.restablecerContraseña(email, codigo, nueva);
        res.status(200).json({ message: "Listo, ya podés entrar con tu contraseña nueva." });
    }
    catch(error){
        if (!error.status) console.error("Error al restablecer contraseña:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const eliminarCuenta = async (req, res) => {
    try{
        if (String(req.body?.confirmacion || "").trim().toUpperCase() !== "ELIMINAR") {
            return res.status(400).json({ message: "Para confirmar, escribí ELIMINAR" });
        }
        await UsuariosService.eliminarCuenta(req.id);
        res.status(200).json({ message: "Tu cuenta fue eliminada." });
    }
    catch(error){
        if (!error.status) console.error("Error al eliminar la cuenta:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const subirDni = async (req, res) => {
    try{
        const result = await UsuariosService.subirDni(req.id, req.body?.imagen);
        res.status(201).json({ message: "Recibimos tu DNI. Lo vamos a revisar.", result });
    }
    catch(error){
        if (!error.status) console.error("Error al subir el DNI:", error);
        res.status(error.status || 500).json({ message: error.message });
    }
}

const buscarTrabajadores=async(req, res)=>{
    const id = req.id //hace falta? si
    const {zonas} = req.body
    try{
        const result = await UsuariosService.buscarTrabajadores(id, zonas)
        res.status(201).json(result)
    }catch(error){
        console.error("Error al buscar trabajadores", error);
        res.status(500).json({ message: error.message });
    }
}

const miPerfil = async(req, res)=>{
    try{
        const result = await UsuariosService.miPerfil(req.id)
        res.status(200).json({ message: "Perfil obtenido", result })
    }catch(error){
        console.error("Error al obtener el perfil", error);
        res.status(500).json({ message: error.message });
    }
}

const misNotificaciones = async(req, res)=>{
    try{
        const result = await UsuariosService.misNotificaciones(req.id)
        res.status(200).json({ message: "Notificaciones", result })
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

// Marca como leídas las notificaciones: { ids: [1, 2] } o, sin ids, todas
const leerNotificaciones = async(req, res)=>{
    const { ids } = req.body || {};
    if (ids !== undefined && (!Array.isArray(ids) || ids.length > 500 || !ids.every((n) => Number.isInteger(Number(n)) && Number(n) > 0))) {
        return res.status(400).json({ message: "Las notificaciones no son válidas" });
    }
    try{
        const result = await UsuariosService.leerMisNotificaciones(req.id, ids ? ids.map(Number) : null);
        res.status(200).json({ message: "Notificaciones leídas", result });
    }catch(error){
        res.status(500).json({ message: error.message });
    }
}

const UsuariosController={
    misNotificaciones,
    leerNotificaciones,
    crearCuenta,
    iniciarSesion,
    iniciarSesionGoogle,
    recuperarContraseña,
    restablecerContraseña,
    eliminarCuenta,
    subirDni,
    cambiarDato,
    cambiarContraseña,
    buscarTrabajadores,
    miPerfil
}
export default UsuariosController; 