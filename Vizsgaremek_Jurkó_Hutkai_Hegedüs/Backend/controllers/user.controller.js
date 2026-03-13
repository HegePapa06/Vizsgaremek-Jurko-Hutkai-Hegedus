const { User, Lesson, Request, Unsubscription } = require("../models");

exports.getStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const completedLessons = await Lesson.count({ 
      where: { studentId, status: "completed", type: "vezetés" } 
    });
    const student = await User.findByPk(studentId);
    res.json({ 
      completedLessons, 
      purchasedHours: student.purchasedHours || 0 ,
      hasLicense: student.hasLicense,
      lastExamFailed: student.lastExamFailed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuthMe = async (req, res) => {
  try {
    const studentId = req.user.id;
    const user = await User.findByPk(studentId, {
      attributes: ["id", "username", "email", "role", "county", "city", "bio", "phone", "photo", "createdAt"]
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

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, county, city, bio, phone } = req.body;
    
    if (phone && (phone.length < 11 || phone.length > 12)) {
      return res.status(400).json({ message: "Érvénytelen telefonszám hossz!" });
    }

    if (email && !email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ message: "Kizárólag @gmail.com címek engedélyezettek!" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Felhasználó nem található" });

    await user.update({
      email: email || user.email,
      county: county || user.county,
      city: city || user.city,
      bio: bio || user.bio,
      phone: phone || user.phone
    });

    res.json({ message: "Profil sikeresen frissítve!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nem érkezett fájl!" });
    }

    const userId = req.user.id; 
    const newPhoto = req.file.filename;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Felhasználó nem található" });

    await user.update({ photo: newPhoto });

    res.json({ 
      message: "Profilkép sikeresen frissítve!", 
      photo: newPhoto 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a kép mentése során" });
  }
};

const bcrypt = require('bcrypt');

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findByPk(userId);
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "A jelenlegi jelszó nem megfelelő!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Jelszó sikeresen megváltoztatva!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unsubscribeFromTeacher = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { teacherId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Az indoklás kötelező!" });
        }

        const request = await Request.findOne({
            where: {
                studentId: studentId,
                teacherId: teacherId,
                status: 'accepted'
            }
        });

        if (!request) {
            return res.status(404).json({ message: "Nem található aktív kapcsolat ezzel az oktatóval." });
        }

        
        const student = await User.findByPk(studentId);

        await Unsubscription.create({
            teacherId: teacherId,
            studentName: student.username,
            reason: reason
        });

        await Lesson.destroy({
            where: {
                studentId: studentId,
                teacherId: teacherId
            }
        });

        await request.destroy();

        res.status(200).json({ message: "Sikeres kiiratkozás, az indoklás elküldve az oktatónak." });

    } catch (error) {
        console.error("Kiiratkozási hiba:", error);
        res.status(500).json({ message: "Hiba történt a kiiratkozás során." });
    }
};

exports.getMyUnsubscriptions = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const list = await Unsubscription.findAll({
            where: { 
                teacherId: teacherId,
                isVisibleForTeacher: true 
            },
            order: [['createdAt', 'DESC']] 
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: "Hiba az indoklások lekérésekor." });
    }
};

exports.deleteUnsubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        const result = await Unsubscription.update(
            { isVisibleForTeacher: false }, 
            { where: { id: id, teacherId: teacherId } }
        );
        res.json({ message: "Indoklás törölve." });
    } catch (error) {
        res.status(500).json({ message: "Hiba a törlés során." });
    }

};
