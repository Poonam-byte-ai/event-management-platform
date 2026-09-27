const express = require('express');
const router = express.Router({ mergeParams: true });
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireEventOwner } = require('../middleware/ownershipMiddleware');

// Mounted at /api/events/:eventId/attendance
router.get('/token', verifyToken, requireRole('admin'), requireEventOwner, attendanceController.getCurrentToken);
router.post('/verify', verifyToken, requireRole('participant'), attendanceController.verifyAndMarkAttendance);
router.get('/', verifyToken, requireRole('admin'), requireEventOwner, attendanceController.getEventAttendance);

module.exports = router;
