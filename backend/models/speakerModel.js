const { pool } = require('../config/db');

async function createSpeaker({ name, bio, contact, organization, designation }) {
  const [result] = await pool.query(
    'INSERT INTO speakers (name, bio, contact, organization, designation) VALUES (?, ?, ?, ?, ?)',
    [name, bio, contact, organization, designation]
  );
  return result.insertId;
}

async function getAllSpeakers() {
  const [rows] = await pool.query('SELECT * FROM speakers ORDER BY name ASC');
  return rows;
}

async function getSpeakerById(id) {
  const [rows] = await pool.query('SELECT * FROM speakers WHERE id = ?', [id]);
  return rows[0];
}

async function updateSpeaker(id, { name, bio, contact, organization, designation }) {
  await pool.query(
    'UPDATE speakers SET name = ?, bio = ?, contact = ?, organization = ?, designation = ? WHERE id = ?',
    [name, bio, contact, organization, designation, id]
  );
}

async function deleteSpeaker(id) {
  await pool.query('DELETE FROM speakers WHERE id = ?', [id]);
}

module.exports = { createSpeaker, getAllSpeakers, getSpeakerById, updateSpeaker, deleteSpeaker };