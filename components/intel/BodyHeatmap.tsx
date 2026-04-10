/* ============================================
   Body Heatmap Component
   SVG front-view body silhouette with muscle
   regions coloured by training volume (sets).
   Tap a region to see muscle name + stats.
   ============================================ */

"use client";

import { useState } from "react";

interface MuscleStats {
  muscle: string;
  sets: number;
  reps: number;
}

interface Props {
  data: MuscleStats[];
}

// Green intensity scale: untrained → light work → heavy work
function heatColor(sets: number, maxSets: number): string {
  if (maxSets === 0 || sets === 0) return "#1a2a1a";
  const pct = sets / maxSets;
  if (pct < 0.15) return "#1e3520";
  if (pct < 0.35) return "#225c2a";
  if (pct < 0.55) return "#277a38";
  if (pct < 0.75) return "#2da348";
  return "#22c55e";
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  back: "Back",
  glutes: "Glutes",
  legs: "Legs",
  cardio: "Cardio",
  other: "Other",
};

export default function BodyHeatmap({ data }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const statsMap: Record<string, MuscleStats> = {};
  for (const item of data) {
    statsMap[item.muscle] = item;
  }
  const maxSets = Math.max(...data.map((d) => d.sets), 1);

  const col = (muscle: string) => heatColor(statsMap[muscle]?.sets ?? 0, maxSets);
  const tap = (muscle: string) =>
    setActive((prev) => (prev === muscle ? null : muscle));

  const activeStats = active ? statsMap[active] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tooltip: active muscle stats */}
      <div
        className={`border border-green-dark bg-bg-panel px-5 py-2 text-center min-w-[180px] transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <p className="text-xs font-heading uppercase tracking-wider text-sand">
          {active ? MUSCLE_LABELS[active] ?? active : "—"}
        </p>
        <div className="flex items-center justify-center gap-5 mt-1">
          <div>
            <p className="font-mono text-sm font-bold text-green-light">{activeStats?.sets ?? 0}</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Sets</p>
          </div>
          <div>
            <p className="font-mono text-sm font-bold text-text-primary">{activeStats?.reps ?? 0}</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Reps</p>
          </div>
        </div>
      </div>

      {/* Body silhouette — viewBox 0 0 100 265 */}
      <svg
        viewBox="0 0 100 265"
        className="w-40 h-auto select-none"
        style={{ touchAction: "manipulation" }}
        aria-label="Muscle group heatmap"
      >
        {/* ── Head (no muscle, just outline) ── */}
        <circle cx="50" cy="17" r="13" fill="#111a11" stroke="#3a4a3a" strokeWidth="1.5" />
        {/* Neck */}
        <rect x="44" y="29" width="12" height="10" rx="3" fill="#111a11" stroke="#3a4a3a" strokeWidth="1" />

        {/* ── Shoulders ── */}
        <ellipse cx="21" cy="47" rx="15" ry="10"
          fill={col("shoulders")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("shoulders")} style={{ cursor: "pointer" }}
        />
        <ellipse cx="79" cy="47" rx="15" ry="10"
          fill={col("shoulders")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("shoulders")} style={{ cursor: "pointer" }}
        />

        {/* ── Chest ── */}
        <ellipse cx="50" cy="60" rx="22" ry="15"
          fill={col("chest")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("chest")} style={{ cursor: "pointer" }}
        />

        {/* ── Back (dashed overlay behind chest — indicates posterior) ── */}
        <ellipse cx="50" cy="57" rx="20" ry="20"
          fill={col("back")} stroke="#5a7a5a" strokeWidth="1" strokeDasharray="3 2"
          fillOpacity="0.45"
          onClick={() => tap("back")} style={{ cursor: "pointer" }}
        />

        {/* ── Upper arms ── */}
        <rect x="7" y="40" width="13" height="45" rx="6"
          fill={col("arms")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("arms")} style={{ cursor: "pointer" }}
        />
        <rect x="80" y="40" width="13" height="45" rx="6"
          fill={col("arms")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("arms")} style={{ cursor: "pointer" }}
        />

        {/* ── Forearms ── */}
        <rect x="6" y="83" width="11" height="34" rx="5"
          fill={col("arms")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("arms")} style={{ cursor: "pointer" }}
        />
        <rect x="83" y="83" width="11" height="34" rx="5"
          fill={col("arms")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("arms")} style={{ cursor: "pointer" }}
        />

        {/* ── Core (abdomen) ── */}
        <rect x="28" y="73" width="44" height="40" rx="6"
          fill={col("core")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("core")} style={{ cursor: "pointer" }}
        />

        {/* ── Glutes / hips ── */}
        <rect x="29" y="111" width="42" height="20" rx="8"
          fill={col("glutes")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("glutes")} style={{ cursor: "pointer" }}
        />

        {/* ── Thighs ── */}
        <rect x="29" y="129" width="18" height="60" rx="7"
          fill={col("legs")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("legs")} style={{ cursor: "pointer" }}
        />
        <rect x="53" y="129" width="18" height="60" rx="7"
          fill={col("legs")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("legs")} style={{ cursor: "pointer" }}
        />

        {/* ── Lower legs ── */}
        <rect x="31" y="187" width="14" height="52" rx="5"
          fill={col("legs")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("legs")} style={{ cursor: "pointer" }}
        />
        <rect x="55" y="187" width="14" height="52" rx="5"
          fill={col("legs")} stroke="#3a4a3a" strokeWidth="1"
          onClick={() => tap("legs")} style={{ cursor: "pointer" }}
        />

        {/* ── Cardio: pulsing ring on chest when trained ── */}
        {(statsMap["cardio"]?.sets ?? 0) > 0 && (
          <ellipse
            cx="50" cy="60" rx="30" ry="22"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.4 + Math.min(0.6, (statsMap["cardio"].sets / maxSets) * 0.6)}
            onClick={() => tap("cardio")} style={{ cursor: "pointer" }}
          />
        )}

        {/* ── Region labels (tiny, non-interactive) ── */}
        <text x="50" y="62" textAnchor="middle" fontSize="3.8" fill="#e8e0c8" fontFamily="monospace" pointerEvents="none">CHEST</text>
        <text x="50" y="93" textAnchor="middle" fontSize="3.8" fill="#e8e0c8" fontFamily="monospace" pointerEvents="none">CORE</text>
        <text x="50" y="121" textAnchor="middle" fontSize="3.5" fill="#e8e0c8" fontFamily="monospace" pointerEvents="none">GLUTES</text>
        <text x="50" y="160" textAnchor="middle" fontSize="3.8" fill="#e8e0c8" fontFamily="monospace" pointerEvents="none">LEGS</text>
        <text x="13.5" y="65" textAnchor="middle" fontSize="3" fill="#c8d0b8" fontFamily="monospace" pointerEvents="none">ARMS</text>
        <text x="86.5" y="65" textAnchor="middle" fontSize="3" fill="#c8d0b8" fontFamily="monospace" pointerEvents="none">ARMS</text>
        <text x="21" y="45.5" textAnchor="middle" fontSize="2.8" fill="#c8d0b8" fontFamily="monospace" pointerEvents="none">SH</text>
        <text x="79" y="45.5" textAnchor="middle" fontSize="2.8" fill="#c8d0b8" fontFamily="monospace" pointerEvents="none">SH</text>
        <text x="50" y="53" textAnchor="middle" fontSize="3" fill="#8a9a7a" fontFamily="monospace" pointerEvents="none">BACK*</text>
      </svg>

      {/* Intensity legend */}
      <div className="flex items-center gap-3">
        <span className="text-[0.5rem] font-mono text-text-secondary uppercase tracking-wider">Low</span>
        {["#1a2a1a", "#225c2a", "#277a38", "#2da348", "#22c55e"].map((c) => (
          <div key={c} className="w-4 h-4 rounded-sm border border-green-dark/40" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[0.5rem] font-mono text-text-secondary uppercase tracking-wider">High</span>
      </div>

      <p className="text-[0.5rem] font-mono text-text-secondary">* Back overlaid behind chest. Tap any region for stats.</p>
    </div>
  );
}
