const express = require("express");
const app = express();
const PORT = 3000;

const sequelize = require("./db");
const User = require("./user");

const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "Maci2025"

const multer = require("multer");
const path = require("path");

app.use(express.json());

app.get("/", (req, res) => {
    res.send("SZIIIIIIIASZTOK");
});

const cors = require("cors");
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
app.use("/uploads", express.static("uploads"));


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Felhasználó nem található!" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Hibás jelszó!" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "30m" }
    );

    res.json({
      message: "Sikeres bejelentkezés!",
      token,
      user: { username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post("/register", upload.single("photo"), async (req, res) => {
  const { username, email, password, role, teacherCode, county, bio, phone } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    if (role === "tanar") {
      const SECRET_CODE = "TANAR2025";
      if (teacherCode !== SECRET_CODE) {
        return res.status(403).json({ message: "Hibás tanári kód!" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      county,
      bio,
      phone,
      photo
    });

    res.status(201).json({ message: "Sikeres regisztráció!" });
  } catch (error) {
    console.error("DB hiba:", error);
    res.status(500).send("Hiba a regisztráció során!");
  }
});

async function syncDB() {
    try {
        await sequelize.authenticate();
        console.log("Kapcsolat rendben van.");

        await sequelize.sync({ alter: true});
        console.log("Az adatbázis szinkronizálva.");
        
    } catch (error) {
        console.error("Hiba a DB kapcsolat során:", error);
    } 
}

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "Token hiányzik!" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Érvénytelen token!" });
  }
}

app.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Sikeresen elértél egy védett útvonalat!", user: req.user });
});

syncDB();

app.listen(PORT, async () => {
    try{
        await sequelize.authenticate();
        await sequelize.sync({ alter: true});
        console.log(`Szerver fut:  http://localhost:${PORT}`);
    } catch(err) {
        console.log("DB hiba:", err);
    }
});