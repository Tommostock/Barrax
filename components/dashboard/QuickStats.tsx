/* ============================================
   QuickStats Component
   Row of 3-4 stat boxes showing key metrics.
   ============================================ */

import { Target, Scale, Zap, Utensils } from "lucide-react";

export default function QuickStats() {
  // Placeholder stats — will be wired to real data in later phases
  const stats = [
    { label: "MISSIONS", value: "0", icon: Target },
    { label: "XP THIS WEEK", value: "0", icon: Zap },
    { label: "MEALS TODAY", value: "0/4", icon: Utensils },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-bg-panel border border-green-dark p-3 text-center"
          >
            <Icon size={16} className="text-green-primary mx-auto mb-1" />
            <p className="text-lg font-bold font-mono text-text-primary">
              {stat.value}
            </p>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
