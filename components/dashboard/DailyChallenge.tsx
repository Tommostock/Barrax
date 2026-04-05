/* ============================================
   DailyChallenge Component
   A bonus challenge card for extra XP.
   Placeholder until Phase 5 wires up real data.
   ============================================ */

import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Trophy } from "lucide-react";

export default function DailyChallenge() {
  return (
    <Card tag="CHALLENGE" tagVariant="gold">
      <div className="flex items-start gap-3">
        <Trophy size={20} className="text-xp-gold mt-1" />
        <div className="flex-1">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            Daily Challenge
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Challenges unlock at Rank 2 (Private). Keep training.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Tag variant="gold">+50 XP</Tag>
          </div>
        </div>
      </div>
    </Card>
  );
}
