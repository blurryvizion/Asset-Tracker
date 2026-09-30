# IT Asset Tracker

Full-stack app for managing company IT equipment. Tracks each device, who has it, its full assignment history, and its warranty and end-of-life dates.

**Stack:** React (Vite), Node.js, Express, PostgreSQL, JWT auth, Docker

**Live demo:** _add your Render link here_ (the free server sleeps when idle, so the first load can take about a minute)

## Run it locally

You need Node.js 18+ and Docker Desktop.

```bash
npm install
cp .env.example .env        # then change JWT_SECRET
docker compose up -d        # starts Postgres
npm run dev                 # creates tables, adds sample data if empty, starts the API on http://localhost:4000
```

Run `npm run seed` any time to reset the sample data.

Then, in a second terminal, start the React frontend:

```bash
cd client
npm install
npm run dev                 # opens on http://localhost:5173
```

Test login: `admin@example.com` / `password123` (admin) or `jane@example.com` / `password123` (employee). The login page also has one-click demo buttons.

## Features

- **Login** with demo account buttons
- **Asset list** with search (including by person), type and status filters, and warranty warnings (expired or ending within 90 days)
- **My devices** view so employees can see what's checked out to them
- **Check out and check in** devices, with optional notes
- **Assignment history** showing everyone who has had each device
- **Add / edit form** shared by both actions

Employees can view everything but only admins see the add, edit, delete, and check out controls. The backend enforces this too, so hiding buttons is not the only protection.

### How check out works

Check out and check in each run as a single database transaction: the assignment record and the asset's status change together or not at all. The asset row is locked during check out so two admins can't assign the same device at the same moment, and a unique index guarantees a device is never with two people at once. The edit form can't set or clear "Assigned" directly, so the status always matches the assignment history.

## API

| Method | Route | Who | What it does |
|---|---|---|---|
| GET | `/api/health` | anyone | Check the server is up |
| POST | `/api/auth/login` | anyone | Log in, get a token |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/assets` | logged in | List assets with current holder. Filters: `?status=`, `?type=`, `?search=`, `?mine=1` |
| GET | `/api/assets/:id` | logged in | One asset with current holder |
| GET | `/api/assets/:id/assignments` | logged in | Assignment history |
| POST | `/api/assets` | admin | Add an asset |
| PUT | `/api/assets/:id` | admin | Update an asset |
| DELETE | `/api/assets/:id` | admin | Delete an asset |
| POST | `/api/assets/:id/checkout` | admin | Assign to a user `{ user_id, notes }` |
| POST | `/api/assets/:id/checkin` | admin | Return to stock `{ notes }` |
| GET | `/api/users` | admin | List users (for the check out picker) |

Send the token as `Authorization: Bearer <token>` on protected routes.

## Project structure

```
src/
  index.js            app setup and error handling
  db/schema.sql       tables: users, assets, assignments
  db/setup.js         creates tables and sample data on startup
  db/pool.js          database connection
  db/seed.js          fake data
  middleware/auth.js  login check and admin check
  routes/auth.js      login routes
  routes/assets.js    asset, check out, and check in routes
  routes/users.js     user list
client/
  src/pages/          login, asset list, asset details, add/edit form
  src/components/     layout, asset label, status badge, assignment panel
```

## Deployment

The app ships as one Docker image (see `Dockerfile`). A two-stage build compiles the React app, then copies only the built files and production dependencies into a small Node image. In production, Express serves both the API and the React app from one URL.

Hosted on **Render** (web service from the Dockerfile) with a **Neon** Postgres database.

On every start the server creates any missing tables (`src/db/setup.js`) and adds sample data if the database is empty. With `DEMO_MODE=true`, it resets the sample data on each start, so the public demo cleans itself up whenever the free server wakes from sleep. The server also refuses to start in production without a strong `JWT_SECRET`.

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `NODE_ENV` | Set to `production` by the Dockerfile |
| `DEMO_MODE` | `true` to reset sample data on every start |

## Coming next

- Tests and GitHub Actions
