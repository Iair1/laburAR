import config from "../dbconfig.js";
import pkg from "pg";
const {Client} = pkg;

async function nuevaReseña(id, reseña, puntuacion, otroid, rol, trabajo ){
    const client = new Client(config);
    try{
        await client.connect();
        if(rol === "trabajador") {
            const anteriores = await client.query("SELECT * FROM resena_al_contratador WHERE trabajo = $1", [trabajo]);
            if(anteriores.rowCount > 0){
                return { message: "Ya existe una reseña para este trabajo" };
            }
            const result = await client.query("INSERT INTO resena_al_contratador (reseña, puntuacion, trabajadorid, contratadorid, trabajo) VALUES ($1, $2, $3, $4, $5) RETURNING *", [reseña, puntuacion, id, otroid, trabajo]);
            const puntuacionActualizada = await client.query("UPDATE usuarios SET puntuacion_contratador = (SELECT AVG(puntuacion) FROM reseñas WHERE contratadorid = $1) WHERE id = $1 RETURNING *", [otroid]);
            return { message: "Reseña agregada exitosamente", result: result.rows[0], puntuacionActualizada: puntuacionActualizada.rows[0] };
        }
            const anteriores = await client.query("SELECT * FROM resena_al_trabajador WHERE trabajo = $1", [trabajo]);
            if(anteriores.rowCount > 0){
                return { message: "Ya existe una reseña para este trabajo" };
            }
            const result = await client.query("INSERT INTO resena_al_trabajador (reseña, puntuacion, contratadorid, trabajadorid, trabajo) VALUES ($1, $2, $3, $4, $5) RETURNING *", [reseña, puntuacion, id, otroid, trabajo]);
            const puntuacionActualizada = await client.query("UPDATE usuarios SET puntuacion_trabajador = (SELECT AVG(puntuacion) FROM reseñas WHERE trabajadorid = $1) WHERE id = $1 RETURNING *", [otroid]);
            return { message: "Reseña agregada exitosamente", result: result.rows[0], puntuacionActualizada: puntuacionActualizada.rows[0] };
    } catch(error){
        throw new Error(error.message);
    } finally{
        await client.end();
    }
}

const ReseñaService = {
    nuevaReseña
}
export default ReseñaService;