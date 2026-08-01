/**
 * Deleting a bank used to be two sequential /api/db calls — transactions
 * first, then the bank — so a failure in between left a bank whose ledger had
 * already been destroyed but whose balance row survived, with no way for the
 * UI to reconcile the two. manifest delete_cascades removes the transactions
 * inside the bank delete's transactional batch instead.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const schema = readFileSync(join(__dirname, "../migrations/001_init.sql"), "utf-8");
const client = readFileSync(join(__dirname, "../src/index.html"), "utf-8");

describe("delete_cascades", () => {
  it("declares the bank's transactions and its retention rollup row", () => {
    expect(manifest.delete_cascades).toEqual({
      piggy_banks: [
        { table: "transactions", foreign_key: "bank_id" },
        { table: "bank_rollups", foreign_key: "bank_id" },
      ],
    });
  });

  it("the declared table and foreign key exist in the migrations", () => {
    expect(schema).toMatch(/CREATE TABLE IF NOT EXISTS app_piggy_bank__transactions\s*\(/);
    expect(schema).toMatch(/\bbank_id\b/);
  });

  it("deleting a bank is a single statement", () => {
    expect(client).not.toMatch(/DELETE FROM app_piggy_bank__transactions WHERE bank_id/);
    expect(client).toMatch(/DELETE FROM app_piggy_bank__piggy_banks WHERE id = \?/);
  });
});
