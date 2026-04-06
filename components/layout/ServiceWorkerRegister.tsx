/* ============================================
   Service Worker Registration
   Registers the service worker on app mount.
   Handles updates and offline support.
   ============================================ */

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }
  }, []);

  // This component renders nothing — it just runs the registration side effect
  return null;
}
