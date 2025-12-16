const express = require("express");
const app = express();
const PORT = 3000;

const sequelize = require("./db");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "Maci2025"

const multer = require("multer");
const path = require("path");

const User = require("./models/user");
const Request = require("./models/Request");

User.hasMany(Request, { foreignKey: "studentId", as: "sentRequests" });
User.hasMany(Request, { foreignKey: "teacherId", as: "receivedRequests" });

Request.belongsTo(User, { foreignKey: "studentId", as: "student" });
Request.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

app.use(express.json());

app.get("/", (req, res) => {
    res.send("SZIIIIIIIASZTOK");
});

const cors = require("cors");
app.use(cors());

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true}));


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
  console.log("BODY:", req.body);
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
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
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


app.get("/teachers", async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: "tanar" },
      attributes: ["id", "username", "email", "county", "bio", "phone", "photo"]
    });

    res.json(teachers);
  } catch (err) {
    console.error("Teacher fetch error:", err);
    res.status(500).json({ message: "Hiba az oktatók lekérésekor!" });
  }
});



async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log("Kapcsolat rendben van.");
    
    await sequelize.sync({ alter: true });
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



app.post("/apply-teacher", async (req, res) => {
  console.log("BODY:", req.body);

  const studentId = Number(req.body.studentId);
  const teacherId = Number(req.body.teacherId);

  console.log("Converted IDs:", studentId, teacherId, typeof studentId, typeof teacherId);

  if (!studentId || !teacherId) {
    return res.status(400).json({ message: "Hiányzó studentId vagy teacherId!" });
  }

  const student = await User.findByPk(studentId);
  const teacher = await User.findByPk(teacherId);

  if (!student || !teacher) return res.status(400).json({ message: "Felhasználó nem létezik!" });

  console.log("Student role:", student.role, "Teacher role:", teacher.role);

  if (student.role !== "tanulo")
    return res.status(400).json({ message: "Csak tanuló jelentkezhet!" });

  if (teacher.role !== "tanar")
    return res.status(400).json({ message: "Csak tanárhoz lehet jelentkezni!" });

  const already = await Request.findOne({
    where: { studentId, teacherId }
  });

  if (already) return res.status(400).json({ message: "Már jelentkeztél ehhez a tanárhoz!" });

  const reqRow = await Request.create({ studentId, teacherId, status: "pending" });

  res.json({ message: "Jelentkezés elküldve!", request: reqRow });
});


app.get("/teacher/requests/:teacherId", async (req, res) => {
  const teacherId = Number(req.params.teacherId);

  const requests = await Request.findAll({
    where: { teacherId },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "username", "email"]
      }
    ]
  });

  res.json(requests);
});


app.post("/teacher/requests/:id/accept", async (req, res) => {
  const id = req.params.id;
  
  const request = await Request.findByPk(id);
  if (!request) return res.status(404).json({ message: "Request nem található" });

  request.status = "accepted";
  await request.save();

  res.json({ message: "Kérelem elfogadva!", request });
});


app.post("/teacher/requests/:id/reject", async (req, res) => {
  const id = req.params.id;

  const request = await Request.findByPk(id);
  if (!request) return res.status(404).json({ message: "Request nem található" });

  request.status = "rejected";
  await request.save();

  res.json({ message: "Kérelem elutasítva!", request });
});


app.get("/student/request/:studentId", async (req, res) => {
  const studentId = Number(req.params.studentId);

  try {
    const accepted = await Request.findOne({
      where: { studentId, status: "accepted" },
      include: [
        { model: User, as: "teacher", attributes: ["id", "username", "email"] }
      ]
    });

    if (accepted) {
      return res.json(accepted);
    }


    const pending = await Request.findOne({
      where: { studentId, status: "pending" },
      include: [
        { model: User, as: "teacher", attributes: ["id", "username", "email"] }
      ]
    });

    if (pending) {
      return res.json(pending);
    }


    const rejected = await Request.findOne({
      where: { studentId, status: "rejected" },
      order: [["updatedAt", "DESC"]],
      include: [
        { model: User, as: "teacher", attributes: ["id", "username", "email"] }
      ]
    });

    if (rejected) {
      return res.json(rejected);
    }


    res.json({ status: null, teacher: null });

  } catch (err) {
    console.error("Student request hiba:", err);
    res.status(500).json({ message: err.message });
  }
});


syncDB();

app.listen(PORT, async () => {
    try{
        await sequelize.authenticate();
        console.log(`Szerver fut:  http://localhost:${PORT}`);
    } catch(err) {
        console.log("DB hiba:", err);
    }
});