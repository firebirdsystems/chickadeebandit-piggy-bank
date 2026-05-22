CREATE TABLE IF NOT EXISTS piggy_banks (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'money',
  balance      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS transactions (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  bank_id      TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  source       TEXT NOT NULL DEFAULT 'manual',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS processed_events (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  event_id     TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (household_id, event_id)
);
