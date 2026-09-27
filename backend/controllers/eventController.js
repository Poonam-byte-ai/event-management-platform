const eventModel = require('../models/eventModel');

// POST /api/events — admin only
async function createEvent(req, res) {
  try {
    const { title, description, capacity, event_date, event_time, venue, event_type, tags } = req.body;

    if (!title || !capacity || !event_date || !event_time || !venue || !event_type) {
      return res.status(400).json({
        message: 'title, capacity, event_date, event_time, venue and event_type are required.',
      });
    }
    if (!['compulsory', 'optional'].includes(event_type)) {
      return res.status(400).json({ message: 'event_type must be "compulsory" or "optional".' });
    }

    const eventId = await eventModel.createEvent({
      title,
      description,
      capacity,
      eventDate: event_date,
      eventTime: event_time,
      venue,
      eventType: event_type,
      tags,
      createdBy: req.user.id,
    });

    const event = await eventModel.getEventById(eventId);
    res.status(201).json({ message: 'Event created.', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event.' });
  }
}

// GET /api/events — participants see every event (to browse and register).
// Admins see only the events they themselves created.
async function getEvents(req, res) {
  try {
    const events = req.user.role === 'admin'
      ? await eventModel.getEventsByAdmin(req.user.id)
      : await eventModel.getAllEvents();
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
}

// GET /api/events/:id
async function getEventDetails(req, res) {
  try {
    const event = await eventModel.getEventById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event.' });
  }
}

// PUT /api/events/:id — admin only
async function updateEvent(req, res) {
  try {
    const existing = await eventModel.getEventById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found.' });

    const { title, description, capacity, event_date, event_time, venue, event_type, tags } = req.body;

    // Prevent shrinking capacity below people already registered — avoids
    // a silently "over-capacity" event with no way to explain it in a demo.
    if (capacity < existing.registered_count) {
      return res.status(400).json({
        message: `Cannot set capacity below current registered count (${existing.registered_count}).`,
      });
    }

    await eventModel.updateEvent(req.params.id, {
      title, description, capacity,
      eventDate: event_date, eventTime: event_time, venue, eventType: event_type, tags,
    });

    const updated = await eventModel.getEventById(req.params.id);
    res.json({ message: 'Event updated.', event: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update event.' });
  }
}

// PATCH /api/events/:id/registration — admin only, body: { "open": true/false }
async function setRegistrationStatus(req, res) {
  try {
    const { open } = req.body;
    if (typeof open !== 'boolean') {
      return res.status(400).json({ message: '"open" must be true or false.' });
    }
    const existing = await eventModel.getEventById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found.' });

    await eventModel.setRegistrationOpen(req.params.id, open);
    res.json({ message: `Registration ${open ? 'opened' : 'closed'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update registration status.' });
  }
}

// GET /api/events/recommended — participant only. Simple, explainable
// matching (no ML): split the participant's stored interests and each
// event's tags into lowercase words, count overlapping words, and sort
// events with at least one match to the front. Every event is still
// returned (with match_count: 0 for non-matches) so the page can show
// "Recommended for you" plus the full list underneath.
function splitTags(value) {
  return (value || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

async function getRecommendedEvents(req, res) {
  try {
    const userModel = require('../models/userModel');
    const user = await userModel.findById(req.user.id);
    const interestWords = splitTags(user.interests);

    const events = await eventModel.getAllEvents();
    const scored = events.map((ev) => {
      const eventWords = splitTags(ev.tags);
      const matchCount = interestWords.filter((w) => eventWords.includes(w)).length;
      return { ...ev, match_count: matchCount };
    });

    scored.sort((a, b) => b.match_count - a.match_count);
    res.json({ events: scored, interests: user.interests || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch recommended events.' });
  }
}

// DELETE /api/events/:id — admin only, and only the admin who created it
// (enforced by requireEventOwner before this ever runs). No status check —
// the admin can delete an event at any time, open/closed, with or without
// registrations; the DB's ON DELETE CASCADE cleans up related rows.
async function deleteEvent(req, res) {
  try {
    await eventModel.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
}

module.exports = {
  createEvent, getEvents, getEventDetails, updateEvent,
  setRegistrationStatus, getRecommendedEvents, deleteEvent,
};