/* ============================================
   Supplements Reminder
   Fires a notification every day at 07:00
   reminding the user to take their creatine +
   whey stack and log it on the HQ page.

   Mirrors the WeighInReminder pattern: client-
   side scheduling via setTimeout + a periodic
   re-check, and a localStorage key keyed to the
   date string so we never show the reminder
   twice on the same day.

   Suppressed automatically if the user has
   already tapped the SUPPS button today — no
   point nagging about a job already done.
   ============================================ */

"use client";

import { useEffect } from "react";
import { notifySupplementsDue, getPermissionStatus } from "@/lib/notifications";
import { hasLoggedSuppsToday } from "@/lib/supps";

// localStorage key used to track the last shown reminder
const LAST_REMINDER_KEY = "barrax-supps-last-shown";

// Target hour for the reminder (24h format)
const REMINDER_HOUR = 7;

// How often to check if reminder is due (in ms) — every 15 minutes
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * YYYY-MM-DD key for today so we can tell if the reminder has
 * already been shown on this calendar day (local time).
 */
function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Should the reminder fire right now?
 *  - It must be at or after 07:00 local time
 *  - We haven't already shown it today
 */
function shouldShowReminder(): boolean {
  const now = new Date();
  if (now.getHours() < REMINDER_HOUR) return false;

  const lastShown = localStorage.getItem(LAST_REMINDER_KEY);
  return lastShown !== todayKey();
}

/**
 * Fire the reminder, but skip it if the user has already logged
 * their supplements for the day — no one wants a nag for a job
 * they've already done.
 */
async function fireReminder() {
  if (getPermissionStatus() !== "granted") return;

  // Mark the day as handled FIRST — even if the user has already
  // logged, we still want to avoid firing again later today if
  // they somehow clear the diary entry.
  localStorage.setItem(LAST_REMINDER_KEY, todayKey());

  // Don't nag if already logged
  const alreadyLogged = await hasLoggedSuppsToday().catch(() => false);
  if (alreadyLogged) return;

  notifySupplementsDue();
}

/**
 * Milliseconds until today at 07:00 (or tomorrow 07:00 if it's
 * already past 07:00). Used to schedule the one-shot timeout.
 */
function msUntilNext7am(): number {
  const now = new Date();
  const target = new Date(now);

  if (now.getHours() >= REMINDER_HOUR) {
    // Already past 07:00 today → schedule tomorrow at 07:00
    target.setDate(now.getDate() + 1);
  }
  target.setHours(REMINDER_HOUR, 0, 0, 0);
  return target.getTime() - now.getTime();
}

export default function SuppsReminder() {
  useEffect(() => {
    // Check immediately on mount — user might have opened the
    // app for the first time today after 07:00.
    if (shouldShowReminder()) {
      fireReminder();
    }

    // One-shot timeout for the next 07:00 boundary
    const msUntil = msUntilNext7am();
    const timeout = setTimeout(() => {
      if (shouldShowReminder()) {
        fireReminder();
      }
    }, msUntil);

    // Periodic re-check to catch the boundary if the app stays
    // open across 07:00 (e.g. overnight on desktop).
    const interval = setInterval(() => {
      if (shouldShowReminder()) {
        fireReminder();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Headless scheduler — renders nothing
  return null;
}
