const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

console.log("TeacherController funkciók:", Object.keys(teacherController));

router.get("/", teacherController.getAllTeachers);

if (teacherController.getTeacherById) {
    router.get("/:id", teacherController.getTeacherById);
}

router.get("/requests/:teacherId", teacherController.getIncomingRequests); 
router.post("/requests/:id/accept", teacherController.acceptRequest);
router.post("/requests/:id/reject", teacherController.rejectRequest);

router.post("/apply", teacherController.applyToTeacher);

router.get("/student-stats/:teacherId", teacherController.getStudentStats);
router.get("/accepted-students/:teacherId", teacherController.getAcceptedStudents);
router.delete("/remove-student/:teacherId/:studentId", teacherController.removeStudent);

module.exports = router;