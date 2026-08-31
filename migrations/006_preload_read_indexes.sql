-- Index the manifest `preload` read, which the hub runs server-side while
-- rendering this app's document — on every launch, for every household.
--
-- preload.savings_goals reads the active goals in created order. Completed and
-- abandoned goals stay in the table, so the scan grew with every goal the
-- family ever set. `status` is plaintext at rest, so it leads the index and
-- created_at follows to serve the ordering.
CREATE INDEX IF NOT EXISTS app_piggy_bank__savings_goals_status_created_idx
  ON app_piggy_bank__savings_goals (status, created_at);
