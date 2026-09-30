// Runs every time the server starts.
// 1. Creates any missing tables and indexes (schema.sql is safe to rerun).
// 2. Adds the demo data if the database is empty, or every time when DEMO_MODE=true.
const fs = require('fs');
const path = require('path');
const seed = require('./seed');

async function setupDatabase(pool) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const demoMode = process.env.DEMO_MODE === 'true';

  if (rows[0].count === 0 || demoMode) {
    await seed(pool);
    console.log(demoMode ? 'Demo mode: data reset to the sample set' : 'Empty database: added sample data');
  }
}

module.exports = setupDatabase;
