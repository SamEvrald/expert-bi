require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const sqlPath = path.resolve(__dirname, '..', 'db', 'schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Missing schema.sql at', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Creating/Updating schema...');
    await connection.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();