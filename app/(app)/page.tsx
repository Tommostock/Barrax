/* ============================================
   COMMAND (Dashboard) Page
   Four compact blocks designed to fit on a single
   iPhone screen without scrolling:

     1. RankStrip     — rank, XP progress
     2. QuickActionsBar — 4 icon-only shortcuts
     3. TodayStrip    — today's workout + calories
     4. ObjectivesCard — contract + classified op

   HQ reads from the HQDataProvider which lives at
   the layout level. Tab switches HQ -> other -> HQ
   re-render INSTANTLY from the cached snapshot
   instead of re-fetching Supabase from scratch.

   Adding a new card here means something else moves
   off or collapses. HQ is sacred -- one screen, at
   a glance, always.
   ============================================ */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RankStrip from "@/components/dashboard/RankStrip";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import TodayStrip from "@/components/dashboard/TodayStrip";
import ObjectivesCard from "@/components/dashboard/ObjectivesCard";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { useHQData } from "@/components/providers/HQDataProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, refresh } = useHQData();

  // Pull-to-refresh gesture drops straight into the provider's
  // refresh() so the user can pull down on HQ to force a data
  // reload. Consistent with every other list screen in the app.
  const { pullDistance, refreshing } = usePullToRefresh({
    onRefresh: refresh,
  });

  // Prefetch the likely-next routes so tapping a tab is instant.
  // Next.js only prefetches <Link href> targets by default; we use
  // useRouter navigation in several places, so call the imperative
  // prefetch API here on HQ mount to warm the bundles for ASSAULT
  // and FUEL UP. Low cost, big smoothness win.
  useEffect(() => {
    router.prefetch("/missions");
    router.prefetch("/rations");
    router.prefetch("/intel");
    router.prefetch("/record");
  }, [router]);

  // Skeleton matches the shape of the real content: 4 blocks at the
  // same heights they'll end up at, so there's no layout jitter when
  // data arrives. Only shown on the very first paint -- tab-switch
  // re-renders reuse the cached snapshot with no flash.
  if (loading && !data) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <RankStrip
        currentRank={data?.rank?.current_rank ?? 1}
        totalXp={data?.rank?.total_xp ?? 0}
      />
      <QuickActionsBar />
      <TodayStrip />
      <ObjectivesCard />
    </div>
  );
}
