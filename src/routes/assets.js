const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Every asset route needs a logged-in user
router.use(requireAuth);

const FIELDS = [
  'asset_tag', 'type', 'brand', 'model', 'serial_number',
  'status', 'location', 'purchase_date', 'warranty_end', 'end_of_life',
];

// GET /api/assets?status=assigned&type=laptop&search=dell
router.get('/', async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      const n = values.length;
      conditions.push(`(asset_tag ILIKE $${n} OR brand ILIKE $${n} OR model ILIKE $${n} OR serial_number ILIKE $${n})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM assets ${where} ORDER BY asset_tag`, values);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/assets  (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    if (!req.body.asset_tag || !req.body.type) {
      return res.status(400).json({ error: 'asset_tag and type are required' });
    }
    const cols = FIELDS.filter((f) => req.body[f] !== undefined);
    const values = cols.map((f) => req.body[f]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);

    const { rows } = await pool.query(
      `INSERT INTO assets (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/assets/:id  (admin only) - update only the fields sent
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const cols = FIELDS.filter((f) => req.body[f] !== undefined);
    if (!cols.length) return res.status(400).json({ error: 'Nothing to update' });

    const values = cols.map((f) => req.body[f]);
    const sets = cols.map((f, i) => `${f} = $${i + 1}`);
    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE assets SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id  (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Asset not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
