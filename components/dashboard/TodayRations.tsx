/* ============================================
   TodayRations Component
   Compact view of today's meals.
   Placeholder until Phase 4 wires up real data.
   ============================================ */

import Card from "@/components/ui/Card";
import { Utensils } from "lucide-react";

export default function TodayRations() {
  // Placeholder meal slots
  const meals = [
    { type: "BREAKFAST", name: "--" },
    { type: "LUNCH", name: "--" },
    { type: "DINNER", name: "--" },
    { type: "SNACK", name: "--" },
  ];

  return (
    <Card tag="RATIONS" tagVariant="default">
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} className="text-green-primary" />
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
          Today&apos;s Rations
        </h3>
      </div>
      <div className="space-y-2">
        {meals.map((meal) => (
          <div
            key={meal.type}
            className="flex items-center justify-between py-1 border-b border-green-dark/50 last:border-0"
          >
            <span className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider">
              {meal.type}
            </span>
            <span className="text-xs text-text-primary">{meal.name}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-secondary mt-3">
        Generate a meal plan to see your rations here.
      </p>
    </Card>
  );
}
