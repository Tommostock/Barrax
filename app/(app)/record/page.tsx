/* ============================================
   RECORD Page (Service Record)
   Shows rank, badges, streaks, and profile.
   Rank card matches the Command tab's RankStrip
   style with rank-coloured gradients.
   ============================================ */

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import { RANK_THRESHOLDS } from "@/types";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { Settings, Shield, Award, Flame, Calendar } from "lucide-react";
import Link from "next/link";

// Same rank colour mapping as the dashboard RankStrip
const RANK_STYLES: Record<number, { bg: string; border: string }> = {
  1:  { bg: "from-[#1A1A1A] to-[#252525]", border: "border-[#3A3A3A]" },
  2:  { bg: "from-[#1A2214] to-[#1F2A18]", border: "border-[#2D4220]" },
  3:  { bg: "from-[#1A2A14] to-[#243618]", border: "border-[#3A5228]" },
  4:  { bg: "from-[#1A3020] to-[#203C28]", border: "border-[#2D6B3A]" },
  5:  { bg: "from-[#142A30] to-[#183640]", border: "border-[#2A5A6B]" },
  6:  { bg: "from-[#141E30] to-[#182840]", border: "border-[#2A4A6B]" },
  7:  { bg: "from-[#1A1430] to-[#241840]", border: "border-[#3A2A6B]" },
  8:  { bg: "from-[#301A1A] to-[#401820]", border: "border-[#6B2A2A]" },
  9:  { bg: "from-[#302014] to-[#402A18]", border: "border-[#6B4A2A]" },
  10: { bg: "from-[#302814] to-[#403618]", border: "border-[#8B6A2A]" },
  11: { bg: "from-[#2A2A30] to-[#38383E]", border: "border-[#8A8A96]" },
  12: { bg: "from-[#3A3018] to-[#4A3E20]", border: "border-[#B8A04A]" },
};

export default async function RecordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user?.id).single();

  const { data: rank } = await supabase
    .from("ranks").select("*").eq("user_id", user?.id).single();

  const { data: streak } = await supabase
    .from("streaks").select("*").eq("user_id", user?.id).single();

  const { data: earnedBadges } = await supabase
    .from("badges").select("*").eq("user_id", user?.id);

  const { count: workoutCount } = await supabase
    .from("workouts").select("*", { count: "exact", head: true })
    .eq("user_id", user?.id).eq("status", "complete");

  const currentRank = rank?.current_rank ?? 1;
  const totalXp = rank?.total_xp ?? 0;
  const currentRankInfo = RANK_THRESHOLDS[currentRank - 1];
  const nextRankInfo = RANK_THRESHOLDS[currentRank] ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  const earnedKeys = new Set(earnedBadges?.map(b => b.badge_key) ?? []);

  const daysSinceJoin = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // XP within current rank bracket (matches dashboard calculation)
  const xpInRank = totalXp - currentRankInfo.xp;
  const xpNeeded = nextRankInfo.xp - currentRankInfo.xp;

  // Rank-coloured gradient and progress bar
  const style = RANK_STYLES[currentRank] ?? RANK_STYLES[1];
  const progressColor = currentRank >= 12 ? "bg-[#D4B850]"
    : currentRank >= 11 ? "bg-[#A8A8B4]"
    : currentRank >= 10 ? "bg-[#B08A3A]"
    : currentRank >= 7 ? "bg-[#5A3A9B]"
    : currentRank >= 5 ? "bg-[#3A7A8B]"
    : "bg-green-primary";

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Military Dossier</h2>

      {/* Profile + Rank card — matches Command tab RankStrip style */}
      <div className={`bg-gradient-to-r ${style.bg} border ${style.border} p-4 relative overflow-hidden`}>
        {/* Subtle diagonal stripe texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)" }}
        />

        <div className="relative z-10">
          {/* Name and rank */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">
                {profile?.name ?? "Operative"}
              </p>
              <Tag variant={currentRank >= 10 ? "gold" : "active"}>{currentRankInfo?.title ?? "Recruit"}</Tag>
            </div>
            <div className="flex flex-col items-center">
              <Shield size={32} className="text-text-secondary opacity-50" />
              <span className="text-[0.5rem] font-mono text-text-secondary mt-0.5">RANK {currentRank}/12</span>
            </div>
          </div>

          {/* XP progress bar — same style as dashboard */}
          <ProgressBar
            value={xpInRank}
            max={xpNeeded}
            color={progressColor}
            showLabel
          />
          <p className="text-[0.65rem] text-text-secondary font-mono mt-1">
            {totalXp.toLocaleString()} XP TOTAL — {(nextRankInfo.xp - totalXp).toLocaleString()} to {nextRankInfo?.title ?? "Next Rank"}
          </p>

          {/* Service stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/5">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-text-primary">{currentRank}</p>
              <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Rank</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-text-primary">{daysSinceJoin}</p>
              <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Days Served</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-text-primary">{workoutCount ?? 0}</p>
              <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Missions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame size={24} className={(streak?.current_streak ?? 0) > 0 ? "text-xp-gold" : "text-text-secondary"} />
            <div>
              <p className="text-2xl font-bold font-mono text-text-primary">{streak?.current_streak ?? 0}</p>
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Current Streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-text-primary">{streak?.longest_streak ?? 0}</p>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Best Streak</p>
          </div>
        </div>
      </Card>

      {/* Rank history */}
      {rank?.rank_history && (rank.rank_history as { rank: number; title: string; achieved_at: string }[]).length > 0 && (
        <div>
          <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary mb-2">Promotion History</h3>
          <div className="space-y-1">
            {(rank.rank_history as { rank: number; title: string; achieved_at: string }[])
              .slice().reverse().map((event, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg-panel border border-green-dark/50">
                <div className="flex items-center gap-2">
                  <Tag variant="gold">{event.title}</Tag>
                </div>
                <span className="text-[0.6rem] font-mono text-text-secondary flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(event.achieved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge grid */}
      <div>
        <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary mb-2">
          Badges & Achievements ({earnedKeys.size}/{BADGE_DEFINITIONS.length})
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = earnedKeys.has(badge.key);
            const earnedData = earnedBadges?.find(b => b.badge_key === badge.key);

            return (
              <div key={badge.key}
                className={`bg-bg-panel border p-3 text-center ${earned ? "border-xp-gold" : "border-green-dark opacity-40"}`}>
                <Award size={20} className={`mx-auto mb-1 ${earned ? "text-xp-gold" : "text-text-secondary"}`} />
                <p className={`text-[0.6rem] font-heading uppercase tracking-wider ${earned ? "text-sand" : "text-text-secondary"}`}>
                  {badge.name}
                </p>
                <p className="text-[0.5rem] font-mono text-text-secondary mt-0.5">{badge.description}</p>
                {earned && earnedData && (
                  <p className="text-[0.45rem] font-mono text-xp-gold mt-1">
                    {new Date(earnedData.earned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings link */}
      <Link href="/record/settings">
        <Card className="flex items-center gap-3 hover:bg-bg-panel-alt transition-colors">
          <Settings size={18} className="text-green-primary" />
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Base Operations</h3>
            <p className="text-xs text-text-secondary">Settings and preferences</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
