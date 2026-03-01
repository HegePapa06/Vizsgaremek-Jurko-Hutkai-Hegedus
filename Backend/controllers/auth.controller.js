const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Lesson } = require("../models");
const { Op } = require('sequelize');

const SECRET_KEY = "Maci2025";

exports.login = async (req, res) => {
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
};

exports.register = async (req, res) => {
  const { username, email, password, role, teacherCode, county, city, bio, phone } = req.body;
  const photo = req.file ? req.file.filename : null;

  if (!phone || phone.length < 11 || phone.length > 12) {
      return res.status(400).json({ message: "Érvénytelen telefonszám hossz! (11-12 karakter szükséges)" });
  }

  if (email && !email.toLowerCase().endsWith('@gmail.com')) {
    return res.status(400).json({ message: "Kizárólag @gmail.com címek engedélyezettek!" });
  }

  try {
    if (role === "tanar") {
      const SECRET_CODE = process.env.TEACHER_SECRET_CODE;
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
      city,
      bio,
      phone,
      photo
    });

    res.status(201).json({ message: "Sikeres regisztráció!" });
  } catch (error) {
    console.error("DB hiba:", error);
    res.status(500).send("Hiba a regisztráció során!");
  }
};