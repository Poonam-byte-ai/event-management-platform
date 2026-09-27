const { pool } = require('../config/db');

async function createEvent({ title, description, capacity, eventDate, eventTime, venue, eventType, tags, createdBy }) {
  const [result] = await pool.query(
    `INSERT INTO events (title, description, capacity, event_date, event_time, venue, event_type, tags, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, capacity, eventDate, eventTime, venue, eventType, tags || null, createdBy]
  );
  return result.insertId;
}

// LEFT JOIN + COUNT gives every event's current registration count in one
// query, so "seats remaining" is always computed live, never stored/stale.
async function getAllEvents() {
  const [rows] = await pool.query(`
    SELECT e.*,
      COUNT(r.id) AS registered_count,
      (e.capacity - COUNT(r.id)) AS seats_remaining
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.event_date ASC, e.event_time ASC
  `);
  return rows;
}

async function getEventById(id) {
  const [rows] = await pool.query(`
    SELECT e.*,
      COUNT(r.id) AS registered_count,
      (e.capacity - COUNT(r.id)) AS seats_remaining
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `, [id]);
  return rows[0];
}

// Same shape as getAllEvents, but scoped to one admin's own events — used
// for the admin "Manage Events" list so admins only see/manage what they created.
async function getEventsByAdmin(adminId) {
  const [rows] = await pool.query(`
    SELECT e.*,
      COUNT(r.id) AS registered_count,
      (e.capacity - COUNT(r.id)) AS seats_remaining
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    WHERE e.created_by = ?
    GROUP BY e.id
    ORDER BY e.event_date ASC, e.event_time ASC
  `, [adminId]);
  return rows;
}

async function updateEvent(id, fields) {
  const { title, description, capacity, eventDate, eventTime, venue, eventType, tags } = fields;
  await pool.query(
    `UPDATE events
     SET title = ?, description = ?, capacity = ?, event_date = ?, event_time = ?, venue = ?, event_type = ?, tags = ?
     WHERE id = ?`,
    [title, description, capacity, eventDate, eventTime, venue, eventType, tags || null, id]
  );
}

async function setRegistrationOpen(id, isOpen) {
  await pool.query('UPDATE events SET registration_open = ? WHERE id = ?', [isOpen, id]);
}

// Deletes the event row itself. Sessions, registrations, attendance and
// feedback all reference events with ON DELETE CASCADE in the schema, so
// this cleanly removes everything tied to the event too — the admin can
// delete an event "at any time", regardless of registration status.
async function deleteEvent(id) {
  await pool.query('DELETE FROM events WHERE id = ?', [id]);
}

async function countRegistrations(eventId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
    [eventId]
  );
  return rows[0].count;
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventsByAdmin,
  getEventById,
  updateEvent,
  setRegistrationOpen,
  deleteEvent,
  countRegistrations,
};