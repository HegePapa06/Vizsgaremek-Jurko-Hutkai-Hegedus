const { User, Request, Lesson } = require("../models");
const { Op } = require('sequelize');

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: "tanar" },
      attributes: ["id", "username", "email", "county", "city", "bio", "phone", "photo"]
    });
    res.json(teachers);
  } catch (err) {
    console.error("Teacher fetch error:", err);
    res.status(500).json({ message: "Hiba az oktatók lekérésekor!" });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findByPk(req.params.id);
    if (!teacher) return res.status(404).send("Tanár nem található");
    res.json(teacher);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.applyToTeacher = async (req, res) => {
  const { studentId, teacherId } = req.body;

  if (!studentId || !teacherId) {
    return res.status(400).json({ message: "Hiányzó adatok!", received: req.body });
  }

  try {
    const student = await User.findByPk(studentId);
    const teacher = await User.findByPk(teacherId);

    if (!student || !teacher) return res.status(400).json({ message: "Felhasználó nem létezik!" });

    if (student.role !== "tanulo") return res.status(400).json({ message: "Csak tanuló jelentkezhet!" });
    if (teacher.role !== "tanar") return res.status(400).json({ message: "Csak tanárhoz lehet jelentkezni!" });

    const already = await Request.findOne({ 
      where: { 
        studentId, 
        teacherId,
        status: { [Op.ne]: 'rejected' }
      } 
    });

    if (already) {
      const msg = already.status === 'accepted' ? "Már az oktatód!" : "Már van egy függő jelentkezésed!";
      return res.status(400).json({ message: msg });
    }

    const reqRow = await Request.create({ studentId, teacherId, status: "pending" });
    res.json({ message: "Jelentkezés elküldve!", request: reqRow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncomingRequests = async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);
    const requests = await Request.findAll({
      where: { teacherId },
      include: [{ model: User, as: "student", attributes: ["id", "username", "email"] }]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request nem található" });

    request.status = "accepted";
    await request.save();
    res.json({ message: "Kérelem elfogadva!", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request nem található" });

    request.status = "rejected";
    await request.save();
    res.json({ message: "Kérelem elutasítva!", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAcceptedStudents = async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);
    const accepted = await Request.findAll({
      where: { teacherId, status: "accepted" },
      include: [{ model: User, as: "student", attributes: ["id", "username", "email"] }]
    });
    res.json(accepted.map(r => r.student));
  } catch (err) {
    res.status(500).json({ message: "Nem sikerült lekérni az elfogadott diákokat." });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const acceptedRequests = await Request.findAll({
      where: { teacherId, status: 'accepted' },
      include: [{ model: User, as: 'student', attributes: ['id', 'username', 'purchasedHours'] }]
    });

    const stats = await Promise.all(acceptedRequests.map(async (request) => {
      const student = request.student;
      if (!student) return null;

      const lessonCount = await Lesson.count({
        where: { studentId: student.id, status: 'completed', type: 'vezetés' }
      });

      const successExam = await Lesson.findOne({
        where: { studentId: student.id, type: 'vizsga', examResult: 'sikeres' }
      });

      const totalHours = lessonCount * 2;
      const extraHours = student.purchasedHours || 0;
      const requiredTotal = 30 + extraHours;

      return {
        id: student.id,
        username: student.username,
        completedHours: totalHours,
        requiredHours: requiredTotal,
        isExamReady: totalHours >= requiredTotal,
        hasLicense: !!successExam,
        purchasedHours: extraHours
      };
    }));

    res.json(stats.filter(s => s !== null));
  } catch (err) {
    res.status(500).json({ message: "Hiba történt", error: err.message });
  }
};

exports.removeStudent = async (req, res) => {
  try {
    const { teacherId, studentId } = req.params;
    await Request.destroy({ where: { teacherId, studentId, status: 'accepted' } });
    await Lesson.destroy({ where: { teacherId, studentId } });
    res.json({ message: "Diák és minden hozzá tartozó óra törölve." });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createLesson = async (req, res) => {
  const { teacherId, studentId, date, startTime, endTime, note, type } = req.body;
  try {
    const user = await User.findByPk(studentId);
    if (!user) return res.status(404).json({ message: "Tanuló nem található!" });
    if (user.hasLicense) return res.status(403).json({ message: "A tanuló már levizsgázott!" });

    const allVezetesCount = await Lesson.count({
      where: { studentId, type: 'vezetés', status: { [Op.ne]: 'cancelled' } }
    });
    const totalHoursSoFar = allVezetesCount * 2;

    if (type === 'vizsga') {
      if (totalHoursSoFar < 30) {
        return res.status(400).json({ message: `Még csak ${totalHoursSoFar} órája van. 30 kell a vizsgához!` });
      }
      const lastExam = await Lesson.findOne({
        where: { studentId, type: 'vizsga' },
        order: [['createdAt', 'DESC']]
      });
      if (lastExam && (lastExam.examResult === 'sikertelen' || lastExam.status === 'failed') && !user.canRetakeExam) {
        return res.status(400).json({ message: "Sikertelen vizsga után vegyél pótvizsga alkalmat!" });
      }
      if (user.canRetakeExam) await user.update({ canRetakeExam: false });
    } else {
      if (totalHoursSoFar >= 30) {
        const extraHoursUsed = totalHoursSoFar - 30;
        const availableExtra = user.purchasedHours || 0;
        if (extraHoursUsed >= availableExtra) {
          return res.status(400).json({ message: "Elfogyott a pótóra keret! Vegyél újat a boltban." });
        }
      }
    }
    const lesson = await Lesson.create({
      teacherId, studentId, date, startTime, endTime, note,
      type: type || 'vezetés', status: 'planned'
    });
    res.status(201).json(lesson);
  } catch (error) { res.status(500).json({ message: "Szerver hiba történt." }); }
};

exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, examResult } = req.body;
    const lesson = await Lesson.findByPk(id);
    if (!lesson) return res.status(404).json({ message: "Óra nem található" });

    if (lesson.type === 'vizsga' && lesson.examResult?.trim()) {
      return res.status(403).json({ message: "Ez a vizsga már lezárult, az eredménye nem módosítható!" });
    }

    if (lesson.type === 'vizsga' && examResult) {
      const student = await User.findByPk(lesson.studentId);
      if (examResult === 'sikeres') {
        await student.update({ hasLicense: true, lastExamFailed: false });
        req.body.status = 'completed';
      } else if (examResult === 'sikertelen') {
        await student.update({ hasLicense: false, lastExamFailed: true });
        req.body.status = 'failed';
      }
    }
    await lesson.update(req.body);
    res.json({ message: "Sikeresen módosítva!", examResult: lesson.examResult, status: lesson.status });
  } catch (err) { res.status(500).send(err.message); }
};