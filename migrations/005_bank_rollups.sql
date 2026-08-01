-- Balance derivation moves from the stored piggy_banks.balance column to
-- "retention rollup + SUM(live transactions)". The stored column had two
-- defects: the insert+update pair was unbatched (a failure in between diverged
-- ledger from balance with no reconciler), and it blocked retention on
-- transactions outright. piggy_banks.balance remains in the schema (append-only
-- migrations) but is no longer read or written after v005.
--
-- bank_rollups is written ONLY by the hub retention runner: the manifest's
-- retain_days.fold on transactions accumulates each expiring batch here inside
-- the same transaction as its delete, so the derived balance never moves when
-- history ages out. PK spans both fold key columns (the runner's ON CONFLICT
-- target); member_id rides along so member_read_column scopes a kid to their
-- own row, same as piggy_banks itself.
CREATE TABLE IF NOT EXISTS app_piggy_bank__bank_rollups (
  bank_id           TEXT NOT NULL,
  member_id         TEXT NOT NULL,
  amount            INTEGER NOT NULL DEFAULT 0,
  folded_through_at TEXT,
  PRIMARY KEY (bank_id, member_id)
);

-- The event-credit dedupe was a client-side SELECT-then-INSERT against a
-- NON-unique index — the leaderboard double-count shape: two adult tabs both
-- found no row and both credited the event. Collapse any existing duplicates
-- (keep the earliest; with the derived balance this also corrects the
-- double-credit), then make the guarantee structural. Idempotent, so the
-- statement-by-statement replay contract holds.
DELETE FROM app_piggy_bank__transactions
  WHERE source_event_id IS NOT NULL
    AND rowid NOT IN (
      SELECT MIN(rowid) FROM app_piggy_bank__transactions
       WHERE source_event_id IS NOT NULL GROUP BY source_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS app_piggy_bank__transactions_source_event_uq
  ON app_piggy_bank__transactions(source_event_id)
  WHERE source_event_id IS NOT NULL;

-- Sweep index for the transactions retention window.
CREATE INDEX IF NOT EXISTS app_piggy_bank__transactions_retention_idx
  ON app_piggy_bank__transactions(created_at, id);
