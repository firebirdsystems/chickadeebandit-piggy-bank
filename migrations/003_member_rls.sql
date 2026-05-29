-- Enforce member-level read isolation so children cannot see other members' banks
-- or transactions by crafting raw SQL queries.
--
-- Adults (app.member_role != 'child') see all rows.
-- Children see only rows where member_id matches their own app.member_id.
-- Empty app.member_id means demo/unauthenticated mode — no restriction applied.
--
-- This is a RESTRICTIVE policy: it ANDs with the existing household_isolation
-- PERMISSIVE policy, so both household AND member constraints must pass.

DROP POLICY IF EXISTS member_access ON piggy_banks;
CREATE POLICY member_access ON piggy_banks
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
    OR member_id = current_setting('app.member_id', true)
  );

DROP POLICY IF EXISTS member_access ON transactions;
CREATE POLICY member_access ON transactions
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
    OR member_id = current_setting('app.member_id', true)
  );
