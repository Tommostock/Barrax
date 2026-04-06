/* ============================================
   PWA Install Prompt
   Custom in-app banner prompting the user to
   install BARRAX as a PWA. Shows on first visit,
   dismissible, re-shows after 3 visits.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

// Track install prompt in localStorage
const STORAGE_KEY = "barrax_install_prompt";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed or dismissed
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.installed) return;
      if (data.dismissed && data.visitCount < 3) {
        // Increment visit count
        data.visitCount = (data.visitCount || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show for browsers that don't fire beforeinstallprompt
    // but support standalone mode (e.g., iOS Safari)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!isStandalone && !stored) {
      // Show after a short delay on first visit
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
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[80] bg-bg-panel border border-green-primary p-4 animate-slide-up safe-bottom">
      <div className="flex items-start gap-3">
        <Download size={20} className="text-green-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            Install BARRAX
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Add to your home screen for the full experience. Works offline.
          </p>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 px-4 py-2 bg-green-primary text-text-primary
                         font-heading text-xs uppercase tracking-widest font-bold
                         hover:bg-green-light active:scale-[0.98] transition-all min-h-[44px]"
            >
              INSTALL
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px]
                     flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
