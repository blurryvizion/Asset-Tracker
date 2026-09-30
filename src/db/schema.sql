-- Users who can log in. Roles: admin (full control) or employee (view only)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipment the company owns
CREATE TABLE IF NOT EXISTS assets (
  id            SERIAL PRIMARY KEY,
  asset_tag     TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,              -- laptop, monitor, phone, etc.
  brand         TEXT,
  model         TEXT,
  serial_number TEXT UNIQUE,
  status        TEXT NOT NULL DEFAULT 'in_stock'
                CHECK (status IN ('in_stock', 'assigned', 'in_repair', 'retired')),
  location      TEXT,
  purchase_date DATE,
  warranty_end  DATE,
  end_of_life   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- History of who had which asset and when
CREATE TABLE IF NOT EXISTS assignments (
  id             SERIAL PRIMARY KEY,
  asset_id       INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at  TIMESTAMPTZ,              -- NULL means the user still has it
  notes          TEXT
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assignments_asset ON assignments(asset_id);

-- An asset can only be with one person at a time:
-- at most one assignment per asset that hasn't been checked in yet
CREATE UNIQUE INDEX IF NOT EXISTS one_open_assignment_per_asset
  ON assignments(asset_id) WHERE checked_in_at IS NULL;
