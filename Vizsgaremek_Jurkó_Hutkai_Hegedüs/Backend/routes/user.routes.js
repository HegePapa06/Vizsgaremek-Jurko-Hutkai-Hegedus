const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

router.use(verifyToken);

router.get('/me', userController.getAuthMe);

router.get('/stats', userController.getStats);

router.get('/student-request-status/:studentId', userController.getStudentRequestStatus);

router.delete('/:id', userController.deleteUser);

router.put('/update', userController.updateProfile);

router.post('/update-profile-picture', upload.single('photo'), userController.updateProfilePicture);

router.post('/change-password', verifyToken, userController.changePassword);

router.post('/unsubscribe/:teacherId', verifyToken, userController.unsubscribeFromTeacher);

router.get('/my-unsubscriptions', verifyToken, userController.getMyUnsubscriptions);

router.delete('/unsubscriptions/:id', verifyToken, userController.deleteUnsubscription);

module.exports = router;