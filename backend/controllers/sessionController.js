const sessionModel = require('../models/sessionModel');

// POST /api/events/:eventId/sessions — admin only
async function createSession(req, res) {
  try {
    const { eventId } = req.params;
    const { speaker_id, session_name, start_time, end_time } = req.body;

    if (!speaker_id || !session_name || !start_time || !end_time) {
      return res.status(400).json({
        message: 'speaker_id, session_name, start_time and end_time are required.',
      });
    }
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ message: 'start_time must be before end_time.' });
    }

    const conflict = await sessionModel.findOverlappingSession(eventId, start_time, end_time);
    if (conflict) {
      return res.status(409).json({
        message: 'This time slot is already occupied by another session. Please choose a different time.',
        conflicting_session: conflict,
      });
    }

    const sessionId = await sessionModel.createSession({
      eventId, speakerId: speaker_id, sessionName: session_name, startTime: start_time, endTime: end_time,
    });
    const session = await sessionModel.getSessionById(sessionId);
    res.status(201).json({ message: 'Session created.', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create session.' });
  }
}

// GET /api/events/:eventId/sessions
async function getSessions(req, res) {
  try {
    const sessions = await sessionModel.getSessionsByEvent(req.params.eventId);
    res.json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch sessions.' });
  }
}

// PUT /api/events/:eventId/sessions/:sessionId — admin only
async function updateSession(req, res) {
  try {
    const { eventId, sessionId } = req.params;
    const { speaker_id, session_name, start_time, end_time } = req.body;

    const existing = await sessionModel.getSessionById(sessionId);
    if (!existing) return res.status(404).json({ message: 'Session not found.' });

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ message: 'start_time must be before end_time.' });
    }

    const conflict = await sessionModel.findOverlappingSession(eventId, start_time, end_time, sessionId);
    if (conflict) {
      return res.status(409).json({
        message: 'This time slot is already occupied by another session. Please choose a different time.',
        conflicting_session: conflict,
      });
    }

    await sessionModel.updateSession(sessionId, {
      speakerId: speaker_id, sessionName: session_name, startTime: start_time, endTime: end_time,
    });
    const updated = await sessionModel.getSessionById(sessionId);
    res.json({ message: 'Session updated.', session: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update session.' });
  }
}

module.exports = { createSession, getSessions, updateSession };
