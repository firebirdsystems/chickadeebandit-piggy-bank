CREATE INDEX IF NOT EXISTS idx_piggy_banks_member_id
  ON app_piggy_bank__piggy_banks(member_id);

CREATE INDEX IF NOT EXISTS idx_transactions_bank_id
  ON app_piggy_bank__transactions(bank_id);

CREATE INDEX IF NOT EXISTS idx_transactions_source_event_id
  ON app_piggy_bank__transactions(source_event_id);
