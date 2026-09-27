const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, speakerController.getSpeakers); // both roles can view
router.post('/', verifyToken, requireRole('admin'), speakerController.createSpeaker);
router.put('/:id', verifyToken, requireRole('admin'), speakerController.updateSpeaker);
router.delete('/:id', verifyToken, requireRole('admin'), speakerController.deleteSpeaker);

module.exports = router;