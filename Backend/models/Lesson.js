const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Lesson = sequelize.define("Lesson", {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
  type: DataTypes.ENUM("planned", "cancelled", "declined", "completed"),
  defaultValue: "planned"
  },
  note: {
    type: DataTypes.STRING
  }
});

module.exports = Lesson;
