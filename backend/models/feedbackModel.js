const { pool } = require('../config/db');

class NotAttendedError extends Error {}
class DuplicateFeedbackError extends Error {}
class EventNotFoundError extends Error {}

async function submitFeedback(participantId, eventId, rating, comments) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query('SELECT id FROM events WHERE id = ?', [eventId]);
    if (!eventRows[0]) throw new EventNotFoundError();

    const [attRows] = await conn.query(
      'SELECT id FROM attendance WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );
    if (!attRows[0]) throw new NotAttendedError();

    const [existingFeedback] = await conn.query(
      'SELECT id FROM feedback WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );
    if (existingFeedback[0]) throw new DuplicateFeedbackError();

    const [result] = await conn.query(
      'INSERT INTO feedback (participant_id, event_id, rating, comments) VALUES (?, ?, ?, ?)',
      [participantId, eventId, rating, comments]
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

async function getFeedbackForEvent(eventId) {
  const [rows] = await pool.query(`
    SELECT f.id, f.rating, f.comments, f.submitted_at, u.name, u.email, u.prn
    FROM feedback f
    JOIN users u ON u.id = f.participant_id
    WHERE f.event_id = ?
    ORDER BY f.submitted_at DESC
  `, [eventId]);
  return rows;
}

module.exports = {
  submitFeedback,
  getFeedbackForEvent,
  NotAttendedError,
  DuplicateFeedbackError,
  EventNotFoundError,
};
