const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lesson.controller');
const verifyToken = require('../middleware/authMiddleware');
const teacherController = require('../controllers/teacher.controller');

router.use(verifyToken);

router.post("/", lessonController.createLesson);
router.get("/", lessonController.getAllLessons);
router.put("/:id/cancel", lessonController.cancelLesson);
router.put("/:id/move", lessonController.moveLesson);
router.put("/:id", lessonController.updateLesson);
router.put('/:id/result', teacherController.updateLesson);

module.exports = router;