import { describe, it, expect } from "vitest";
import { fmtMoney, fmtTime, fmtBalance, fmtAmount, fmtDate } from "../src/logic.js";

// ── fmtMoney ──────────────────────────────────────────────────────────────────

describe("fmtMoney", () => {
  it("formats positive cents as dollars", () => {
    expect(fmtMoney(100)).toBe("$1.00");
    expect(fmtMoney(2550)).toBe("$25.50");
    expect(fmtMoney(0)).toBe("$0.00");
  });

  it("formats negative cents with a leading minus", () => {
    expect(fmtMoney(-100)).toBe("-$1.00");
    expect(fmtMoney(-50)).toBe("-$0.50");
  });

  it("formats whole dollar amounts", () => {
    expect(fmtMoney(500)).toBe("$5.00");
    expect(fmtMoney(10000)).toBe("$100.00");
  });
});

// ── fmtTime ───────────────────────────────────────────────────────────────────

describe("fmtTime", () => {
  it("formats minutes under one hour", () => {
    expect(fmtTime(30)).toBe("30m");
    expect(fmtTime(0)).toBe("0m");
  });

  it("formats whole hours", () => {
    expect(fmtTime(60)).toBe("1h");
    expect(fmtTime(120)).toBe("2h");
  });

  it("formats hours and remaining minutes", () => {
    expect(fmtTime(90)).toBe("1h 30m");
    expect(fmtTime(125)).toBe("2h 5m");
  });

  it("uses absolute value for negative inputs", () => {
    expect(fmtTime(-30)).toBe("30m");
    expect(fmtTime(-90)).toBe("1h 30m");
  });
});

// ── fmtBalance ────────────────────────────────────────────────────────────────

describe("fmtBalance", () => {
  it("formats a money bank balance as currency", () => {
    expect(fmtBalance({ type: "money", balance: 1500 })).toBe("$15.00");
    expect(fmtBalance({ type: "money", balance: -200 })).toBe("-$2.00");
  });

  it("formats a time bank balance as duration", () => {
    expect(fmtBalance({ type: "time", balance: 90 })).toBe("1h 30m");
    expect(fmtBalance({ type: "time", balance: 45 })).toBe("45m");
  });
});

// ── fmtAmount ─────────────────────────────────────────────────────────────────

describe("fmtAmount", () => {
  it("prefixes positive money amounts with +", () => {
    expect(fmtAmount(500, "money")).toBe("+$5.00");
  });

  it("prefixes negative money amounts with −", () => {
    expect(fmtAmount(-200, "money")).toBe("−$2.00");
  });

  it("prefixes positive time amounts with +", () => {
    expect(fmtAmount(60, "time")).toBe("+1h");
  });

  it("prefixes negative time amounts with −", () => {
    expect(fmtAmount(-30, "time")).toBe("−30m");
  });

  it("uses absolute value for the amount", () => {
    expect(fmtAmount(-500, "money")).toBe("−$5.00");
    expect(fmtAmount(500, "money")).toBe("+$5.00");
  });
});
