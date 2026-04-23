/* ============================================
   PWA Install Prompt
   Custom in-app banner. Shows once on first visit,
   dismissible, re-shows after 3 visits.
   Uses sessionStorage for dismiss so it persists
   across page navigations within the session.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "barrax_install_prompt";
const SESSION_KEY = "barrax_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Check localStorage for install/dismiss history
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.installed) return;
      if (data.dismissed && data.visitCount < 3) {
        data.visitCount = (data.visitCount || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!isStandalone && !stored) {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ installed: true }));
        setShow(false);
      }
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true, visitCount: 0 }));
    sessionStorage.setItem(SESSION_KEY, "true"); // Persist dismiss for entire session
    setShow(false);
  }

  if (!show) return null;

  // `.above-bottom-nav` positions this above the nav + the home-indicator
  // safe area, which is essential on iPhone 17 where the nav extends ~34px
  // further up than on older iPhones. Without this, the prompt gets partially
  // covered by the nav bar.
  return (
    <div className="fixed above-bottom-nav left-3 right-3 z-[60] bg-bg-panel border border-green-primary p-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <Download size={18} className="text-green-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-heading uppercase tracking-wider text-sand">Install BARRAX</p>
          <p className="text-[0.65rem] text-text-secondary">Add to home screen. Works offline.</p>
        </div>
        {deferredPrompt && (
          <button onClick={handleInstall}
            className="px-3 py-1.5 bg-green-primary text-text-primary font-heading text-[0.6rem]
                       uppercase tracking-widest font-bold min-h-[36px]">
            INSTALL
          </button>
        )}
        <button onClick={handleDismiss}
          className="text-text-secondary hover:text-text-primary min-w-[36px] min-h-[36px] flex items-center justify-center">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
