/* ============================================
   NotificationPermission Component
   Requests notification permission on first load.
   Shows a military-styled prompt if permission
   hasn't been asked yet. Remembers the choice.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { isNotificationSupported, getPermissionStatus, requestPermission } from "@/lib/notifications";
import { Bell, X } from "lucide-react";

const STORAGE_KEY = "barrax_notif_asked";

export default function NotificationPermission() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if notifications aren't supported
    if (!isNotificationSupported()) return;

    // Don't show if already granted or denied
    const status = getPermissionStatus();
    if (status === "granted" || status === "denied") return;

    // Don't show if we already asked this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Show the prompt after a short delay (don't interrupt first load)
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleAllow() {
    const result = await requestPermission();
    sessionStorage.setItem(STORAGE_KEY, "true");
    setShow(false);

    // If granted, show a test notification
    if (result === "granted") {
      setTimeout(() => {
        new Notification("BARRAX COMMS ACTIVE", {
          body: "Notifications enabled. You will receive mission alerts.",
          icon: "/icons/icon-192.png",
        });
      }, 500);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-16 left-3 right-3 z-[70] bg-bg-panel border border-green-primary p-3 animate-slide-up">
      <div className="flex items-start gap-3">
        <Bell size={18} className="text-green-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-heading uppercase tracking-wider text-sand">
            Enable Notifications
          </p>
          <p className="text-[0.65rem] text-text-secondary mt-0.5">
            Get alerts for completed missions, rank promotions, and daily challenges.
          </p>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAllow}
              className="px-3 py-1.5 bg-green-primary text-text-primary font-heading text-[0.6rem]
                         uppercase tracking-widest font-bold min-h-[36px]">
              ENABLE
            </button>
            <button onClick={handleDismiss}
              className="px-3 py-1.5 border border-green-dark text-text-secondary font-heading text-[0.6rem]
                         uppercase tracking-widest min-h-[36px]">
              LATER
            </button>
          </div>
        </div>
        <button onClick={handleDismiss}
          className="text-text-secondary hover:text-text-primary min-w-[28px] min-h-[28px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
