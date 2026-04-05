/* ============================================
   ProgressBar Component
   Flat green fill bar with no rounded ends.
   Shows progress as a percentage.
   ============================================ */

interface ProgressBarProps {
  value: number;    // Current value
  max: number;      // Maximum value
  color?: string;   // Tailwind bg colour class (default: green-primary)
  height?: string;  // Height class (default: h-2)
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  color = "bg-green-primary",
  height = "h-2",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  // Calculate percentage, clamped between 0 and 100
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {/* Optional label showing "value / max" */}
      {showLabel && (
        <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
      {/* Background track */}
      <div className={`w-full ${height} bg-bg-panel-alt border border-green-dark`}>
        {/* Fill bar — width is the percentage */}
        <div
          className={`${height} ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
