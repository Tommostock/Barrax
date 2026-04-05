/* ============================================
   RATIONS Page
   Weekly meal plan view.
   Placeholder until Phase 4 builds the full system.
   ============================================ */

import Card from "@/components/ui/Card";
import { Utensils, Plus } from "lucide-react";

export default function RationsPage() {
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Weekly Rations
      </h2>

      {/* No meal plan message */}
      <Card tag="NO PLAN" tagVariant="default">
        <div className="text-center py-6">
          <Utensils size={32} className="text-text-secondary mx-auto mb-3" />
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">
            No Active Meal Plan
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Generate a weekly meal plan based on your food preferences and calorie target.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-primary
                       text-text-primary font-heading text-xs uppercase tracking-widest
                       font-bold hover:bg-green-light active:scale-[0.98] transition-all
                       min-h-[44px]"
          >
            <Plus size={16} />
            GENERATE MEAL PLAN
          </button>
        </div>
      </Card>
    </div>
  );
}
