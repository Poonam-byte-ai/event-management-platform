const registrationModel = require('../models/registrationModel');

// POST /api/events/:eventId/register — participant only
async function registerForEvent(req, res) {
  const { eventId } = req.params;
  const participantId = req.user.id;

  try {
    const registrationId = await registrationModel.registerParticipant(participantId, eventId);
    res.status(201).json({ message: 'Registration successful.', registration_id: registrationId });
  } catch (err) {
    if (err instanceof registrationModel.EventNotFoundError) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (err instanceof registrationModel.RegistrationClosedError) {
      return res.status(400).json({ message: 'Registration is closed for this event.' });
    }
    if (err instanceof registrationModel.DuplicateRegistrationError) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }
    if (err instanceof registrationModel.EventFullError) {
      return res.status(400).json({ message: 'No seats available. Registration is closed.' });
    }
    // Safety net: if the DB unique constraint catches a duplicate that
    // somehow slipped past the app-level check (e.g. two near-simultaneous
    // requests outside the transaction lock), report it the same way.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to register for event.' });
  }
}

// GET /api/events/:eventId/registrations — admin only
async function getEventRegistrations(req, res) {
  try {
    const registrations = await registrationModel.getRegistrationsForEvent(req.params.eventId);
    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch registrations.' });
  }
}

// GET /api/registrations/me — participant only
async function getMyRegistrations(req, res) {
  try {
    const registrations = await registrationModel.getRegistrationsForParticipant(req.user.id);
    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch your registrations.' });
  }
}

module.exports = { registerForEvent, getEventRegistrations, getMyRegistrations };
