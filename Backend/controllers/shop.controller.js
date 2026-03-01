const { User } = require("../models");

exports.buyItem = async (req, res) => {
  try {
    const { type, amount } = req.body; 
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "Felhasználó nem található" });

    if (type === 'lesson') {
      user.purchasedHours += (amount || 1); 
    } 
    else if (type === 'exam') {
      if (!user.lastExamFailed) {
        return res.status(400).json({ message: "Csak sikertelen vizsga után vásárolhatsz pótvizsgát!" });
      }
      user.canRetakeExam = true;
      user.lastExamFailed = false; 
    }

    await user.save();

    res.json({ 
      message: "Sikeres vásárlás!", 
      purchasedHours: user.purchasedHours, 
      canRetakeExam: user.canRetakeExam,
      lastExamFailed: user.lastExamFailed 
    });

  } catch (err) {
    console.error("Hiba a vásárlásnál:", err);
    res.status(500).json({ message: "Szerver hiba történt a vásárlás során." });
  }
};

exports.buyMultipleItems = async (req, res) => {
  try {
    const { items } = req.body;
    const student = await User.findByPk(req.user.id);

    if (!student) return res.status(404).json({ message: "Tanuló nem található" });

    items.forEach(item => {
      if (item.type === 'extra_hour') {
        student.purchasedHours = (student.purchasedHours || 0) + 1;
      } else if (item.type === 'retake_exam') {
        student.canRetakeExam = true;
        student.lastExamFailed = false;
      }
    });

    await student.save();
    res.json({ message: "Sikeres vásárlás!", student });
  } catch (err) {
    console.error("Shop buy error:", err);
    res.status(500).send(err.message);
  }
};