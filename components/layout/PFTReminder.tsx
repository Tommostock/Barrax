/* ============================================
   Physical Fitness Test Reminder
   Fires a local notification whenever any of the three
   PFT benchmarks (push-up max, plank hold, 1.5-mile run)
   is overdue -- i.e. >= 90 days since the last attempt,
   or never attempted at all.

   Checked on every HQ mount and then polled every hour
   while the app stays open. Deduped via localStorage to
   one notification per ISO week so we don't spam.

   This is client-side only -- no backend scheduler -- so
   the notification fires the next time the user opens
   the app after the 90-day threshold is crossed, not
   the exact moment it crosses.
   ============================================ */

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyPFTDue, getPermissionStatus } from "@/lib/notifications";
import {
  loadFitnessTestSummaries,
  hasOverdueTest,
} from "@/lib/fitness/tests";
import type { FitnessTestSummary, FitnessTestType } from "@/types/fitness";

const LAST_KEY = "barrax-pft-reminder-last-shown";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/** ISO week string e.g. "2026-W15" for dedupe. */
function getWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getFullYear()}-W${weekNum}`;
}

/** Already shown the PFT reminder this week? */
function alreadyShownThisWeek(): boolean {
  const last = localStorage.getItem(LAST_KEY);
  return last === getWeekKey(new Date());
}

/** Count how many of the three tests are overdue (>=90 days or never). */
function countOverdue(
  summaries: Record<FitnessTestType, FitnessTestSummary>,
): number {
  const types: FitnessTestType[] = ["push_up_max", "plank_hold", "run_1500m"];
  let count = 0;
  for (const type of types) {
    const s = summaries[type];
    if (!s.latest) {
      count++;
      continue;
    }
    if ((s.days_since_latest ?? 0) >= 90) count++;
  }
  return count;
}

/** Query summaries, decide whether to fire, record dedupe key. */
async function checkAndFire() {
  if (getPermissionStatus() !== "granted") return;
  if (alreadyShownThisWeek()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const summaries = await loadFitnessTestSummaries(user.id);
  if (!hasOverdueTest(summaries)) return;

  const overdueCount = countOverdue(summaries);
  notifyPFTDue(overdueCount);
  localStorage.setItem(LAST_KEY, getWeekKey(new Date()));
}

export default function PFTReminder() {
  useEffect(() => {
    // Check immediately on mount
    checkAndFire();

    // Re-check hourly while the app stays open
    const interval = setInterval(checkAndFire, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Renders nothing -- pure scheduler
  return null;
}
