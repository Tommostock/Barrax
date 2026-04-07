/* ============================================
   COMMAND (Dashboard) Page
   The daily command centre. Shows rank, streak,
   today's mission, rations, quick stats, and
   daily challenge at a glance.
   ============================================ */

import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering — this page needs auth cookies and DB access
export const dynamic = "force-dynamic";
import RankStrip from "@/components/dashboard/RankStrip";
import StreakCounter from "@/components/dashboard/StreakCounter";
import QuickActions from "@/components/dashboard/QuickActions";
import TodayMission from "@/components/dashboard/TodayMission";
import TodayRations from "@/components/dashboard/TodayRations";
import QuickStats from "@/components/dashboard/QuickStats";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import MacroSummary from "@/components/dashboard/MacroSummary";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch rank data (or use defaults if not yet created)
  const { data: rank } = await supabase
    .from("ranks")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  // Fetch streak data
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  // Fetch profile for the user's name
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, unit_preference")
    .eq("id", user?.id)
    .single();

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Rank strip with XP progress bar */}
      <RankStrip
        currentRank={rank?.current_rank ?? 1}
        totalXp={rank?.total_xp ?? 0}
      />

      {/* Streak counter */}
      <StreakCounter
        currentStreak={streak?.current_streak ?? 0}
        longestStreak={streak?.longest_streak ?? 0}
        freezeAvailable={!streak?.freeze_used_this_week}
      />

      {/* Quick actions: start run, log food, log weight — one tap each */}
      <QuickActions />

      {/* Today's mission card — pulls real workout data */}
      <TodayMission />

      {/* Today's rations card */}
      <TodayRations />

      {/* Macro summary — shows when food diary has entries today */}
      <MacroSummary />

      {/* Quick stats row */}
      <QuickStats />

      {/* Daily challenge card (placeholder until Phase 5) */}
      <DailyChallenge />
    </div>
  );
}
