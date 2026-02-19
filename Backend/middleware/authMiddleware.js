const jwt = require("jsonwebtoken");
const SECRET_KEY = "Maci2025"; 

const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(403).json({ error: "Nincs token biztosítva!" });
    }

    const tokenValue = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    jwt.verify(tokenValue, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Érvénytelen token!" });
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;