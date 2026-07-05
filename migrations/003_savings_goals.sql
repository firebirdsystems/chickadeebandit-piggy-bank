CREATE TABLE IF NOT EXISTS app_piggy_bank__savings_goals (
  id           TEXT NOT NULL,
  member_id    TEXT NOT NULL,
  bank_type    TEXT NOT NULL DEFAULT 'money',
  title        TEXT NOT NULL,
  target       INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_member_status
  ON app_piggy_bank__savings_goals(member_id, status);
