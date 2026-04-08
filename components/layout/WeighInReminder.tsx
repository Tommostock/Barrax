/* ============================================
   Weigh-In Reminder
   Fires a notification every Sunday at 07:00
   reminding the user to log their weight.

   Since this is a free PWA with no backend scheduler,
   we schedule notifications client-side:
   - On mount, check if a Sunday 07:00 reminder is due
   - Set a timeout to fire at the next Sunday 07:00
   - Use localStorage to avoid showing duplicates
   ============================================ */

"use client";

import { useEffect } from "react";
import { notifyWeighIn, getPermissionStatus } from "@/lib/notifications";

// Key used in localStorage to track the last shown reminder
const LAST_REMINDER_KEY = "barrax-weigh-in-last-shown";

// Target hour for the reminder (24h format)
const REMINDER_HOUR = 7;

// How often to check if reminder is due (in ms) — every 15 minutes
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Get the ISO week number string (e.g. "2026-W15") for a given date.
 * Used to track whether we've already shown the reminder this week.
 */
function getWeekKey(date: Date): string {
  // Copy the date so we don't mutate
  const d = new Date(date.getTime());
  // Set to nearest Thursday (ISO week starts on Monday)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${weekNum}`;
}

/**
 * Check if the reminder should fire right now:
 * - It must be Sunday
 * - It must be at or after 07:00
 * - We haven't already shown it this week
 */
function shouldShowReminder(): boolean {
  const now = new Date();
  const isSunday = now.getDay() === 0;
  const isPastReminderTime = now.getHours() >= REMINDER_HOUR;

  if (!isSunday || !isPastReminderTime) return false;

  // Check if we've already shown the reminder this week
  const lastShown = localStorage.getItem(LAST_REMINDER_KEY);
  const currentWeek = getWeekKey(now);

  return lastShown !== currentWeek;
}

/**
 * Fire the reminder and record that we showed it this week.
 */
function fireReminder() {
  if (getPermissionStatus() !== "granted") return;

  notifyWeighIn();
  localStorage.setItem(LAST_REMINDER_KEY, getWeekKey(new Date()));
}

/**
 * Calculate milliseconds until next Sunday at 07:00.
 * If it's currently Sunday before 07:00, returns time until today at 07:00.
 */
function msUntilNextSunday7am(): number {
  const now = new Date();
  const target = new Date(now);

  // Calculate days until next Sunday
  const currentDay = now.getDay(); // 0 = Sunday
  let daysUntilSunday = (7 - currentDay) % 7;

  // If it's Sunday but before 07:00, target is today
  if (currentDay === 0 && now.getHours() < REMINDER_HOUR) {
    daysUntilSunday = 0;
  }
  // If it's Sunday at or after 07:00, target is next Sunday
  else if (currentDay === 0) {
    daysUntilSunday = 7;
  }

  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(REMINDER_HOUR, 0, 0, 0);

  return target.getTime() - now.getTime();
}

export default function WeighInReminder() {
  useEffect(() => {
    // Check immediately on mount — user might have opened the app on Sunday
    if (shouldShowReminder()) {
      fireReminder();
    }

    // Set a timeout for the next Sunday 07:00
    const msUntil = msUntilNextSunday7am();
    const timeout = setTimeout(() => {
      if (shouldShowReminder()) {
        fireReminder();
      }
    }, msUntil);

    // Also check periodically in case the app stays open across the boundary
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

  // This component renders nothing — it just schedules the reminder
  return null;
}
