/**
 * Migration 005 moves the balance from the stored piggy_banks.balance column to
 * a derivation: retention rollup + SUM(live transactions), aggregated in SQL.
 * The stored column had an unbatched insert+update pair (a failure in between
 * diverged ledger from balance forever, with no reconciler) and blocked
 * retention on the transactions table. The event-credit dedupe was also the
 * leaderboard double-count shape — a client-side SELECT-then-INSERT against a
 * NON-unique source_event_id index run by every adult tab — now structural via
 * a partial UNIQUE index, with existing duplicates collapsed in the migration.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const migration = readFileSync(join(__dirname, "../migrations/005_bank_rollups.sql"), "utf-8");
const client = readFileSync(join(__dirname, "../src/index.html"), "utf-8");
const widget = readFileSync(join(__dirname, "../src/widget.html"), "utf-8");

describe("transactions retention fold", () => {
  const retain = manifest.row_policies.transactions.retain_days;

  it("declares the fold into bank_rollups on both key columns", () => {
    expect(retain).toMatchObject({
      default: 730,
      timestamp_column: "created_at",
      override_key: "transaction_history",
      fold: {
        into_table: "bank_rollups",
        key_columns: { bank_id: "bank_id", member_id: "member_id" },
        sum_columns: { amount: "amount" },
        folded_through_column: "folded_through_at",
      },
    });
  });

  it("the rollup PK spans exactly the fold key columns", () => {
    expect(migration).toMatch(/PRIMARY KEY \(bank_id, member_id\)/);
    expect(migration).toMatch(/ON app_piggy_bank__transactions\(created_at, id\)/);
  });

  it("the rollup is governed, member-read, ratcheted, and cascaded with its bank", () => {
    expect(manifest.row_policies.bank_rollups).toEqual({ kind: "adult_writable", member_read_column: "member_id" });
    expect(manifest.member_references.bank_rollups).toMatchObject({ column: "member_id", on_removed: "delete" });
    expect(manifest.delete_cascades.piggy_banks.map((d) => d.table)).toContain("bank_rollups");
  });
});

describe("event-credit dedupe", () => {
  it("collapses existing duplicates before adding the partial UNIQUE index", () => {
    const dedupe = migration.indexOf("DELETE FROM app_piggy_bank__transactions");
    const unique = migration.indexOf("CREATE UNIQUE INDEX IF NOT EXISTS app_piggy_bank__transactions_source_event_uq");
    expect(dedupe).toBeGreaterThan(-1);
    expect(unique).toBeGreaterThan(dedupe);
    expect(migration).toMatch(/WHERE source_event_id IS NOT NULL/);
  });
});

describe("derived balance", () => {
  it("the client derives balance from rollup + SQL tail sum and never writes the stored column", () => {
    expect(client).toMatch(/SELECT bank_id, COALESCE\(SUM\(amount\), 0\) AS tail FROM app_piggy_bank__transactions GROUP BY bank_id/);
    expect(client).toMatch(/SELECT bank_id, amount FROM app_piggy_bank__bank_rollups/);
    expect(client).not.toMatch(/SET balance = balance \+ \?/);
  });

  it("event credits are a single INSERT with the UNIQUE index as the race guard", () => {
    // No separate balance UPDATE remains anywhere; the two credit paths catch
    // the concurrent-duplicate INSERT failure instead of double-crediting.
    const credits = client.match(/source_event_id\)\s*\n\s*VALUES/g) ?? [];
    expect(credits.length).toBe(2);
    expect(client).toMatch(/concurrent tab already credited this event/);
  });

  it("the widget derives balances the same way", () => {
    expect(widget).toMatch(/COALESCE\(SUM\(amount\), 0\) AS tail/);
    expect(widget).toMatch(/app_piggy_bank__bank_rollups/);
    expect(widget).not.toMatch(/SELECT member_id, type, balance FROM/);
  });
});
