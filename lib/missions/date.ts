/* ============================================
   Mission Date Helpers
   Single source of truth for local-date boundaries used
   by the contract/classified op system. Both the server
   generator routes AND the client-side progress engine
   MUST use these helpers so they agree on "today" and
   "this month" in the user's local timezone.
   ============================================ */

/** YYYY-MM-DD for today in the device's local timezone. */
export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-01 for the first day of the current local month. */
export function monthStartLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** YYYY-MM-DD for the last day of the month that monthStartISO falls in. */
export function monthEndLocalISO(monthStartISO: string): string {
  const [y, m] = monthStartISO.split("-").map(Number);
  // Day 0 of the *next* month = the last day of the current month.
  const last = new Date(y, m, 0);
  const yy = last.getFullYear();
  const mm = String(last.getMonth() + 1).padStart(2, "0");
  const dd = String(last.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Full-day timestamp bounds for a given local YYYY-MM-DD string.
 * Returns ISO strings useful for `gte` / `lte` comparisons against
 * a timestamptz column.
 */
export function dayBoundsISO(startDate: string, endDate: string): { startTs: string; endTs: string } {
  return {
    startTs: `${startDate}T00:00:00`,
    endTs: `${endDate}T23:59:59.999`,
  };
}

/** Month name in English for fallback codename assembly. */
export function currentMonthName(): string {
  return new Date().toLocaleString("en-GB", { month: "long" });
}
