/* ============================================
   COMMAND (Dashboard) Page
   Client component — fetches rank on mount, renders
   four compact blocks designed to fit on a single
   iPhone screen without scrolling:

     1. RankStrip     — rank, XP progress
     2. QuickActionsBar — 4 icon-only shortcuts
     3. TodayStrip    — today's workout + calories
     4. ObjectivesCard — contract + classified op

   Adding a new card here means something else
   moves off or collapses. HQ is sacred -- one
   screen, at a glance, always.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import RankStrip from "@/components/dashboard/RankStrip";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import TodayStrip from "@/components/dashboard/TodayStrip";
import ObjectivesCard from "@/components/dashboard/ObjectivesCard";

export default function DashboardPage() {
  const supabase = createClient();
  const [rank, setRank] = useState<{ current_rank: number; total_xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: rankData } = await supabase
        .from("ranks")
        .select("current_rank, total_xp")
        .eq("user_id", user.id)
        .single();

      if (rankData) setRank(rankData);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
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
        currentRank={rank?.current_rank ?? 1}
        totalXp={rank?.total_xp ?? 0}
      />
      <QuickActionsBar />
      <TodayStrip />
      <ObjectivesCard />
    </div>
  );
}
