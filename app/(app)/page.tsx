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
import { useHQData } from "@/components/providers/HQDataProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading } = useHQData();

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

  // Show skeletons only on the very first paint. On subsequent tab
  // switches `data` is already populated from the provider, so we
  // skip the skeleton entirely and render the last known snapshot.
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
