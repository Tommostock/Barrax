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
import ContractCard from "@/components/dashboard/ContractCard";
import ClassifiedOpCard from "@/components/dashboard/ClassifiedOpCard";

export default function DashboardPage() {
  const supabase = createClient();
  const [rank, setRank] = useState<{ current_rank: number; total_xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [rankResult] = await Promise.all([
        supabase.from("ranks").select("current_rank, total_xp").eq("user_id", user.id).single(),
      ]);

      if (rankResult.data) setRank(rankResult.data);
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
      <ContractCard />
      <ClassifiedOpCard />
      <TodayRations />
    </div>
  );
}
