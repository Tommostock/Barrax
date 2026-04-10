/* ============================================
   Body Heatmap Component
   Anatomical front + back body silhouette with
   muscle regions coloured by training volume.

   Heat scale (low → high):
     dark green → light green → yellow → orange → red
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

// Heat scale: untrained (dark green) → light green → yellow → orange → red
function heatColor(sets: number, maxSets: number): string {
  if (maxSets === 0 || sets === 0) return "#1a2a1a";
  const pct = sets / maxSets;
  if (pct < 0.2) return "#1f5a25";  // dark green
  if (pct < 0.4) return "#3eaa3a";  // light green
  if (pct < 0.6) return "#d4c534";  // yellow
  if (pct < 0.8) return "#e68a1f";  // orange
  return "#dc2626";                  // red
}

const HEAT_SWATCHES = ["#1a2a1a", "#1f5a25", "#3eaa3a", "#d4c534", "#e68a1f", "#dc2626"];

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
  const stroke = "#3a4a3a";
  const sw = 0.6;

  // Body outline path — front view (anatomical proportions)
  // viewBox 0 0 200 480
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tooltip: active muscle stats */}
      <div
        className={`border border-green-dark bg-bg-panel px-5 py-2 text-center min-w-[200px] transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <p className="text-xs font-heading uppercase tracking-wider text-sand">
          {active ? MUSCLE_LABELS[active] ?? active : "—"}
        </p>
        <div className="flex items-center justify-center gap-5 mt-1">
          <div>
            <p className="font-mono text-base font-bold text-green-light">{activeStats?.sets ?? 0}</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Sets</p>
          </div>
          <div>
            <p className="font-mono text-base font-bold text-text-primary">{activeStats?.reps ?? 0}</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Reps</p>
          </div>
        </div>
      </div>

      {/* Front + back body silhouettes side by side */}
      <div className="flex items-start gap-4">
        {/* ========== FRONT VIEW ========== */}
        <div className="flex flex-col items-center">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mb-1">Front</p>
          <svg viewBox="0 0 200 480" className="w-32 h-auto select-none" style={{ touchAction: "manipulation" }}>
            {/* Body outline path — single contour */}
            <path
              d="M 100 18
                 C 88 18, 78 28, 78 42
                 C 78 56, 86 65, 96 67
                 L 96 73
                 L 78 78
                 C 60 80, 46 92, 40 110
                 L 30 145
                 L 22 178
                 C 16 200, 18 218, 24 232
                 L 30 250
                 C 32 256, 34 262, 32 268
                 L 22 305
                 C 18 322, 20 332, 22 340
                 L 24 350
                 L 22 380
                 L 18 420
                 L 22 450
                 L 32 460
                 L 50 460
                 L 56 450
                 L 56 420
                 L 60 380
                 L 64 340
                 L 70 300
                 L 76 260
                 L 82 235
                 L 88 235
                 L 92 280
                 L 92 340
                 L 92 380
                 L 90 420
                 L 88 450
                 L 96 460
                 L 104 460
                 L 112 450
                 L 110 420
                 L 108 380
                 L 108 340
                 L 108 280
                 L 112 235
                 L 118 235
                 L 124 260
                 L 130 300
                 L 136 340
                 L 140 380
                 L 144 420
                 L 144 450
                 L 150 460
                 L 168 460
                 L 178 450
                 L 182 420
                 L 178 380
                 L 176 350
                 L 178 340
                 C 180 332, 182 322, 178 305
                 L 168 268
                 C 166 262, 168 256, 170 250
                 L 176 232
                 C 182 218, 184 200, 178 178
                 L 170 145
                 L 160 110
                 C 154 92, 140 80, 122 78
                 L 104 73
                 L 104 67
                 C 114 65, 122 56, 122 42
                 C 122 28, 112 18, 100 18 Z"
              fill="#0c1a0c"
              stroke={stroke}
              strokeWidth="1.5"
            />

            {/* Trapezius / Neck base (shoulders top) */}
            <path d="M 78 80 Q 100 72 122 80 L 122 92 L 78 92 Z"
              fill={col("shoulders")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("shoulders")} style={{ cursor: "pointer" }} />

            {/* Pectorals — chest, two halves */}
            <path d="M 78 92 Q 78 110 92 122 L 100 122 L 100 96 Q 90 92 78 92 Z"
              fill={col("chest")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("chest")} style={{ cursor: "pointer" }} />
            <path d="M 122 92 Q 122 110 108 122 L 100 122 L 100 96 Q 110 92 122 92 Z"
              fill={col("chest")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("chest")} style={{ cursor: "pointer" }} />

            {/* Deltoids — shoulders */}
            <ellipse cx="62" cy="100" rx="14" ry="14"
              fill={col("shoulders")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("shoulders")} style={{ cursor: "pointer" }} />
            <ellipse cx="138" cy="100" rx="14" ry="14"
              fill={col("shoulders")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("shoulders")} style={{ cursor: "pointer" }} />

            {/* Biceps — upper arms */}
            <path d="M 44 116 Q 36 132 36 156 Q 36 172 46 172 L 56 168 L 60 132 Q 56 116 44 116 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />
            <path d="M 156 116 Q 164 132 164 156 Q 164 172 154 172 L 144 168 L 140 132 Q 144 116 156 116 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />

            {/* Forearms */}
            <path d="M 36 174 Q 28 200 26 230 L 38 234 L 48 200 L 46 174 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />
            <path d="M 164 174 Q 172 200 174 230 L 162 234 L 152 200 L 154 174 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />

            {/* Abdominals — core (split into 6-pack rectangles for shape) */}
            <rect x="82" y="124" width="36" height="22" rx="3"
              fill={col("core")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("core")} style={{ cursor: "pointer" }} />
            <rect x="82" y="148" width="36" height="22" rx="3"
              fill={col("core")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("core")} style={{ cursor: "pointer" }} />
            <rect x="82" y="172" width="36" height="22" rx="3"
              fill={col("core")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("core")} style={{ cursor: "pointer" }} />

            {/* Obliques — sides of core */}
            <path d="M 70 130 Q 64 160 70 194 L 82 194 L 82 130 Z"
              fill={col("core")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("core")} style={{ cursor: "pointer" }} />
            <path d="M 130 130 Q 136 160 130 194 L 118 194 L 118 130 Z"
              fill={col("core")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("core")} style={{ cursor: "pointer" }} />

            {/* Hip / pelvis (covered by glutes from back, dim front fill) */}
            <path d="M 70 196 L 130 196 L 124 232 L 76 232 Z"
              fill={col("glutes")} stroke={stroke} strokeWidth={sw}
              fillOpacity={0.7}
              onClick={() => tap("glutes")} style={{ cursor: "pointer" }} />

            {/* Quads — left thigh */}
            <path d="M 76 234 Q 70 290 70 340 L 90 342 L 92 280 L 88 234 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />
            {/* Quads — right thigh */}
            <path d="M 124 234 Q 130 290 130 340 L 110 342 L 108 280 L 112 234 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />

            {/* Calves — left lower leg */}
            <path d="M 60 348 Q 56 400 56 450 L 78 450 L 80 400 L 78 348 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />
            {/* Calves — right lower leg */}
            <path d="M 140 348 Q 144 400 144 450 L 122 450 L 120 400 L 122 348 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />

            {/* Cardio glow — pulsing ring around chest */}
            {(statsMap["cardio"]?.sets ?? 0) > 0 && (
              <ellipse
                cx="100" cy="115" rx="46" ry="32"
                fill="none"
                stroke={col("cardio")}
                strokeWidth="2"
                strokeDasharray="5 4"
                opacity={0.5 + Math.min(0.5, (statsMap["cardio"].sets / maxSets) * 0.5)}
                onClick={() => tap("cardio")} style={{ cursor: "pointer" }}
              />
            )}

            {/* Head outline (no muscle) */}
            <ellipse cx="100" cy="42" rx="22" ry="24" fill="none" stroke={stroke} strokeWidth="1.2" />
          </svg>
        </div>

        {/* ========== BACK VIEW ========== */}
        <div className="flex flex-col items-center">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mb-1">Back</p>
          <svg viewBox="0 0 200 480" className="w-32 h-auto select-none" style={{ touchAction: "manipulation" }}>
            {/* Same body outline as front */}
            <path
              d="M 100 18
                 C 88 18, 78 28, 78 42
                 C 78 56, 86 65, 96 67
                 L 96 73
                 L 78 78
                 C 60 80, 46 92, 40 110
                 L 30 145
                 L 22 178
                 C 16 200, 18 218, 24 232
                 L 30 250
                 C 32 256, 34 262, 32 268
                 L 22 305
                 C 18 322, 20 332, 22 340
                 L 24 350
                 L 22 380
                 L 18 420
                 L 22 450
                 L 32 460
                 L 50 460
                 L 56 450
                 L 56 420
                 L 60 380
                 L 64 340
                 L 70 300
                 L 76 260
                 L 82 235
                 L 88 235
                 L 92 280
                 L 92 340
                 L 92 380
                 L 90 420
                 L 88 450
                 L 96 460
                 L 104 460
                 L 112 450
                 L 110 420
                 L 108 380
                 L 108 340
                 L 108 280
                 L 112 235
                 L 118 235
                 L 124 260
                 L 130 300
                 L 136 340
                 L 140 380
                 L 144 420
                 L 144 450
                 L 150 460
                 L 168 460
                 L 178 450
                 L 182 420
                 L 178 380
                 L 176 350
                 L 178 340
                 C 180 332, 182 322, 178 305
                 L 168 268
                 C 166 262, 168 256, 170 250
                 L 176 232
                 C 182 218, 184 200, 178 178
                 L 170 145
                 L 160 110
                 C 154 92, 140 80, 122 78
                 L 104 73
                 L 104 67
                 C 114 65, 122 56, 122 42
                 C 122 28, 112 18, 100 18 Z"
              fill="#0c1a0c"
              stroke={stroke}
              strokeWidth="1.5"
            />

            {/* Traps */}
            <path d="M 78 80 L 100 76 L 122 80 L 118 100 L 100 110 L 82 100 Z"
              fill={col("back")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("back")} style={{ cursor: "pointer" }} />

            {/* Rear deltoids */}
            <ellipse cx="62" cy="100" rx="14" ry="14"
              fill={col("shoulders")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("shoulders")} style={{ cursor: "pointer" }} />
            <ellipse cx="138" cy="100" rx="14" ry="14"
              fill={col("shoulders")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("shoulders")} style={{ cursor: "pointer" }} />

            {/* Lats — wide V-shape */}
            <path d="M 78 100 Q 60 130 70 180 L 100 195 L 130 180 Q 140 130 122 100 L 100 115 Z"
              fill={col("back")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("back")} style={{ cursor: "pointer" }} />

            {/* Lower back */}
            <rect x="82" y="190" width="36" height="22" rx="3"
              fill={col("back")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("back")} style={{ cursor: "pointer" }} />

            {/* Triceps — back of upper arm */}
            <path d="M 44 116 Q 36 132 36 156 Q 36 172 46 172 L 56 168 L 60 132 Q 56 116 44 116 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />
            <path d="M 156 116 Q 164 132 164 156 Q 164 172 154 172 L 144 168 L 140 132 Q 144 116 156 116 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />

            {/* Forearms (back) */}
            <path d="M 36 174 Q 28 200 26 230 L 38 234 L 48 200 L 46 174 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />
            <path d="M 164 174 Q 172 200 174 230 L 162 234 L 152 200 L 154 174 Z"
              fill={col("arms")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("arms")} style={{ cursor: "pointer" }} />

            {/* Glutes — two rounded shapes */}
            <ellipse cx="84" cy="222" rx="18" ry="14"
              fill={col("glutes")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("glutes")} style={{ cursor: "pointer" }} />
            <ellipse cx="116" cy="222" rx="18" ry="14"
              fill={col("glutes")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("glutes")} style={{ cursor: "pointer" }} />

            {/* Hamstrings — back of thigh */}
            <path d="M 76 240 Q 70 290 72 340 L 92 340 L 92 280 L 88 240 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />
            <path d="M 124 240 Q 130 290 128 340 L 108 340 L 108 280 L 112 240 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />

            {/* Calves */}
            <path d="M 60 348 Q 56 400 56 450 L 78 450 L 80 400 L 78 348 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />
            <path d="M 140 348 Q 144 400 144 450 L 122 450 L 120 400 L 122 348 Z"
              fill={col("legs")} stroke={stroke} strokeWidth={sw}
              onClick={() => tap("legs")} style={{ cursor: "pointer" }} />

            {/* Head outline (back) */}
            <ellipse cx="100" cy="42" rx="22" ry="24" fill="none" stroke={stroke} strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      {/* Intensity legend */}
      <div className="flex items-center gap-2">
        <span className="text-[0.5rem] font-mono text-text-secondary uppercase tracking-wider">Cold</span>
        {HEAT_SWATCHES.map((c) => (
          <div key={c} className="w-5 h-5 rounded-sm border border-green-dark/40" style={{ backgroundColor: c }} />
        ))}
        <span className="text-[0.5rem] font-mono text-text-secondary uppercase tracking-wider">Hot</span>
      </div>

      <p className="text-[0.5rem] font-mono text-text-secondary text-center max-w-xs">
        Tap any muscle for stats. Heat shows weekly volume — cold = untrained, hot = heavy work.
      </p>
    </div>
  );
}
