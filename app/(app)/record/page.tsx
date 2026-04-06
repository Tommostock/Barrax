/* ============================================
   RECORD Page (Service Record)
   Shows rank, badges, streaks, and profile.
   Full gamification display with earned/unearned badges.
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

  const currentRankInfo = RANK_THRESHOLDS[(rank?.current_rank ?? 1) - 1];
  const nextRankInfo = RANK_THRESHOLDS[rank?.current_rank ?? 1];
  const earnedKeys = new Set(earnedBadges?.map(b => b.badge_key) ?? []);

  // Calculate time served (days since account creation)
  const daysSinceJoin = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Service Record</h2>

      {/* Profile + Rank card */}
      <div className="camo-bg relative overflow-hidden border border-green-dark p-4">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">
                {profile?.name ?? "Operative"}
              </p>
              <Tag variant="gold">{currentRankInfo?.title ?? "Recruit"}</Tag>
            </div>
            <Shield size={40} className="text-green-dark" />
          </div>

          <ProgressBar
            value={rank?.total_xp ?? 0}
            max={nextRankInfo?.xp ?? 200}
            color="bg-xp-gold"
            showLabel
          />
          <p className="text-[0.65rem] text-text-secondary font-mono mt-1">
            {(rank?.total_xp ?? 0).toLocaleString()} / {(nextRankInfo?.xp ?? 200).toLocaleString()} XP to {nextRankInfo?.title ?? "Private"}
          </p>

          {/* Service stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-text-primary">{rank?.current_rank ?? 1}</p>
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
              <div
                key={badge.key}
                className={`bg-bg-panel border p-3 text-center ${earned ? "border-xp-gold" : "border-green-dark opacity-40"}`}
              >
                <Award size={20} className={`mx-auto mb-1 ${earned ? "text-xp-gold" : "text-text-secondary"}`} />
                <p className={`text-[0.6rem] font-heading uppercase tracking-wider ${earned ? "text-sand" : "text-text-secondary"}`}>
                  {badge.name}
                </p>
                <p className="text-[0.5rem] font-mono text-text-secondary mt-0.5">
                  {badge.description}
                </p>
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
