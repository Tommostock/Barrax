/* ============================================
   Notifications System
   Local notifications for in-app events.
   All text is military-toned, no emojis.

   Free, no server needed. Works on:
   - Android PWA (installed to home screen)
   - Desktop browsers (Chrome, Edge, Firefox)
   - iOS PWA (16.4+ only, must be installed)
   ============================================ */

// Check if notifications are supported in this browser
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

// Get current permission status
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

// Request permission — returns the result
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return await Notification.requestPermission();
}

// Show a local notification.
// Uses the service worker if available (works when tab is backgrounded),
// falls back to the Notification constructor if not.
export function showNotification(
  title: string,
  body: string,
  tag?: string,
  url?: string
) {
  if (getPermissionStatus() !== "granted") return;

  const options = {
    body,
    tag: tag ?? `barrax-${Date.now()}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: url ?? "/" },
  };

  // Try service worker first (works in background)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options as NotificationOptions);
    });
  } else {
    // Fallback to basic Notification API
    new Notification(title, options);
  }
}

// ──────────────────────────────────────────────
// Pre-built notification triggers
// Call these from anywhere in the app after events.
// ──────────────────────────────────────────────

export function notifyWorkoutComplete(xp: number, duration: number) {
  const mins = Math.round(duration / 60);
  showNotification(
    "MISSION COMPLETE",
    `${mins} minutes. +${xp} XP earned. Good work, soldier.`,
    "workout-complete",
    "/missions"
  );
}

export function notifyRankUp(rankTitle: string) {
  showNotification(
    "PROMOTION CONFIRMED",
    `You have been promoted to ${rankTitle}. New capabilities unlocked.`,
    "rank-up",
    "/record"
  );
}

export function notifyBadgeEarned(badgeName: string) {
  showNotification(
    "ACHIEVEMENT UNLOCKED",
    `${badgeName}. This distinction has been added to your service record.`,
    "badge-earned",
    "/record"
  );
}

export function notifyWaterGoalHit() {
  showNotification(
    "HYDRATION QUOTA ACHIEVED",
    "Daily water target reached. Your body thanks you.",
    "water-goal",
    "/rations/water"
  );
}

// Two-tier mission system notifications
export function notifyContractComplete(xp: number, title: string) {
  showNotification(
    "CONTRACT CLEARED",
    `${title}. +${xp} XP. Target acquired.`,
    "contract-complete",
    "/"
  );
}

export function notifyClassifiedOpComplete(xp: number, codename: string) {
  showNotification(
    "MISSION ACCOMPLISHED",
    `${codename} complete. +${xp} XP. Exceptional work, soldier.`,
    "classified-op-complete",
    "/"
  );
}

export function notifyPersonalRecord(category: string, value: string) {
  showNotification(
    "NEW PERSONAL RECORD",
    `${category}: ${value}. Your best just got better.`,
    "personal-record",
    // Deep-link to the Reports (Service Record) page where Elite
    // Achievements now live, beneath Badges & Achievements.
    "/record"
  );
}

export function notifyRunComplete(distanceKm: string, xp: number) {
  showNotification(
    "RUN LOGGED",
    `${distanceKm} km covered. +${xp} XP. Territory secured.`,
    "run-complete",
    "/intel/runs"
  );
}

export function notifyMealPlanReady() {
  showNotification(
    "RATIONS PREPARED",
    "New weekly meal plan generated. Report to FUEL UP.",
    "meal-plan-ready",
    "/rations"
  );
}

// Sunday weekly summary — fired every Sunday at 1800
export function notifyWeeklySummary(workouts: number, xp: number, distance: string) {
  showNotification(
    "WEEKLY DEBRIEF",
    `${workouts} missions completed. +${xp} XP earned. ${distance} km covered. Full report ready.`,
    "weekly-summary",
    "/intel/report"
  );
}

// Sunday evening weekly briefing — forward-looking preview of the coming week
export function notifyWeeklyBriefing(workoutCount: number) {
  showNotification(
    "WEEKLY BRIEFING",
    `Mission plan for the week ahead. ${workoutCount} workouts scheduled. Stand by for details.`,
    "weekly-briefing",
    "/"
  );
}

// Sunday weigh-in reminder — fired every Sunday at 0700
export function notifyWeighIn() {
  showNotification(
    "WEIGH-IN REQUIRED",
    "Weekly body assessment is due. Report your weight, soldier.",
    "weigh-in-reminder",
    "/intel/body"
  );
}

// Daily supplement stack reminder — fired every morning at 07:00
// reminding the user to tap the SUPPS button on the HQ page so their
// creatine + whey stack gets logged into the diary.
export function notifySupplementsDue() {
  showNotification(
    "SUPPS INTAKE DUE",
    "Morning stack waiting for you. Log your creatine + whey on HQ.",
    "supps-reminder",
    "/",
  );
}

// Quarterly PFT reminder — fired when any of the three benchmark tests
// (push-up max, plank hold, 1.5-mile run) is overdue (>=90 days old or
// never taken). Deduped to once per week client-side.
export function notifyPFTDue(overdueTestCount: number) {
  const bodyCopy =
    overdueTestCount === 1
      ? "1 benchmark test is overdue. Retest to update your fitness trajectory."
      : `${overdueTestCount} benchmark tests are overdue. Retest to update your fitness trajectory.`;
  showNotification(
    "PHYSICAL ASSESSMENT DUE",
    bodyCopy,
    "pft-due",
    "/intel/fitness-test"
  );
}
