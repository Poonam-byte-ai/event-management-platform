const { pool } = require('../config/db');
const crypto = require('crypto');

const TOKEN_VALIDITY_SECONDS = 15;

// 8-character alphanumeric code (uppercase letters + digits, no ambiguous
// characters like 0/O or 1/I) generated with crypto.randomInt for real
// randomness — far harder to guess or share verbally than a 6-digit number,
// while still short enough to type in a few seconds as a manual fallback
// to scanning the QR code.
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateToken() {
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += TOKEN_CHARS[crypto.randomInt(TOKEN_CHARS.length)];
  }
  return token;
}

class TokenInvalidError extends Error {}
class NotRegisteredError extends Error {}
class AlreadyMarkedError extends Error {}
class EventNotFoundError extends Error {}

// Returns the currently valid token for an event, generating a fresh one
// if none exists yet or the last one has expired. This is what the admin's
// QR screen polls — no background job/cron needed, rotation happens
// naturally because each poll checks "is the last token still fresh?".
async function getOrCreateCurrentToken(eventId) {
  const [rows] = await pool.query(
    `SELECT * FROM attendance_tokens
     WHERE event_id = ? AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [eventId]
  );

  if (rows[0]) {
    const secondsRemaining = Math.max(
      0,
      Math.round((new Date(rows[0].expires_at) - new Date()) / 1000)
    );
    return { token: rows[0].token, expires_at: rows[0].expires_at, seconds_remaining: secondsRemaining };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_SECONDS * 1000);

  await pool.query(
    'INSERT INTO attendance_tokens (event_id, token, expires_at) VALUES (?, ?, ?)',
    [eventId, token, expiresAt]
  );

  return { token, expires_at: expiresAt, seconds_remaining: TOKEN_VALIDITY_SECONDS };
}

// Transaction: validate token -> validate registration -> check not already
// marked -> insert. All three business rules in one atomic operation.
async function markAttendance(participantId, eventId, submittedToken) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query('SELECT id FROM events WHERE id = ?', [eventId]);
    if (!eventRows[0]) throw new EventNotFoundError();

    const [tokenRows] = await conn.query(
      `SELECT * FROM attendance_tokens
       WHERE event_id = ? AND token = ? AND expires_at > NOW()`,
      [eventId, submittedToken]
    );
    if (!tokenRows[0]) throw new TokenInvalidError();

    const [regRows] = await conn.query(
      'SELECT id FROM registrations WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );
    if (!regRows[0]) throw new NotRegisteredError();

    const [attRows] = await conn.query(
      'SELECT id FROM attendance WHERE participant_id = ? AND event_id = ?',
      [participantId, eventId]
    );
    if (attRows[0]) throw new AlreadyMarkedError();

    const [result] = await conn.query(
      'INSERT INTO attendance (participant_id, event_id) VALUES (?, ?)',
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

async function getAttendanceForEvent(eventId) {
  const [rows] = await pool.query(`
    SELECT a.id, a.marked_at, u.id AS participant_id, u.name, u.email, u.prn
    FROM attendance a
    JOIN users u ON u.id = a.participant_id
    WHERE a.event_id = ?
    ORDER BY a.marked_at ASC
  `, [eventId]);
  return rows;
}

module.exports = {
  getOrCreateCurrentToken,
  markAttendance,
  getAttendanceForEvent,
  TokenInvalidError,
  NotRegisteredError,
  AlreadyMarkedError,
  EventNotFoundError,
};