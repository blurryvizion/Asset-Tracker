# IT Asset Tracker

Full-stack app for tracking company IT equipment: who has each device, its assignment history, and its warranty and end-of-life dates.

**Live demo:** https://asset-tracker-2bbc.onrender.com (free server, first load can take about a minute)

**Stack:** React (Vite), Node.js, Express, PostgreSQL, JWT auth, Docker, Render, Neon

## Features

- Admin and employee roles, enforced on the backend
- Search and filter devices, with warranty warnings
- Check out and check in devices, with full assignment history
- "My devices" view for employees
- One-click demo login

## How check out works

Check out and check in run as database transactions with row locking, and a unique index makes sure a device is never assigned to two people at once.

## Run it locally

Needs Node.js 18+ and Docker Desktop.

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 and use the demo login buttons.

## Deployment

One Docker image serves both the API and the React app. Hosted on Render with a Neon Postgres database. Set `DATABASE_URL`, `JWT_SECRET`, and `DEMO_MODE=true` (resets sample data on each restart).
