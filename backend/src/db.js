const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

const testDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connecté');
    return true;
  } catch (err) {
    console.error('PostgreSQL erreur:', err.message);
    return false;
  }
};

module.exports = { pool, testDB };
