const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/me', verifyToken, requireRole('participant'), registrationController.getMyRegistrations);

module.exports = router;
