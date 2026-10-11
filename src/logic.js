/**
 * Pure business logic for the Piggy Bank app.
 * No DOM, no fetch — importable in both browser and test environments.
 */

export function fmtMoney(cents) {
  const neg = cents < 0;
  return `${neg ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function fmtTime(minutes) {
  const m = Math.abs(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function fmtBalance(bank) {
  return bank.type === "money" ? fmtMoney(bank.balance) : fmtTime(bank.balance);
}

export function fmtAmount(amount, type) {
  const s = type === "money" ? fmtMoney(Math.abs(amount)) : fmtTime(Math.abs(amount));
  return (amount >= 0 ? "+" : "−") + s;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function goalProgress(goal, bank) {
  const target = Math.max(0, Number(goal?.target ?? 0));
  if (target === 0) return 0;
  const balance = Math.max(0, Number(bank?.balance ?? 0));
  return Math.min(100, Math.round((balance / target) * 100));
}

export function remainingForGoal(goal, bank) {
  return Math.max(0, Number(goal?.target ?? 0) - Math.max(0, Number(bank?.balance ?? 0)));
}

// The hub's own test for an adult member (hub-sdk `isAdult`), repeated here so
// the role rules below can be unit-tested without the browser-only SDK.
function isAdultMember(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * Whether a member manages other members' banks. Mirrors the hub's rule for
 * the bank, goal and transaction tables (adult_writable with a member read
 * column): any adult in a household, and only the steward in a shared space.
 * An adult who merely takes part in a space reads and writes their own rows
 * alone, so a family overview offered to them would be empty and its buttons
 * refused.
 */
export function managesBanks(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdultMember(member) : isAdmin === true;
}

/**
 * True when the member list loaded and holds no child. Banks are opened for
 * children, so without one there is nobody to open a bank for. An empty list
 * means the members could not be read, which says nothing either way.
 */
export function hasNoChildren(members) {
  return members.length > 0 && !members.some(m => !isAdultMember(m));
}

/**
 * Runs tasks that share a key one after another, in the order they were asked
 * for; tasks under different keys do not wait for each other. A task that
 * fails rejects for its own caller and does not hold up the next.
 */
export function serialByKey() {
  const tails = new Map();
  return (key, task) => {
    const run = (tails.get(key) ?? Promise.resolve()).then(task);
    const tail = run.catch(() => {}).finally(() => { if (tails.get(key) === tail) tails.delete(key); });
    tails.set(key, tail);
    return run;
  };
}

/** The sum of the amounts drawn ahead of the hub's answer (a Map of id → row). */
export function pendingTotal(pending) {
  let total = 0;
  for (const tx of pending?.values() ?? []) total += Number(tx.amount ?? 0);
  return total;
}

/**
 * A bank's recent rows as read from the ledger, with the rows still waiting on
 * the hub's answer kept at the top, newest first, and cut to `limit`. A waiting
 * row the ledger already returned is not shown twice.
 */
export function withPending(rows, pending, limit) {
  const known = new Set(rows.map(row => row.id));
  const waiting = [...(pending?.values() ?? [])].filter(tx => !known.has(tx.id)).reverse();
  return [...waiting, ...rows].slice(0, limit);
}
