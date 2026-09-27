const { pool } = require('../config/db');

// Custom error types so the controller can map them to the right HTTP
// status/message without string-matching error text.
class DuplicateRegistrationError extends Error {}
class EventFullError extends Error {}
class RegistrationClosedError extends Error {}
class EventNotFoundError extends Error {}

// This whole function runs as ONE transaction. "FOR UPDATE" locks the
// event row so that if two requests for the same event arrive at nearly
// the same instant, the second one waits until the first fully commits —
// so two people can never both grab the last seat.
async function registerParticipant(participantId, eventId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query(
      'SELECT id, capacity, registration_open FROM events WHERE id = ? FOR UPDATE',
      [eventId]
    );
    const event = eventRows[0];
    if (!event) throw new EventNotFoundError();
    if (!event.registration_open) throw new RegistrationClosedError();

    const [existing] = await conn.query(
      'SELECT id FROM registrations WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );
    if (existing.length > 0) throw new DuplicateRegistrationError();

    const [countRows] = await conn.query(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
      [eventId]
    );
    if (countRows[0].count >= event.capacity) throw new EventFullError();

    const [result] = await conn.query(
      'INSERT INTO registrations (participant_id, event_id) VALUES (?, ?)',
      [participantId, eventId]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getRegistrationsForEvent(eventId) {
  const [rows] = await pool.query(`
    SELECT r.id, r.registered_at, u.id AS participant_id, u.name, u.email, u.prn
    FROM registrations r
    JOIN users u ON u.id = r.participant_id
    WHERE r.event_id = ?
    ORDER BY r.registered_at ASC
  `, [eventId]);
  return rows;
}

async function getRegistrationsForParticipant(participantId) {
  const [rows] = await pool.query(`
    SELECT r.id, r.registered_at, e.id AS event_id, e.title, e.event_date, e.event_time, e.venue, e.event_type,
      EXISTS(
        SELECT 1 FROM attendance a WHERE a.participant_id = r.participant_id AND a.event_id = e.id
      ) AS attended,
      EXISTS(
        SELECT 1 FROM feedback f WHERE f.participant_id = r.participant_id AND f.event_id = e.id
      ) AS feedback_submitted
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.participant_id = ?
    ORDER BY e.event_date ASC
  `, [participantId]);
  return rows.map(row => ({
    ...row,
    attended: !!row.attended,
    feedback_submitted: !!row.feedback_submitted,
  }));
}

module.exports = {
  registerParticipant,
  getRegistrationsForEvent,
  getRegistrationsForParticipant,
  DuplicateRegistrationError,
  EventFullError,
  RegistrationClosedError,
  EventNotFoundError,
};