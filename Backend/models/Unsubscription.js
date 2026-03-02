const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Unsubscription = sequelize.define("Unsubscription", {
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isVisibleForTeacher: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Unsubscription;