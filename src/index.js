require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const pool = require('./db/pool');
const setupDatabase = require('./db/setup');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');

// Refuse to start in production with the example secret, since anyone could forge logins
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('change-this')) {
    console.error('JWT_SECRET must be set to a long random string in production.');
    process.exit(1);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production, the same server also sends the built React app.
// Any page that isn't an API route gets index.html, and React Router takes it from there.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Turn common database errors into friendly messages
app.use((err, req, res, next) => {
  if (err.code === '23505') return res.status(409).json({ error: 'That value already exists (duplicate tag or serial)' });
  if (err.code === '23514') return res.status(400).json({ error: 'Invalid value (check status or role)' });
  if (err.code === '22P02') return res.status(400).json({ error: 'Invalid input format' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// The database may still be starting up (Docker, or a sleeping cloud database), so try a few times
async function start() {
  for (let attempt = 1; ; attempt++) {
    try {
      await setupDatabase(pool);
      break;
    } catch (err) {
      if (attempt >= 10) {
        console.error('Could not set up the database:', err.message);
        process.exit(1);
      }
      console.log(`Database not ready (${err.code || err.message}), retrying in 2 seconds...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

start();
