const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireEventOwner } = require('../middleware/ownershipMiddleware');

// Everyone logged in (admin or participant) can view events.
router.get('/', verifyToken, eventController.getEvents);
// Must be registered BEFORE '/:id' — otherwise Express would match
// "recommended" as an :id value and this route would never be reached.
router.get('/recommended', verifyToken, requireRole('participant'), eventController.getRecommendedEvents);
router.get('/:id', verifyToken, eventController.getEventDetails);

// Admin-only actions, restricted to the admin who created the event.
router.post('/', verifyToken, requireRole('admin'), eventController.createEvent);
router.put('/:id', verifyToken, requireRole('admin'), requireEventOwner, eventController.updateEvent);
router.patch('/:id/registration', verifyToken, requireRole('admin'), requireEventOwner, eventController.setRegistrationStatus);
router.delete('/:id', verifyToken, requireRole('admin'), requireEventOwner, eventController.deleteEvent);

module.exports = router;