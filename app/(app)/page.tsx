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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch rank AND streak in parallel (not sequentially)
  const [rankResult, streakResult] = await Promise.all([
    supabase.from("ranks").select("*").eq("user_id", user?.id).single(),
    supabase.from("streaks").select("*").eq("user_id", user?.id).single(),
  ]);

  const rank = rankResult.data;
  const streak = streakResult.data;

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

      {/* Today's rations card (includes mini macro rings) */}
      <TodayRations />

      {/* Quick stats row */}
      <QuickStats />

      {/* Daily challenge card (placeholder until Phase 5) */}
      <DailyChallenge />
    </div>
  );
}
