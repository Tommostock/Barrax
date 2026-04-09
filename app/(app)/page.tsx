/* ============================================
   COMMAND (Dashboard) Page
   Client component — fetches data on mount instead
   of server-side. This makes tab switching instant
   since no server round-trip is needed.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import RankStrip from "@/components/dashboard/RankStrip";
import QuickActions from "@/components/dashboard/QuickActions";
import TodayMission from "@/components/dashboard/TodayMission";
import TodayRations from "@/components/dashboard/TodayRations";
import QuickStats from "@/components/dashboard/QuickStats";
import DailyChallenge from "@/components/dashboard/DailyChallenge";

export default function DashboardPage() {
  const supabase = createClient();
  const [rank, setRank] = useState<{ current_rank: number; total_xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: rankData } = await supabase
        .from("ranks").select("current_rank, total_xp").eq("user_id", user.id).single();

      if (rankData) setRank(rankData);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <RankStrip
        currentRank={rank?.current_rank ?? 1}
        totalXp={rank?.total_xp ?? 0}
      />

      <QuickActions />
      <TodayMission />
      <TodayRations />
      <QuickStats />
      <DailyChallenge />
    </div>
  );
}
