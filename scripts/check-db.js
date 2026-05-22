const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
  });

  try {
    const [rows] = await connection.query('SELECT * FROM facilities WHERE id = ?', [63]);
    console.log('Facility 63 data:', rows[0]);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await connection.end();
  }
}

run();
