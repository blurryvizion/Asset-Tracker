// Fills the database with fake users and assets so you can test right away.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const hash = await bcrypt.hash('password123', 10);

  await pool.query('TRUNCATE assignments, assets, users RESTART IDENTITY CASCADE');

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department) VALUES
     ('Admin User', 'admin@example.com', $1, 'admin', 'IT'),
     ('Jane Employee', 'jane@example.com', $1, 'employee', 'Marketing'),
     ('Sam Employee', 'sam@example.com', $1, 'employee', 'Finance')`,
    [hash]
  );

  await pool.query(`
    INSERT INTO assets (asset_tag, type, brand, model, serial_number, status, location, purchase_date, warranty_end, end_of_life) VALUES
    ('LT-0001', 'laptop',  'Dell',    'Latitude 5440', 'DL5440A1', 'assigned',  'HQ Floor 2', '2024-01-15', '2027-01-15', '2028-01-15'),
    ('LT-0002', 'laptop',  'Lenovo',  'ThinkPad T14',  'LNT14B22', 'in_stock',  'IT Storage', '2023-06-01', '2026-11-01', '2027-06-01'),
    ('LT-0003', 'laptop',  'Apple',   'MacBook Air',   'APMBA333', 'in_repair', 'IT Storage', '2022-09-10', '2025-09-10', '2026-12-10'),
    ('MN-0001', 'monitor', 'LG',      '27UK850',       'LG27K001', 'assigned',  'HQ Floor 2', '2023-03-20', '2026-03-20', '2029-03-20'),
    ('MN-0002', 'monitor', 'Samsung', 'S24R350',       'SM24R002', 'in_stock',  'IT Storage', '2024-05-05', '2027-05-05', '2030-05-05'),
    ('PH-0001', 'phone',   'Apple',   'iPhone 14',     'APIP1401', 'assigned',  'Remote',     '2023-10-01', '2024-10-01', '2026-10-01'),
    ('PH-0002', 'phone',   'Google',  'Pixel 8',       'GGPX8002', 'retired',   'IT Storage', '2021-02-14', '2022-02-14', '2024-02-14')
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

  console.log('Seed complete. Log in as admin@example.com / password123');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
