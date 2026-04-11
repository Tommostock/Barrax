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

// ---------------------------------------------------------------------------
// Mission deadline helpers
// ---------------------------------------------------------------------------

/**
 * Expiry moment for a daily contract. Contracts cover a single local
 * day and expire at midnight local time on the FOLLOWING day -- i.e.
 * a contract with date "2026-04-11" is alive until 2026-04-12 00:00:00
 * local time.
 */
export function contractExpiry(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0);
}

/**
 * Expiry moment for a classified op. Ops cover a local calendar month
 * (month_start is always day 01) and expire at midnight local time on
 * the first day of the NEXT month.
 */
export function classifiedOpExpiry(monthStartISO: string): Date {
  const [y, m] = monthStartISO.split("-").map(Number);
  // month is 1-indexed in the string, Date() takes 0-indexed month.
  // Passing month (=next month 0-indexed) with day 1 gives the 1st of
  // next month at 00:00 local.
  return new Date(y, m, 1, 0, 0, 0, 0);
}

/**
 * Format a countdown from `now` until `target` in a compact, military
 * style. Returns the display string plus an `urgent` flag so the UI
 * can switch to a warning colour when time is short.
 *
 * Threshold rules:
 *   >= 1 day    "2D 5H LEFT"            (not urgent)
 *   >= 2 hours  "5H 23M LEFT"           (not urgent)
 *   >= 1 hour   "1H 12M LEFT"           (urgent)
 *   >= 1 minute "15M 30S LEFT"          (urgent)
 *   < 1 minute  "45S LEFT"              (urgent)
 *   <= 0        "EXPIRED"               (urgent + expired)
 */
export interface CountdownDisplay {
  text: string;
  urgent: boolean;
  expired: boolean;
}

export function formatCountdown(target: Date, nowMs: number): CountdownDisplay {
  const remainingMs = target.getTime() - nowMs;
  if (remainingMs <= 0) {
    return { text: "EXPIRED", urgent: true, expired: true };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days >= 1) {
    return { text: `${days}D ${hours}H LEFT`, urgent: false, expired: false };
  }
  if (hours >= 2) {
    return { text: `${hours}H ${mins}M LEFT`, urgent: false, expired: false };
  }
  if (hours >= 1) {
    return { text: `${hours}H ${mins}M LEFT`, urgent: true, expired: false };
  }
  if (mins >= 1) {
    return { text: `${mins}M ${secs}S LEFT`, urgent: true, expired: false };
  }
  return { text: `${secs}S LEFT`, urgent: true, expired: false };
}
