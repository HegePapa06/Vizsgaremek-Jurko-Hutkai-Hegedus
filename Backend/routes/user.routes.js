const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/me', userController.getAuthMe);

router.get('/stats', userController.getStats);

router.get('/student-request-status/:studentId', userController.getStudentRequestStatus);

router.delete('/:id', userController.deleteUser);

module.exports = router;