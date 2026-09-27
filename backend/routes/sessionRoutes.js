const express = require('express');
// mergeParams lets this router read :eventId from the parent route it's
// mounted under (/api/events/:eventId/sessions).
const router = express.Router({ mergeParams: true });
const sessionController = require('../controllers/sessionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireEventOwner } = require('../middleware/ownershipMiddleware');

router.get('/', verifyToken, sessionController.getSessions);
router.post('/', verifyToken, requireRole('admin'), requireEventOwner, sessionController.createSession);
router.put('/:sessionId', verifyToken, requireRole('admin'), requireEventOwner, sessionController.updateSession);

module.exports = router;
