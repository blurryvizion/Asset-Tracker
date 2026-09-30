# IT Asset Tracker (API)

Backend for an IT asset management app. Tracks company equipment, who has it, and its warranty and end-of-life dates.

**Stack:** React (Vite), Node.js, Express, PostgreSQL, JWT auth, Docker

## Run it locally

You need Node.js 18+ and Docker Desktop.

```bash
npm install
cp .env.example .env        # then change JWT_SECRET
docker compose up -d        # starts Postgres and creates the tables
npm run seed                # adds fake users and assets
npm run dev                 # starts the API on http://localhost:4000
```

Then, in a second terminal, start the React frontend:

```bash
cd client
npm install
npm run dev                 # opens on http://localhost:5173
```

Test login: `admin@example.com` / `password123` (admin) or `jane@example.com` / `password123` (employee). The login page also has one-click demo buttons.

## Frontend pages

- **Login** with demo account buttons
- **Asset list** with search, type and status filters, and warranty warnings (expired or ending within 90 days)
- **Asset details** with a printed asset label look, plus edit and delete for admins
- **Add / edit form** shared by both actions

Employees can view everything but only admins see the add, edit, and delete controls. The backend enforces this too, so hiding buttons is not the only protection.

## API

| Method | Route | Who | What it does |
|---|---|---|---|
| GET | `/api/health` | anyone | Check the server is up |
| POST | `/api/auth/login` | anyone | Log in, get a token |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/assets` | logged in | List assets. Filters: `?status=`, `?type=`, `?search=` |
| GET | `/api/assets/:id` | logged in | One asset |
| POST | `/api/assets` | admin | Add an asset |
| PUT | `/api/assets/:id` | admin | Update an asset |
| DELETE | `/api/assets/:id` | admin | Delete an asset |

Send the token as `Authorization: Bearer <token>` on protected routes.

## Project structure

```
src/
  index.js            app setup and error handling
  db/schema.sql       tables: users, assets, assignments
  db/pool.js          database connection
  db/seed.js          fake data
  middleware/auth.js  login check and admin check
  routes/auth.js      login routes
  routes/assets.js    asset CRUD routes
```

## Coming next

- Check out / check in routes and assignment history (week 3)
- Tests, GitHub Actions, and deployment
