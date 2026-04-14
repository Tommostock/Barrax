/* ============================================
   COMMAND (Dashboard) Page
   Four compact blocks designed to fit on a single
   iPhone screen without scrolling:

     1. RankStrip         — rank, XP progress (full width)
     2. QuickActionsBar    — 4 icon-only shortcuts (full width)
     3. Today row          — [WorkoutCard | CaloriesCard]
     4. Objectives row     — [ContractCard | ClassifiedOpCard]

   Each of the four split cards is its own self-
   contained button. Every card reads from the HQ
   data context so tab switches are instant.
   ============================================ */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RankStrip from "@/components/dashboard/RankStrip";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import TodayWorkoutCard from "@/components/dashboard/TodayWorkoutCard";
import TodayCaloriesCard from "@/components/dashboard/TodayCaloriesCard";
import ContractCard from "@/components/dashboard/ContractCard";
import ClassifiedOpCard from "@/components/dashboard/ClassifiedOpCard";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { useHQData } from "@/components/providers/HQDataProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, refresh } = useHQData();

  const { pullDistance, refreshing } = usePullToRefresh({
    onRefresh: refresh,
  });

  useEffect(() => {
    router.prefetch("/missions");
    router.prefetch("/rations");
    router.prefetch("/intel");
    router.prefetch("/record");
  }, [router]);

  // Skeleton matches the final layout: one full-width block for
  // RankStrip, one for QuickActionsBar, then two side-by-side rows
  // for the Today cards and the Objectives cards. Grid uses the same
  // gap-2 as QuickActionsBar so the four cards line up with the four
  // quick-log buttons above.
  if (loading && !data) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-60" />
          <div className="skeleton h-60" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-60" />
          <div className="skeleton h-60" />
        </div>
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

      {/* Today row: two separate cards, side by side.
          gap-2 (same as QuickActionsBar) keeps the card edges aligned
          with the left/right pairs of quick-log buttons above.
          min-h forces the boxes to fill the empty space under them. */}
      <div className="grid grid-cols-2 gap-2 min-h-[240px]">
        <TodayWorkoutCard />
        <TodayCaloriesCard />
      </div>

      {/* Objectives row: two separate cards, side by side. */}
      <div className="grid grid-cols-2 gap-2 min-h-[240px]">
        <ContractCard />
        <ClassifiedOpCard />
      </div>
    </div>
  );
}
