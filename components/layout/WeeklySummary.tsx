/* ============================================
   Weekly Summary Notification
   Fires a push notification every Sunday at 18:00
   summarising the user's week: workouts completed,
   XP earned, distance run.
   Uses localStorage to avoid duplicate notifications.
   ============================================ */

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyWeeklySummary, getPermissionStatus } from "@/lib/notifications";

// localStorage key to track last shown summary
const LAST_SUMMARY_KEY = "barrax-weekly-summary-last-shown";

// Target hour (24h format) — 6pm Sunday
const SUMMARY_HOUR = 18;

// Check every 30 minutes
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Get the ISO week key (e.g. "2026-W15") so we only show once per week.
 */
function getWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${weekNum}`;
}

/**
 * Check if the summary should fire:
 * - Sunday, at or after 18:00
 * - Not already shown this week
 */
function shouldShowSummary(): boolean {
  const now = new Date();
  if (now.getDay() !== 0) return false;
  if (now.getHours() < SUMMARY_HOUR) return false;

  const lastShown = localStorage.getItem(LAST_SUMMARY_KEY);
  return lastShown !== getWeekKey(now);
}

/**
 * Fetch this week's stats and fire the notification.
 */
async function fireSummary() {
  if (getPermissionStatus() !== "granted") return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get Monday of this week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString();

  // Fetch workouts completed this week
  const { count: workoutCount } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "complete")
    .gte("completed_at", mondayStr);

  // Fetch runs this week for distance
  const { data: runs } = await supabase
    .from("runs")
    .select("distance_metres")
    .eq("user_id", user.id)
    .gte("started_at", mondayStr);

  const totalDistance = (runs || []).reduce((sum, r) => sum + (r.distance_metres || 0), 0);
  const distanceKm = (totalDistance / 1000).toFixed(1);

  // Fetch XP earned this week (approximate from completed workouts + runs)
  const { data: workoutXP } = await supabase
    .from("workouts")
    .select("xp_earned")
    .eq("user_id", user.id)
    .eq("status", "complete")
    .gte("completed_at", mondayStr);

  const { data: runXP } = await supabase
    .from("runs")
    .select("xp_earned")
    .eq("user_id", user.id)
    .gte("started_at", mondayStr);

  const totalXP = (workoutXP || []).reduce((sum, w) => sum + (w.xp_earned || 0), 0)
    + (runXP || []).reduce((sum, r) => sum + (r.xp_earned || 0), 0);

  notifyWeeklySummary(workoutCount ?? 0, totalXP, distanceKm);
  localStorage.setItem(LAST_SUMMARY_KEY, getWeekKey(now));
}

export default function WeeklySummary() {
  useEffect(() => {
    // Check immediately on mount
    if (shouldShowSummary()) fireSummary();

    // Check periodically
    const interval = setInterval(() => {
      if (shouldShowSummary()) fireSummary();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
