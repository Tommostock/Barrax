/* ============================================
   Bottom Navigation Bar
   5 tabs fixed to the bottom of the screen.
   Active tab highlighted in green-primary.
   Safe area padding for notched devices.
   ============================================ */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Crosshair, Swords, Utensils, BarChart3, Shield } from "lucide-react";

// Define the 5 main navigation tabs
const tabs = [
  { href: "/", label: "HQ", icon: Crosshair },
  { href: "/missions", label: "ASSAULT", icon: Swords },
  { href: "/rations", label: "FUEL UP", icon: Utensils },
  { href: "/intel", label: "DEBRIEF", icon: BarChart3 },
  { href: "/record", label: "REPORTS", icon: Shield },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // Check if a tab is active based on the current URL path.
  // The home tab (/) only matches exactly; others match any sub-path.
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50
                 bg-bg-panel border-t border-green-dark
                 safe-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-1
                min-w-[44px] min-h-[44px] px-2 py-1
                transition-colors
                ${active ? "text-green-primary" : "text-text-secondary"}
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span
                className={`
                  text-[0.6rem] uppercase tracking-wider font-heading
                  ${active ? "font-bold" : "font-normal"}
                `}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
