/* ============================================
   Loading State
   Shows immediately when navigating between tabs.
   Prevents the blank screen / crash that happens
   when the page takes too long to render.
   ============================================ */

export default function Loading() {
  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Skeleton rank strip */}
      <div className="skeleton h-20 w-full" />
      {/* Skeleton cards */}
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-28 w-full" />
      <div className="skeleton h-28 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
      <div className="skeleton h-24 w-full" />
    </div>
  );
}
