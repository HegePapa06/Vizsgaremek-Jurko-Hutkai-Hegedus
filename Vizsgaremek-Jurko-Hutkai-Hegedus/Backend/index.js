const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");

const sequelize = require("./db");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const jwt = require("jsonwebtoken");
const SECRET_KEY = "Maci2025"

const multer = require("multer");
const path = require("path");
const { Op } = require('sequelize');

const User = require("./models/user");
const Request = require("./models/Request");
const Lesson = require("./models/Lesson");


User.hasMany(Request, { foreignKey: "studentId", as: "sentRequests" });
User.hasMany(Request, { foreignKey: "teacherId", as: "receivedRequests" });

Request.belongsTo(User, { foreignKey: "studentId", as: "student" });
Request.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

Lesson.belongsTo(User, { as: "teacher", foreignKey: "teacherId" });
Lesson.belongsTo(User, { as: "student", foreignKey: "studentId" });

User.hasMany(Lesson, { as: "teacherLessons", foreignKey: "teacherId" });
User.hasMany(Lesson, { as: "studentLessons", foreignKey: "studentId" });

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("SZIIIIIIIASZTOK");
});

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
  console.log("Beérkező Body:", req.body); 

  const studentId = req.body.studentId;
  const teacherId = req.body.teacherId;

  if (!studentId || !teacherId) {
    return res.status(400).json({ 
      message: "Hiányzó adatok!", 
      received: req.body 
    });
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

app.get("/teacher/accepted-students/:teacherId", async (req, res) => {
  const teacherId = Number(req.params.teacherId);

  try {
    const accepted = await Request.findAll({
      where: {
        teacherId,
        status: "accepted"
      },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "username", "email"]
        }
      ]
    });

    
    const students = accepted.map(r => r.student);

    res.json(students);
  } catch (err) {
    console.error("Accepted students error:", err);
    res.status(500).json({ message: "Nem sikerült lekérni az elfogadott diákokat." });
  }
});



app.post("/lessons", async (req, res) => {
  const { teacherId, studentId, date, startTime, endTime, note } = req.body;

  const lesson = await Lesson.create({
    teacherId,
    studentId,
    date,
    startTime,
    endTime,
    note
  });

  res.status(201).json(lesson);
});


app.get("/lessons", verifyToken, async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'tanar') {
      whereClause = { teacherId: req.user.id };
    } 
    else if (req.user.role === 'tanulo') {
      whereClause = { studentId: req.user.id };
    }

    const lessons = await Lesson.findAll({
      where: whereClause,
      include: [
        { model: User, as: "teacher", attributes: ["username"] },
        { model: User, as: "student", attributes: ["username"] } 
      ]
    });

    const formattedLessons = lessons.map(l => ({
      id: l.id,
      date: l.date,
      startTime: l.startTime,
      endTime: l.endTime,
      status: l.status,
      type: l.type, 
      studentName: l.student ? l.student.username : 'Ismeretlen',
      teacherName: l.teacher ? l.teacher.username : 'Ismeretlen',
      studentId: l.studentId
    }));
    
    res.json(formattedLessons);
  } catch (err) {
    console.error("Lessons fetch error:", err);
    res.status(500).json({ message: "Hiba az órák lekérésekor!" });
  }
});

async function updatePastLessons() {
  const now = new Date();
  
  const todayStr = now.toLocaleDateString('sv-SE'); 
  const currentTime = now.toLocaleTimeString('hu-HU', { hour12: false }).slice(0, 5); 

  try {
    const updatedCount = await Lesson.update(
      { status: 'completed' }, 
      {
        where: {
          status: 'planned',
          [Op.or]: [
            { date: { [Op.lt]: todayStr } },
            { 
              [Op.and]: [
                { date: todayStr },
                { endTime: { [Op.lt]: currentTime } }
              ] 
            }
          ]
        }
      }
    );
    if (updatedCount[0] > 0) console.log(`${updatedCount[0]} óra lezárva.`);
  } catch (err) {
    console.error('Hiba a frissítésnél:', err);
  }
}


setInterval(updatePastLessons, 60 * 1000);


app.get("/teacher/lessons/:teacherId", async (req, res) => {
  const lessons = await Lesson.findAll({
    where: { teacherId: req.params.teacherId },
    include: [{ model: User, as: "student", attributes: ["id", "username"] }]
  });

  res.json(lessons);
});


app.get("/student/lessons/:studentId", async (req, res) => {
  const lessons = await Lesson.findAll({
    where: { studentId: req.params.studentId },
    include: [{ model: User, as: "teacher", attributes: ["id", "username"] }]
  });

  res.json(lessons);
});


app.put("/lessons/:id/cancel", verifyToken, async (req, res) => {
  const lessonId = req.params.id;
  const { cancelReason } = req.body;

  try {
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Az óra nem található!" });
    }

    lesson.status = 'cancelled';
    if (cancelReason) {
      lesson.note = lesson.note 
        ? `${lesson.note} | Lemondva: ${cancelReason}` 
        : `Lemondva: ${cancelReason}`;
    }

    await lesson.save();
    res.json({ message: "Sikeres lemondás!", lesson });
  } catch (err) {
    console.error("Hiba:", err);
    res.status(500).json({ message: "Szerver hiba a lemondáskor." });
  }
});


app.put("/lessons/:id/move", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { day, time, endTime } = req.body;

  try {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return res.status(404).send("Óra nem található");

    const conflict = await Lesson.findOne({
      where: {
        date: day,
        startTime: time,
        status: ['planned', 'completed'], 
        id: { [Op.ne]: id } 
      }
    });

    if (conflict) {
      return res.status(400).json({ 
        message: "Ebben az időpontban már van egy bejegyzett óra! Válassz másikat." 
      });
    }

    lesson.date = day; 
    lesson.startTime = time;
    lesson.endTime = endTime;

    await lesson.save();
    res.json({ message: "Sikeres mentés!", lesson });

  } catch (err) {
    console.error("SQL Hiba:", err);
    res.status(500).send(err.message);
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