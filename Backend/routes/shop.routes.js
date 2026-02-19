const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post("/buy", shopController.buyMultipleItems);
router.post("/buy-item", shopController.buyItem);  

module.exports = router;