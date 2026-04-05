/* ============================================
   Skeleton Component
   Shimmer loading placeholder. Used instead of
   spinners — shows the shape of content while loading.
   ============================================ */

interface SkeletonProps {
  className?: string; // Use Tailwind classes for width/height
}

export default function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

/* Pre-built skeleton patterns for common layouts */

export function SkeletonCard() {
  return (
    <div className="bg-bg-panel border border-green-dark p-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-bg-panel border border-green-dark p-3 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
