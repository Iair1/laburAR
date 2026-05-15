import config from "../dbconfig.js";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const {Client} = pkg;

const prueba = async()=>{
    const client = new Client(config);
    try{
        await client.connect()
        return{ "HOLA": "CONEXION EXITOSA" }
    }finally{
        await client.end();
    }
}

const UsuariosService={
    prueba
}
export default UsuariosService;