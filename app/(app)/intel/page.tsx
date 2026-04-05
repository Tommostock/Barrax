/* ============================================
   INTEL Page
   Stats and progress overview.
   Placeholder until later phases add real data.
   ============================================ */

import Card from "@/components/ui/Card";
import { BarChart3, TrendingUp, Trophy, Activity } from "lucide-react";
import Link from "next/link";

export default function IntelPage() {
  // Navigation cards for the different intel sections
  const sections = [
    {
      href: "/intel/body",
      icon: Activity,
      title: "Body Tracking",
      description: "Weight and body measurements",
    },
    {
      href: "/intel/runs",
      icon: TrendingUp,
      title: "Run Stats",
      description: "Distance, pace, and trends",
    },
    {
      href: "/intel/records",
      icon: Trophy,
      title: "Personal Records",
      description: "Your all-time bests",
    },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Intelligence Report
      </h2>

      {/* Stats overview cards — placeholder values */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Workouts</p>
          <p className="text-2xl font-bold font-mono text-text-primary">0</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Distance</p>
          <p className="text-2xl font-bold font-mono text-text-primary">0 km</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total XP</p>
          <p className="text-2xl font-bold font-mono text-xp-gold">0</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Time Trained</p>
          <p className="text-2xl font-bold font-mono text-text-primary">0h</p>
        </div>
      </div>

      {/* Section navigation */}
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Link key={section.href} href={section.href}>
            <Card className="flex items-center gap-3 hover:bg-bg-panel-alt transition-colors">
              <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark
                              flex items-center justify-center">
                <Icon size={18} className="text-green-primary" />
              </div>
              <div>
                <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                  {section.title}
                </h3>
                <p className="text-xs text-text-secondary">{section.description}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
