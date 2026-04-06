/* ============================================
   Web Push Notifications
   Handles push subscription registration,
   permission requests, and notification sending.
   All notification text is military-toned, no emojis.
   ============================================ */

// Check if the browser supports push notifications
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current notification permission status
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// Request notification permission from the user
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return await Notification.requestPermission();
}

// Show a local notification (doesn't need push subscription)
// Used for in-app alerts like rank-ups and PR notifications
export function showLocalNotification(
  title: string,
  body: string,
  tag?: string
) {
  if (getPermissionStatus() !== "granted") return;

  // Use the service worker registration to show the notification
  // so it works even when the tab is backgrounded
  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      tag: tag ?? "barrax-notification",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      data: { url: "/" },
    } as NotificationOptions);
  });
}

// Military-themed notification messages
export const NOTIFICATION_MESSAGES = {
  morningMission: (rank: string, name: string) =>
    `Your mission is waiting, ${rank} ${name}. Deploy when ready.`,

  missedWorkout: () =>
    "Mission incomplete. You still have time to report for duty.",

  streakAtRisk: (days: number) =>
    `Your ${days}-day streak is at risk. Do not break the chain.`,

  waterReminder: () =>
    "Hydration check. You are behind on water intake.",

  programmeReady: () =>
    "New weekly programme generated. Report to MISSIONS.",

  rankUp: (rank: string) =>
    `Promotion confirmed. You have been promoted to ${rank}.`,

  personalRecord: (category: string, value: string) =>
    `New personal record. ${category}: ${value}.`,

  weeklyReport: () =>
    "Weekly intelligence report ready for review.",
} as const;
