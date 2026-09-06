import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function buscarAptitudes() {
    const client = new Client(config);
    try{
        await client.connect();
        const result = await client.query("SELECT * FROM aptitudes")
        return result.rows
    } catch(error){
        throw error
    } finally{
        await client.end();
    }
}

const AptitudesService = {
    buscarAptitudes
}
export default AptitudesService