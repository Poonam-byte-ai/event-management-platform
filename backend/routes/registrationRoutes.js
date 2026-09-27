const express = require('express');
const router = express.Router({ mergeParams: true });
const registrationController = require('../controllers/registrationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireEventOwner } = require('../middleware/ownershipMiddleware');

// Mounted at /api/events/:eventId/registrations
router.post('/', verifyToken, requireRole('participant'), registrationController.registerForEvent);
router.get('/', verifyToken, requireRole('admin'), requireEventOwner, registrationController.getEventRegistrations);

module.exports = router;
