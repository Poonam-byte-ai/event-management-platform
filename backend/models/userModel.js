const { pool } = require('../config/db');

// All raw SQL for the users table lives here, so controllers never
// write SQL directly — keeps queries in one place and easy to reuse.

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function findByPrn(prn) {
  const [rows] = await pool.query('SELECT * FROM users WHERE prn = ?', [prn]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, prn, interests, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function createUser({ name, email, passwordHash, role, prn, interests }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role, prn, interests) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, passwordHash, role, prn || null, interests || null]
  );
  return result.insertId;
}

async function updateInterests(userId, interests) {
  await pool.query('UPDATE users SET interests = ? WHERE id = ?', [interests, userId]);
}

module.exports = { findByEmail, findByPrn, findById, createUser, updateInterests };
