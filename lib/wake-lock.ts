/* ============================================
   Wake Lock
   Keeps the screen awake during workouts using
   the Screen Wake Lock API. Releases when the
   workout ends or the component unmounts.
   ============================================ */

let wakeLock: WakeLockSentinel | null = null;

// Request a wake lock — keeps the screen on
export async function requestWakeLock(): Promise<boolean> {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake lock acquired — screen will stay on");
      return true;
    }
  } catch (err) {
    console.warn("Wake lock failed:", err);
  }
  return false;
}

// Release the wake lock — allows screen to dim again
export async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log("Wake lock released");
    }
  } catch {
    // Ignore release errors
  }
}
