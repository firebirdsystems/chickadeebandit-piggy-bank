-- Allowance deposits moved from a client-side import to two hub automations
-- (allowance.earned → deposit, allowance.earned → deposit_minutes), which the
-- hub runs on its own. One event can now credit BOTH banks — the "both"
-- reward type pays money and screen time — so the two deposits need two
-- dedupe keys. source_event_id keeps the money deposit (and the withdraw's
-- reward event); screen_time_event_id is the screen-time deposit's.
--
-- The old import wrote both deposits under source_event_id, and the partial
-- UNIQUE index below it refused the second: a "both" household never got its
-- screen time. That import is gone; this is the key it lacked.
ALTER TABLE app_piggy_bank__transactions ADD COLUMN screen_time_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS app_piggy_bank__transactions_screen_time_event_uq
  ON app_piggy_bank__transactions(screen_time_event_id)
  WHERE screen_time_event_id IS NOT NULL;
