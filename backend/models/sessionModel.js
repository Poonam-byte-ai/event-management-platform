const { pool } = require('../config/db');

// The core business rule: does a proposed [start, end) window overlap any
// EXISTING session in the same event? excludeSessionId lets an update check
// against every other session without flagging itself as a conflict.
async function findOverlappingSession(eventId, startTime, endTime, excludeSessionId = null) {
  let query = `
    SELECT * FROM sessions
    WHERE event_id = ?
      AND start_time < ?
      AND end_time > ?
  `;
  const params = [eventId, endTime, startTime];

  if (excludeSessionId) {
    query += ' AND id != ?';
    params.push(excludeSessionId);
  }

  const [rows] = await pool.query(query, params);
  return rows[0]; // undefined if no conflict
}

async function createSession({ eventId, speakerId, sessionName, startTime, endTime }) {
  const [result] = await pool.query(
    'INSERT INTO sessions (event_id, speaker_id, session_name, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
    [eventId, speakerId, sessionName, startTime, endTime]
  );
  return result.insertId;
}

async function getSessionsByEvent(eventId) {
  const [rows] = await pool.query(`
    SELECT s.*, sp.name AS speaker_name, sp.organization, sp.designation
    FROM sessions s
    JOIN speakers sp ON sp.id = s.speaker_id
    WHERE s.event_id = ?
    ORDER BY s.start_time ASC
  `, [eventId]);
  return rows;
}

async function getSessionById(id) {
  const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ?', [id]);
  return rows[0];
}

async function updateSession(id, { speakerId, sessionName, startTime, endTime }) {
  await pool.query(
    'UPDATE sessions SET speaker_id = ?, session_name = ?, start_time = ?, end_time = ? WHERE id = ?',
    [speakerId, sessionName, startTime, endTime, id]
  );
}

module.exports = {
  findOverlappingSession,
  createSession,
  getSessionsByEvent,
  getSessionById,
  updateSession,
};
