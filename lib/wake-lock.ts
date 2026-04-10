/* ============================================
   Wake Lock
   Keeps the screen awake during workouts using
   the Screen Wake Lock API.

   IMPORTANT: the browser auto-releases the wake
   lock when the document becomes hidden (screen
   off, tab switched, etc). We install a
   visibilitychange listener that re-acquires it
   as soon as the page is visible again, for as
   long as `wantLock` is true.
   ============================================ */

let wakeLock: WakeLockSentinel | null = null;
let wantLock = false;
let visibilityHandler: (() => void) | null = null;

async function acquire(): Promise<boolean> {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      // Clear the ref if the browser auto-releases it
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
      console.log("Wake lock acquired — screen will stay on");
      return true;
    }
  } catch (err) {
    console.warn("Wake lock failed:", err);
  }
  return false;
}

// Request a wake lock — keeps the screen on, and reacquires it after the
// document becomes visible again (the browser auto-releases on visibility
// change, so we must reacquire).
export async function requestWakeLock(): Promise<boolean> {
  wantLock = true;

  // Install the visibility listener only once
  if (!visibilityHandler) {
    visibilityHandler = async () => {
      if (wantLock && document.visibilityState === "visible" && wakeLock === null) {
        await acquire();
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  return acquire();
}

// Release the wake lock — allows screen to dim again
export async function releaseWakeLock() {
  wantLock = false;
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
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
