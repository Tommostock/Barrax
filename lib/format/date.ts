/* ============================================
   Date formatting helpers
   Single source of truth for date display strings
   across the whole app. Before this file existed,
   dates were formatted six different ways in six
   different places ("Mon 11 Apr", "11 APR 2026",
   "Apr 11", etc.). Pick from this helper and the
   whole app stays consistent.

   Two primary formats + a handful of domain helpers:
     formatDateCompact  "11 Apr"
     formatDateFull     "11 April 2026"
     formatDateMono     "11 APR 2026"        (all caps, tactical)
     formatDateRelative "today" / "2d ago"    (reading-room humane)
     formatDayShort     "Mon 11 Apr"         (weekday + compact)
     formatMMSS         "1:05"                (seconds to mm:ss)
     formatHMS          "01:23:45"            (seconds to hh:mm:ss)
     dateISO            "2026-04-11"          (YYYY-MM-DD, local tz)

   These all accept either a Date object or an ISO
   string. Millisecond timestamps work too.
   ============================================ */

type DateLike = Date | string | number;

function toDate(d: DateLike): Date {
  if (d instanceof Date) return d;
  return new Date(d);
}

/** "11 Apr" — short form, no year, no weekday. */
export function formatDateCompact(d: DateLike): string {
  return toDate(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/** "11 April 2026" — full word month + year. Long form. */
export function formatDateFull(d: DateLike): string {
  return toDate(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "11 APR 2026" — all caps tactical style. */
export function formatDateMono(d: DateLike): string {
  return toDate(d)
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

/** "Mon 11 Apr" — weekday + compact date. */
export function formatDayShort(d: DateLike): string {
  return toDate(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "2026-04-11" — YYYY-MM-DD in the device's local timezone. */
export function dateISO(d: DateLike): string {
  const date = toDate(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Humane relative time: "today", "yesterday", "3d ago", "in 2w".
 * Only pay attention to the calendar day, not the hour -- "yesterday
 * at 23:59" and "today at 00:00" are one minute apart but we still
 * want to say "yesterday" vs "today".
 */
export function formatDateRelative(d: DateLike): string {
  const then = toDate(d);
  const now = new Date();

  // Normalise both to midnight for a day-diff
  const thenDay = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = nowDay.getTime() - thenDay.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays === -1) return "tomorrow";
  if (diffDays > 0 && diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 0 && diffDays > -7) return `in ${-diffDays}d`;
  if (diffDays > 0 && diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  if (diffDays < 0 && diffDays > -30) return `in ${Math.round(-diffDays / 7)}w`;
  if (diffDays > 0 && diffDays < 365) return `${Math.round(diffDays / 30)}mo ago`;
  if (diffDays < 0 && diffDays > -365) return `in ${Math.round(-diffDays / 30)}mo`;
  return formatDateCompact(then);
}

/** "1:05" — seconds to mm:ss (used for plank holds, rest timers). */
export function formatMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** "01:23:45" — seconds to hh:mm:ss (used for long-run elapsed). */
export function formatHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return [hrs, mins, secs].map((n) => n.toString().padStart(2, "0")).join(":");
}
