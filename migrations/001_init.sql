CREATE TABLE IF NOT EXISTS app_piggy_bank__piggy_banks (
  id           TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'money',
  balance      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_piggy_bank__transactions (
  id              TEXT NOT NULL,
  bank_id         TEXT NOT NULL,
  member_id       TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  note            TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL DEFAULT 'manual',
  created_at      TEXT NOT NULL,
  source_event_id TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_piggy_bank__processed_events (
  event_id     TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (event_id)
);
