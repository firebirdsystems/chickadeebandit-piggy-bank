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
