CREATE INDEX IF NOT EXISTS app_piggy_bank__processed_events_retention_idx
  ON app_piggy_bank__processed_events (processed_at, event_id);
