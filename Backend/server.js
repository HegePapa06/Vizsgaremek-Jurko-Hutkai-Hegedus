require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");

const sequelize = require("./config/db");
const { User, Request, Lesson } = require("./models"); 

const { updatePastLessons } = require("./utils/cron");
const verifyToken = require("./middleware/authMiddleware");

const authRoutes = require("./routes/auth.routes");
const lessonRoutes = require("./routes/lesson.routes");
const teacherRoutes = require("./routes/teacher.routes");
const shopRoutes = require("./routes/shop.routes");
const userRoutes = require("./routes/user.routes");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

app.use("/", authRoutes(upload)); 
app.use("/lessons", lessonRoutes);
app.use("/teachers", teacherRoutes);
app.use("/teacher", teacherRoutes);
app.use("/shop", shopRoutes);
app.use("/", userRoutes);

app.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.json(user);
    } catch (err) { res.status(500).send(err.message); }
});

const syncDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Sikeres csatlakozás az adatbázishoz.");
    await sequelize.sync({ alter: true });
    console.log("Adatbázis szinkronizálva.");
    
    app.listen(PORT, () => {
      console.log(`Szerver fut: http://localhost:${PORT}`);
      
      if (typeof updatePastLessons === 'function') {
          setInterval(updatePastLessons, 60000); 
          console.log("Háttérfolyamat (Cron) aktív.");
      }
    });
  } catch (error) {
    console.error("Adatbázis hiba:", error);
  }
};

syncDB();