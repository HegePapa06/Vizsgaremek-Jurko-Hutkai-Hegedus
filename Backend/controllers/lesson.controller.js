const { User, Lesson } = require("../models");
const { Op } = require('sequelize');

exports.createLesson = async (req, res) => {
  const { teacherId, studentId, date, startTime, endTime, note, type } = req.body;

  try {
    const user = await User.findByPk(studentId);
    if (!user) return res.status(404).json({ message: "Tanuló nem található!" });

    if (user.hasLicense) {
      return res.status(403).json({ message: "A tanuló már levizsgázott!" });
    }

    const allVezetesCount = await Lesson.count({
      where: { 
        studentId, 
        type: 'vezetés', 
        status: { [Op.ne]: 'cancelled' } 
      }
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

      if (user.canRetakeExam) {
        await user.update({ canRetakeExam: false });
      }

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
      teacherId,
      studentId,
      date,
      startTime,
      endTime,
      note,
      type: type || 'vezetés',
      status: 'planned'
    });

    res.status(201).json(lesson);

  } catch (error) {
    console.error("Hiba:", error);
    res.status(500).json({ message: "Szerver hiba történt." });
  }
};

exports.getAllLessons = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'tanar') whereClause = { teacherId: req.user.id };
    else if (req.user.role === 'tanulo') whereClause = { studentId: req.user.id };

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
      note: l.note, 
      examResult: l.examResult, 
      studentName: l.student ? l.student.username : 'Ismeretlen',
      teacherName: l.teacher ? l.teacher.username : 'Ismeretlen',
      studentId: l.studentId
    }));
    
    res.json(formattedLessons);
  } catch (err) {
    res.status(500).json({ message: "Hiba az órák lekérésekor!" });
  }
};

exports.cancelLesson = async (req, res) => {
  const lessonId = req.params.id;
  const { cancelReason } = req.body;
  try {
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) return res.status(404).json({ message: "Az óra nem található!" });

    lesson.status = 'cancelled';
    if (cancelReason) {
      lesson.note = lesson.note ? `${lesson.note} | Lemondva: ${cancelReason}` : `Lemondva: ${cancelReason}`;
    }
    await lesson.save();
    res.json({ message: "Sikeres lemondás!", lesson });
  } catch (err) {
    res.status(500).json({ message: "Szerver hiba a lemondáskor." });
  }
};

exports.moveLesson = async (req, res) => {
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
      return res.status(400).json({ message: "Ebben az időpontban már van egy bejegyzett óra!" });
    }

    lesson.date = day; 
    lesson.startTime = time;
    lesson.endTime = endTime;
    await lesson.save();
    res.json({ message: "Sikeres mentés!", lesson });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, examResult } = req.body; 

    const lesson = await Lesson.findByPk(id);
    if (!lesson) return res.status(404).json({ message: "Óra nem található" });

    if (lesson.type === 'vizsga' && lesson.examResult && lesson.examResult.trim() !== "") {
      return res.status(403).json({ message: "Ez a vizsga már lezárult, nem módosítható!" });
    }

    if (date && startTime && (date !== lesson.date || startTime !== lesson.startTime)) {
      const existingLesson = await Lesson.findOne({
        where: {
          date, startTime,
          status: ['planned', 'completed'], 
          id: { [Op.ne]: id } 
        }
      });
      if (existingLesson) return res.status(400).json({ message: "Ebben az időpontban már van óra!" });
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
    await lesson.reload();
    res.json({ message: "Sikeresen módosítva!", examResult: lesson.examResult, status: lesson.status });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).send("Az óra nem található.");
    if (lesson.status === 'completed') return res.json({ message: "Már lezárva.", lessonNumber: lesson.lessonNumber });

    const previousCount = await Lesson.count({ where: { studentId: lesson.studentId, status: 'completed' } });
    const nextNumber = Math.min((previousCount + 1) * 2, 30);

    await lesson.update({ status: 'completed', lessonNumber: finalNumber });
    res.json({ message: "Óra sikeresen lezárva", lessonNumber: finalNumber });
  } catch (err) { res.status(500).send("Hiba a lezáráskor."); }
};

exports.setExamResult = async (req, res) => {
  try {
    const { status, examResult } = req.body;
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Nem található!" });

    await lesson.update({ status: status || 'completed', examResult });
    if (examResult === 'sikeres') {
      const student = await User.findByPk(lesson.studentId);
      if (student) await student.update({ hasLicense: true });
    }
    res.json({ message: "Sikeres mentés!", lesson });
  } catch (err) { res.status(500).json({ error: "Szerver hiba." }); }
};