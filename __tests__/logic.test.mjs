import { describe, it, expect } from "vitest";
import { fmtMoney, fmtTime, fmtBalance, fmtAmount, fmtDate, goalProgress, remainingForGoal, managesBanks, hasNoChildren, serialByKey, pendingTotal, withPending } from "../src/logic.js";

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

// ── savings goals ─────────────────────────────────────────────────────────────

describe("savings goals", () => {
  it("calculates clamped progress from bank balance and target", () => {
    expect(goalProgress({ target: 1000 }, { balance: 250 })).toBe(25);
    expect(goalProgress({ target: 1000 }, { balance: 1200 })).toBe(100);
    expect(goalProgress({ target: 0 }, { balance: 1200 })).toBe(0);
  });

  it("calculates remaining balance without going negative", () => {
    expect(remainingForGoal({ target: 1000 }, { balance: 250 })).toBe(750);
    expect(remainingForGoal({ target: 1000 }, { balance: 1200 })).toBe(0);
  });
});

describe("managesBanks", () => {
  const adult = { id: "a1", role: "adult" };
  const child = { id: "c1", role: "child" };

  it("any adult manages in a household, which is the default", () => {
    expect(managesBanks(adult)).toBe(true);
    expect(managesBanks(child)).toBe(false);
    expect(managesBanks(null)).toBe(false);
  });

  it("only the steward manages in a shared space", () => {
    expect(managesBanks(adult, { tenantKind: "shared_space", isAdmin: false })).toBe(false);
    expect(managesBanks(adult, { tenantKind: "shared_space", isAdmin: true })).toBe(true);
  });

  it("being a household's admin does not make a child a manager", () => {
    expect(managesBanks(child, { tenantKind: "household", isAdmin: true })).toBe(false);
  });
});

describe("hasNoChildren", () => {
  it("is true for a loaded list of adults only", () => {
    expect(hasNoChildren([{ id: "a1", role: "adult" }, { id: "a2", role: "admin" }])).toBe(true);
  });

  it("is false once any member is not an adult", () => {
    expect(hasNoChildren([{ id: "a1", role: "adult" }, { id: "c1", role: "child" }])).toBe(false);
  });

  it("is false for an empty list, which means the members did not load", () => {
    expect(hasNoChildren([])).toBe(false);
  });
});

describe("serialByKey", () => {
  const gate = () => { let open; const wait = new Promise(resolve => { open = resolve; }); return { wait, open }; };

  it("starts a key's second task only once its first has settled", async () => {
    const inTurn = serialByKey();
    const first = gate();
    const seen = [];
    const a = inTurn("bank", async () => { seen.push("a starts"); await first.wait; seen.push("a ends"); });
    const b = inTurn("bank", async () => { seen.push("b starts"); });
    await Promise.resolve();
    expect(seen).toEqual(["a starts"]);
    first.open();
    await Promise.all([a, b]);
    expect(seen).toEqual(["a starts", "a ends", "b starts"]);
  });

  it("does not make one key wait for another", async () => {
    const inTurn = serialByKey();
    const first = gate();
    const seen = [];
    const a = inTurn("one", async () => { await first.wait; seen.push("one"); });
    await inTurn("two", async () => { seen.push("two"); });
    expect(seen).toEqual(["two"]);
    first.open();
    await a;
  });

  it("rejects for the task that failed and still runs the next", async () => {
    const inTurn = serialByKey();
    const a = inTurn("bank", async () => { throw new Error("refused"); });
    const b = inTurn("bank", async () => "done");
    await expect(a).rejects.toThrow("refused");
    await expect(b).resolves.toBe("done");
  });
});

describe("pendingTotal", () => {
  it("sums the amounts still waiting, withdrawals included", () => {
    const waiting = new Map([["t1", { id: "t1", amount: 20 }], ["t2", { id: "t2", amount: -5 }]]);
    expect(pendingTotal(waiting)).toBe(15);
  });

  it("adds nothing when nothing is waiting", () => {
    expect(pendingTotal(new Map())).toBe(0);
    expect(pendingTotal(undefined)).toBe(0);
  });
});

describe("withPending", () => {
  const ledger = [{ id: "l2" }, { id: "l1" }];

  it("keeps waiting rows at the top, newest first", () => {
    const waiting = new Map([["t1", { id: "t1" }], ["t2", { id: "t2" }]]);
    expect(withPending(ledger, waiting, 10).map(row => row.id)).toEqual(["t2", "t1", "l2", "l1"]);
  });

  it("does not show a waiting row the ledger already returned", () => {
    const waiting = new Map([["l2", { id: "l2" }]]);
    expect(withPending(ledger, waiting, 10).map(row => row.id)).toEqual(["l2", "l1"]);
  });

  it("cuts to the limit and takes no pending map as none", () => {
    expect(withPending(ledger, new Map([["t1", { id: "t1" }]]), 2).map(row => row.id)).toEqual(["t1", "l2"]);
    expect(withPending(ledger, undefined, 10)).toEqual(ledger);
  });
});
