const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users  (admin only) - used for the "check out to" picker
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department FROM users ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
