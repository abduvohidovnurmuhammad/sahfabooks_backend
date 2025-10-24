const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL ga ulanildi!');
});

pool.on('error', (err) => {
  console.error('❌ Database xatolik:', err);
});

module.exports = pool;