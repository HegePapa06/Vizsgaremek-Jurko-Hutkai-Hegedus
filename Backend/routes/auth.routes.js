const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

module.exports = (upload) => {
    router.post("/login", authController.login);
    router.post("/register", upload.single("photo"), authController.register);
    
    return router;
};