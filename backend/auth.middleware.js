import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token no proporcionado" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
        if(decoded === undefined || decoded.userid === undefined){
            return res.status(401).json({ message: "No se pudo verificar el token" });
        }
        req.id = decoded.userid;
        console.log("Id verificado correctamente: ", req.id);
        next();
    } catch (error) {
        return res.status(401).json({error: error.message});
    }
};

export {verifyToken}