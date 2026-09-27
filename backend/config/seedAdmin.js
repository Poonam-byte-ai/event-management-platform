// Run this ONCE to create your admin login: node config/seedAdmin.js
// Edit the values below before running, then you can delete/ignore this file.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@college.edu';
const ADMIN_PASSWORD = 'Admin@123'; // change this, then use it to log in

async function seed() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  try {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
    );
    console.log('Admin created:', ADMIN_EMAIL, '/ password:', ADMIN_PASSWORD);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
  } finally {
    process.exit();
  }
}

seed();
