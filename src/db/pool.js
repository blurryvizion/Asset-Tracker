// One shared connection pool for the whole app
const { Pool, types } = require('pg');

// Return DATE columns as plain "YYYY-MM-DD" text instead of JavaScript Date objects.
// Without this, time zones can shift a date by one day.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
