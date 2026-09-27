const express = require('express');
const router = express.Router({ mergeParams: true });
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireEventOwner } = require('../middleware/ownershipMiddleware');

// Mounted at /api/events/:eventId/feedback
router.post('/', verifyToken, requireRole('participant'), feedbackController.submitFeedback);
router.get('/', verifyToken, requireRole('admin'), requireEventOwner, feedbackController.getEventFeedback);

module.exports = router;
