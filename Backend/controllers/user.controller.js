const { User, Lesson, Request } = require("../models");

exports.getStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const completedLessons = await Lesson.count({ 
      where: { studentId, status: "completed", type: "vezetés" } 
    });
    const student = await User.findByPk(studentId);
    res.json({ 
      completedLessons, 
      purchasedHours: student.purchasedHours || 0 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuthMe = async (req, res) => {
  try {
    const studentId = req.user.id;
    const user = await User.findByPk(studentId, {
      attributes: ["id", "username", "email", "role", "canRetakeExam", "lastExamFailed"]
    });

    if (!user) return res.status(404).json({ message: "Felhasználó nem található" });

    const lastExam = await Lesson.findOne({
      where: { studentId: studentId, type: 'vizsga' },
      order: [['date', 'DESC'], ['startTime', 'DESC']]
    });

    const isFailed = lastExam && (lastExam.examResult === 'sikertelen' || lastExam.status === 'failed');

    res.json({
      ...user.toJSON(),
      lastExamFailed: isFailed,
      canRetakeExam: !!user.canRetakeExam
    });
  } catch (err) {
    res.status(500).json({ message: "Szerver hiba a profil lekérésekor" });
  }
};


exports.getStudentRequestStatus = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const reqRow = await Request.findOne({
      where: { 
        studentId, 
        status: ['accepted', 'pending'] 
      },
      include: [{ model: User, as: "teacher", attributes: ["username"] }]
    });

    if (!reqRow) {
      return res.status(200).json(null); 
    }

    return res.json(reqRow);
  } catch (err) {
    res.status(500).json({ message: "Szerver hiba" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Felhasználó törölve" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};