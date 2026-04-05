/* ============================================
   TodayMission Component
   Card showing today's scheduled workout.
   Placeholder until Phase 2 wires up real data.
   ============================================ */

import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Swords } from "lucide-react";

export default function TodayMission() {
  return (
    <Card tag="PENDING" tagVariant="active">
      <div className="flex items-start gap-3">
        <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark
                        flex items-center justify-center">
          <Swords size={20} className="text-green-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            Today&apos;s Mission
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Generate your first weekly programme to see today&apos;s workout here.
          </p>
          <button
            className="mt-3 w-full py-2 bg-green-primary text-text-primary
                       font-heading text-xs uppercase tracking-widest font-bold
                       hover:bg-green-light active:scale-[0.98] transition-all
                       min-h-[44px]"
          >
            BEGIN MISSION
          </button>
        </div>
      </div>
    </Card>
  );
}
