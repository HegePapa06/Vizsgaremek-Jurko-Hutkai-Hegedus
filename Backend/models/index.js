const User = require('./user');
const Request = require('./Request');
const Lesson = require('./Lesson');

User.hasMany(Request, { foreignKey: "studentId", as: "sentRequests" });
User.hasMany(Request, { foreignKey: "teacherId", as: "receivedRequests" });

Request.belongsTo(User, { foreignKey: "studentId", as: "student" });
Request.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

Lesson.belongsTo(User, { as: "teacher", foreignKey: "teacherId" });
Lesson.belongsTo(User, { as: "student", foreignKey: "studentId" });

User.hasMany(Lesson, { as: "teacherLessons", foreignKey: "teacherId" });
User.hasMany(Lesson, { as: "studentLessons", foreignKey: "studentId" });

module.exports = {
  User,
  Request,
  Lesson
};