/* ============================================
   MacroRings Component
   Circular progress indicators for daily macros.
   Shows calories (large centre), protein, carbs, fat.
   Uses SVG circles for the ring effect.
   Numbers animate when values change.
   ============================================ */

import useCountUp from "@/hooks/useCountUp";

// Animated number display using the count-up hook
function AnimatedValue({ value }: { value: number }) {
  const display = useCountUp(value);
  return <span className="text-lg font-bold font-mono text-text-primary">{display}</span>;
}

interface MacroRingsProps {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

// SVG circular progress ring
function Ring({
  value,
  max,
  size,
  strokeWidth,
  color,
  label,
  unit,
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  unit: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-panel-alt)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Centre text overlay */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <AnimatedValue value={value} />
        <span className="text-[0.5rem] font-mono text-text-secondary uppercase">{unit}</span>
      </div>
      <p className="text-[0.55rem] font-mono text-text-secondary uppercase mt-1">{label}</p>
      <p className="text-[0.5rem] font-mono text-text-secondary">/ {Math.round(max)}</p>
    </div>
  );
}

export default function MacroRings({
  calories, calorieTarget,
  protein, proteinTarget,
  carbs, carbsTarget,
  fat, fatTarget,
}: MacroRingsProps) {
  return (
    <div className="bg-bg-panel border border-green-dark p-4">
      {/* Main calorie ring (large, centred) + remaining calories */}
      <div className="flex justify-center mb-2 relative">
        <Ring
          value={calories}
          max={calorieTarget}
          size={120}
          strokeWidth={8}
          color={calories > calorieTarget ? "var(--danger)" : "var(--green-primary)"}
          label="Calories"
          unit="kcal"
        />
      </div>
      {/* Remaining calories — big prominent number */}
      <div className="text-center mb-3">
        {calories < calorieTarget ? (
          <p className="text-lg font-bold font-mono text-green-light">
            {Math.round(calorieTarget - calories)} kcal remaining
          </p>
        ) : (
          <p className="text-lg font-bold font-mono text-danger">
            {Math.round(calories - calorieTarget)} kcal over target
          </p>
        )}
      </div>

      {/* Macro rings row (smaller) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex justify-center relative">
          <Ring
            value={protein}
            max={proteinTarget}
            size={72}
            strokeWidth={5}
            color="var(--green-light)"
            label="Protein"
            unit="g"
          />
        </div>
        <div className="flex justify-center relative">
          <Ring
            value={carbs}
            max={carbsTarget}
            size={72}
            strokeWidth={5}
            color="var(--xp-gold)"
            label="Carbs"
            unit="g"
          />
        </div>
        <div className="flex justify-center relative">
          <Ring
            value={fat}
            max={fatTarget}
            size={72}
            strokeWidth={5}
            color="var(--sand)"
            label="Fat"
            unit="g"
          />
        </div>
      </div>
    </div>
  );
}
