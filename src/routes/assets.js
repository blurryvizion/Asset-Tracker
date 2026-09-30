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

// Each asset plus the person who has it right now (if anyone).
// An "open" assignment is one with no checked_in_at yet.
const SELECT_ASSETS = `
  SELECT a.*, cur.user_id AS assigned_to_id, u.name AS assigned_to_name, cur.checked_out_at
  FROM assets a
  LEFT JOIN assignments cur ON cur.asset_id = a.id AND cur.checked_in_at IS NULL
  LEFT JOIN users u ON u.id = cur.user_id
`;

// GET /api/assets?status=assigned&type=laptop&search=dell&mine=1
router.get('/', async (req, res, next) => {
  try {
    const { status, type, search, mine } = req.query;
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }
    if (type) {
      values.push(type);
      conditions.push(`a.type = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      const n = values.length;
      conditions.push(`(a.asset_tag ILIKE $${n} OR a.brand ILIKE $${n} OR a.model ILIKE $${n} OR a.serial_number ILIKE $${n} OR u.name ILIKE $${n})`);
    }
    if (mine) {
      values.push(req.user.id);
      conditions.push(`cur.user_id = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`${SELECT_ASSETS} ${where} ORDER BY a.asset_tag`, values);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${SELECT_ASSETS} WHERE a.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:id/assignments - everyone who has had this asset, newest first
router.get('/:id/assignments', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.user_id, u.name AS user_name, u.department,
              s.checked_out_at, s.checked_in_at, s.notes
       FROM assignments s
       JOIN users u ON u.id = s.user_id
       WHERE s.asset_id = $1
       ORDER BY s.checked_out_at DESC`,
      [req.params.id]
    );
    res.json(rows);
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
    if (req.body.status === 'assigned') {
      return res.status(400).json({ error: 'Add the asset first, then use check out to assign it' });
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

    // "Assigned" is controlled by check out / check in, so the edit form can't set or clear it
    if (req.body.status !== undefined) {
      const current = await pool.query('SELECT status FROM assets WHERE id = $1', [req.params.id]);
      if (!current.rows[0]) return res.status(404).json({ error: 'Asset not found' });
      const was = current.rows[0].status;
      if (req.body.status !== was && (was === 'assigned' || req.body.status === 'assigned')) {
        return res.status(400).json({ error: 'Use check out or check in to change who has this asset' });
      }
    }

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

// POST /api/assets/:id/checkout  { user_id, notes }  (admin only)
router.post('/:id/checkout', requireAdmin, async (req, res, next) => {
  const { user_id, notes } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Choose who is getting this asset' });

  // A transaction makes both changes happen together, or neither does
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE locks the row so two admins can't check it out at the same moment
    const { rows } = await client.query('SELECT status FROM assets WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }
    if (rows[0].status !== 'in_stock') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only in-stock assets can be checked out' });
    }

    const user = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (!user.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'That user does not exist' });
    }

    await client.query(
      'INSERT INTO assignments (asset_id, user_id, notes) VALUES ($1, $2, $3)',
      [req.params.id, user_id, notes || null]
    );
    await client.query(
      "UPDATE assets SET status = 'assigned', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/assets/:id/checkin  { notes }  (admin only)
router.post('/:id/checkin', requireAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE assignments
       SET checked_in_at = NOW(),
           notes = CASE WHEN $2::text IS NULL THEN notes
                        ELSE concat_ws(' / ', notes, 'Returned: ' || $2::text) END
       WHERE asset_id = $1 AND checked_in_at IS NULL
       RETURNING id`,
      [req.params.id, req.body.notes || null]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This asset is not checked out' });
    }

    await client.query(
      "UPDATE assets SET status = 'in_stock', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
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
