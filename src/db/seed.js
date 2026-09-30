// Fills the database with fake users and assets so you can test right away.
// Run with: npm run seed
// Dates are relative to today, so the demo always has a mix of
// healthy, expiring-soon, and expired warranties.
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function seed(pool) {
  const hash = await bcrypt.hash('password123', 10);

  await pool.query('TRUNCATE assignments, assets, users RESTART IDENTITY CASCADE');

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department) VALUES
     ('Admin User', 'admin@example.com', $1, 'admin', 'IT'),
     ('Jane Employee', 'jane@example.com', $1, 'employee', 'Marketing'),
     ('Sam Employee', 'sam@example.com', $1, 'employee', 'Finance')`,
    [hash]
  );

  // d(n) = today plus n days (negative = in the past)
  const d = (n) => `CURRENT_DATE + ${n}`;
  await pool.query(`
    INSERT INTO assets (asset_tag, type, brand, model, serial_number, status, location, purchase_date, warranty_end, end_of_life) VALUES
    ('LT-0001', 'laptop',  'Dell',    'Latitude 5440', 'DL5440A1', 'assigned',  'HQ Floor 2', ${d(-990)}, ${d(105)},  ${d(470)}),
    ('LT-0002', 'laptop',  'Lenovo',  'ThinkPad T14',  'LNT14B22', 'in_stock',  'IT Storage', ${d(-1035)}, ${d(32)},  ${d(245)}),
    ('LT-0003', 'laptop',  'Apple',   'MacBook Air',   'APMBA333', 'in_repair', 'IT Storage', ${d(-1480)}, ${d(-385)}, ${d(71)}),
    ('MN-0001', 'monitor', 'LG',      '27UK850',       'LG27K001', 'assigned',  'HQ Floor 2', ${d(-1290)}, ${d(-194)}, ${d(900)}),
    ('MN-0002', 'monitor', 'Samsung', 'S24R350',       'SM24R002', 'in_stock',  'IT Storage', ${d(-878)},  ${d(582)},  ${d(1313)}),
    ('PH-0001', 'phone',   'Apple',   'iPhone 14',     'APIP1401', 'assigned',  'Remote',     ${d(-1095)}, ${d(-730)}, ${d(40)}),
    ('PH-0002', 'phone',   'Google',  'Pixel 8',       'GGPX8002', 'retired',   'IT Storage', ${d(-2055)}, ${d(-1690)}, ${d(-960)})
  `);

  // Assignment history. Rows with a checked_in_at are past assignments;
  // rows without one are who has the device right now.
  await pool.query(`
    INSERT INTO assignments (asset_id, user_id, checked_out_at, checked_in_at, notes) VALUES
    (1, 3, NOW() - INTERVAL '400 days', NOW() - INTERVAL '200 days', 'Temporary loaner'),
    (1, 2, NOW() - INTERVAL '190 days', NULL, 'Standard laptop for new hire'),
    (4, 2, NOW() - INTERVAL '180 days', NULL, 'Second monitor'),
    (3, 2, NOW() - INTERVAL '500 days', NOW() - INTERVAL '30 days', 'Returned: screen flickering'),
    (6, 3, NOW() - INTERVAL '90 days', NULL, 'Work phone')
  `);
}

module.exports = seed;

// Only runs when started with "npm run seed", not when another file requires it
if (require.main === module) {
  const pool = require('./pool');
  seed(pool)
    .then(() => console.log('Seed complete. Log in as admin@example.com / password123'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
