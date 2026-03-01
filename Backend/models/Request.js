const { DataTypes } = require('sequelize');
const sequelize = require("../config/db");
const User = require('./user');

const Request = sequelize.define("Request", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending"
  }
});

module.exports = Request;


