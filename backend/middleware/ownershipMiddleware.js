const eventModel = require('../models/eventModel');

// Use on admin-only routes that act on one specific event (update event,
// manage its sessions/registrations/attendance/feedback). Runs after
// verifyToken + requireRole('admin'). Confirms the event exists and that
// req.user.id is the admin who created it — otherwise one admin could
// manage another admin's event just by knowing its ID.
//
// Reads the event id from :id (event routes) or :eventId (nested routes
// like /api/events/:eventId/sessions), whichever is present.
async function requireEventOwner(req, res, next) {
  try {
    const eventId = req.params.eventId || req.params.id;
    const event = await eventModel.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.created_by !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage events you created.' });
    }

    req.event = event; // controllers can reuse this instead of re-querying
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to verify event ownership.' });
  }
}

module.exports = { requireEventOwner };
