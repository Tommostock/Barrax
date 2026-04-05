/* ============================================
   MISSIONS Page
   Weekly workout programme view.
   Placeholder until Phase 2 builds the full system.
   ============================================ */

import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Swords, Plus } from "lucide-react";

export default function MissionsPage() {
  // Days of the week for the programme calendar
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Weekly Programme
      </h2>

      {/* Week calendar grid — placeholder */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day}
            className="bg-bg-panel border border-green-dark p-2 text-center"
          >
            <p className="text-[0.55rem] font-mono text-text-secondary">{day}</p>
            <div className="w-6 h-6 mx-auto mt-1 bg-bg-panel-alt border border-green-dark" />
          </div>
        ))}
      </div>

      {/* No programme message */}
      <Card tag="NO PROGRAMME" tagVariant="default">
        <div className="text-center py-6">
          <Swords size={32} className="text-text-secondary mx-auto mb-3" />
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">
            No Active Programme
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Generate a weekly workout programme tailored to your fitness level and goals.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-primary
                       text-text-primary font-heading text-xs uppercase tracking-widest
                       font-bold hover:bg-green-light active:scale-[0.98] transition-all
                       min-h-[44px]"
          >
            <Plus size={16} />
            GENERATE PROGRAMME
          </button>
        </div>
      </Card>
    </div>
  );
}
