/* ============================================
   StreakCounter Component
   Shows the current streak as a prominent number
   with chevron markers and freeze status.
   ============================================ */

import { Flame, Shield } from "lucide-react";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  freezeAvailable: boolean;
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  freezeAvailable,
}: StreakCounterProps) {
  return (
    <div className="bg-bg-panel border border-green-dark p-4 flex items-center justify-between">
      {/* Left: streak number and label */}
      <div className="flex items-center gap-3">
        <Flame
          size={28}
          className={currentStreak > 0 ? "text-xp-gold" : "text-text-secondary"}
        />
        <div>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {currentStreak}
          </p>
          <p className="text-[0.65rem] text-text-secondary font-mono uppercase tracking-wider">
            Days Consecutive
          </p>
        </div>
      </div>

      {/* Right: longest streak + freeze status */}
      <div className="text-right space-y-1">
        <p className="text-xs text-text-secondary font-mono">
          BEST: {longestStreak}
        </p>
        <div className="flex items-center gap-1 justify-end">
          <Shield size={12} className={freezeAvailable ? "text-green-light" : "text-text-secondary"} />
          <span className="text-[0.6rem] font-mono text-text-secondary">
            {freezeAvailable ? "LIFELINE READY" : "NO LIFELINE"}
          </span>
        </div>
      </div>
    </div>
  );
}
