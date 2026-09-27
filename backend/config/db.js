const mysql = require('mysql2/promise');
require('dotenv').config();

// A "pool" hands out reusable connections instead of opening a brand-new
// TCP connection to MySQL on every single API request. Under concurrent
// requests (e.g. many participants scanning attendance around the same
// time) this is both faster and avoids exhausting MySQL's max connections.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Simple helper you can call at startup to fail fast if credentials/host
// are wrong, instead of only finding out on the first API call.
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
}

module.exports = { pool, testConnection };
