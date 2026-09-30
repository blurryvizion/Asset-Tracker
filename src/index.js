require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);

// Turn common database errors into friendly messages
app.use((err, req, res, next) => {
  if (err.code === '23505') return res.status(409).json({ error: 'That value already exists (duplicate tag or serial)' });
  if (err.code === '23514') return res.status(400).json({ error: 'Invalid value (check status or role)' });
  if (err.code === '22P02') return res.status(400).json({ error: 'Invalid input format' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
