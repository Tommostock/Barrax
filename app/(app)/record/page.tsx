/* ============================================
   RECORD Page (Service Record)
   Client component — fetches all data on mount.
   No server round-trip needed for tab switching.
   ============================================ */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import RankInsignia from "@/components/rank/RankInsignia";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { RANK_THRESHOLDS } from "@/types";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { Award, Calendar, Trophy } from "lucide-react";
import type { PersonalRecord } from "@/types";

// Elite Achievement categories — mirrors the former /intel/records
// page. Each key matches a `category` value written into the
// personal_records table by lib/records.ts, so adding a new PR
// type means updating both sides.
const PR_CATEGORIES: { key: string; label: string; unit: string }[] = [
  { key: "most_xp_week",      label: "Most XP / Week",     unit: "XP" },
  { key: "fastest_1km",       label: "Fastest 1 km",       unit: "sec/km" },
  { key: "fastest_5km",       label: "Fastest 5 km (Pace)", unit: "sec/km" },
  { key: "longest_run",       label: "Longest Run",        unit: "km" },
  { key: "fastest_1mi",       label: "Fastest 1 Mile",     unit: "sec" },
  { key: "fastest_2p4km",     label: "Fastest 2.4 km",     unit: "sec" },
  { key: "fastest_1500m",     label: "Fastest 1.5 Mile (PFT)", unit: "sec" },
  { key: "fastest_5km_total", label: "Fastest 5 km",       unit: "sec" },
  { key: "fastest_10km",      label: "Fastest 10 km",      unit: "sec" },
  { key: "most_pushups",      label: "Most Push-Ups",      unit: "reps" },
  { key: "longest_plank",     label: "Longest Plank",      unit: "sec" },
  { key: "longest_workout",   label: "Longest Workout",    unit: "min" },
];

// Format a PR value for the compact grid cell. We intentionally
// keep this short — the badge-grid card is narrow, so "4:32" beats
// "272 sec" for run times.
function formatPRValue(category: string, value: number): string {
  // Times stored in seconds render as m:ss (drop hours — nothing
  // here should exceed an hour). Other units render as-is.
  const isSeconds =
    category === "fastest_1km" ||
    category === "fastest_5km" ||
    category === "fastest_1mi" ||
    category === "fastest_2p4km" ||
    category === "fastest_1500m" ||
    category === "fastest_5km_total" ||
    category === "fastest_10km" ||
    category === "longest_plank";

  if (isSeconds) {
    const mins = Math.floor(value / 60);
    const secs = Math.round(value % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Longest run is stored in km as a decimal — show one decimal
  if (category === "longest_run") return `${value.toFixed(1)} km`;

  // Workouts are stored in minutes — integer
  if (category === "longest_workout") return `${Math.round(value)} min`;

  // Reps / XP — integer with thousands separator
  return Math.round(value).toLocaleString();
}

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

export default function RecordPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<{ name?: string; created_at?: string } | null>(null);
  const [rank, setRank] = useState<{ current_rank: number; total_xp: number; rank_history: { rank: number; title: string; achieved_at: string }[] } | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<{ badge_key: string; earned_at: string }[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [pResult, rResult, bResult, wResult, prResult] = await Promise.all([
      supabase.from("profiles").select("name, created_at").eq("id", user.id).single(),
      supabase.from("ranks").select("current_rank, total_xp, rank_history").eq("user_id", user.id).single(),
      supabase.from("badges").select("badge_key, earned_at").eq("user_id", user.id),
      supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "complete"),
      supabase.from("personal_records").select("*").eq("user_id", user.id).order("achieved_at", { ascending: false }),
    ]);

    if (pResult.data) setProfile(pResult.data);
    if (rResult.data) setRank(rResult.data as typeof rank);
    if (bResult.data) setEarnedBadges(bResult.data);
    if (prResult.data) setPersonalRecords(prResult.data as PersonalRecord[]);
    setWorkoutCount(wResult.count ?? 0);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Pull-to-refresh hook reuses the same loader
  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: load });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-6 w-48" />
        <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24" />)}</div>
      </div>
    );
  }

  const currentRank = rank?.current_rank ?? 1;
  const totalXp = rank?.total_xp ?? 0;
  const currentRankInfo = RANK_THRESHOLDS[currentRank - 1];
  const nextRankInfo = RANK_THRESHOLDS[currentRank] ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  const earnedKeys = new Set(earnedBadges.map(b => b.badge_key));

  const daysSinceJoin = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const xpInRank = totalXp - currentRankInfo.xp;
  const xpNeeded = nextRankInfo.xp - currentRankInfo.xp;

  const style = RANK_STYLES[currentRank] ?? RANK_STYLES[1];
  const progressColor = currentRank >= 12 ? "bg-[#D4B850]"
    : currentRank >= 11 ? "bg-[#A8A8B4]"
    : currentRank >= 10 ? "bg-[#B08A3A]"
    : currentRank >= 7 ? "bg-[#5A3A9B]"
    : currentRank >= 5 ? "bg-[#3A7A8B]"
    : "bg-green-primary";

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Service Record</h2>

      {/* Rank card */}
      <div className={`bg-gradient-to-r ${style.bg} border ${style.border} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)" }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">{profile?.name ?? "Operative"}</p>
              <Tag variant={currentRank >= 10 ? "gold" : "active"}>{currentRankInfo?.title ?? "Recruit"}</Tag>
            </div>
            <div className="flex flex-col items-center">
              <RankInsignia rank={currentRank} size={48} />
              <span className="text-[0.5rem] font-mono text-text-secondary mt-0.5">RANK {currentRank}/12</span>
            </div>
          </div>
          <ProgressBar value={xpInRank} max={xpNeeded} color={progressColor} showLabel />
          <p className="text-[0.65rem] font-mono mt-1 tabular-nums">
            <span className="text-xp-gold font-bold">
              {totalXp.toLocaleString()} XP
            </span>
            <span className="text-text-secondary">
              {" "}
              TOTAL — {(nextRankInfo.xp - totalXp).toLocaleString()} to {nextRankInfo?.title}
            </span>
          </p>
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
              <p className="text-lg font-bold font-mono text-text-primary">{workoutCount}</p>
              <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Missions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rank history */}
      {rank?.rank_history && rank.rank_history.length > 0 && (
        <div>
          <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary mb-2">Promotion History</h3>
          <div className="space-y-1">
            {[...rank.rank_history].reverse().map((event, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg-panel border border-green-dark/50">
                <Tag variant="gold">{event.title}</Tag>
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
            const earnedData = earnedBadges.find(b => b.badge_key === badge.key);
            return (
              <div key={badge.key} className={`bg-bg-panel border p-3 text-center ${earned ? "border-xp-gold" : "border-green-dark opacity-40"}`}>
                <Award size={20} className={`mx-auto mb-1 ${earned ? "text-xp-gold" : "text-text-secondary"}`} />
                <p className={`text-[0.6rem] font-heading uppercase tracking-wider ${earned ? "text-sand" : "text-text-secondary"}`}>{badge.name}</p>
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

      {/* Elite Achievements — personal records grid. Moved here from
          the Intel (Debrief) page so service record, badges and PRs
          all live in one place. Card styling deliberately mirrors
          the Badges grid above for visual consistency: same border
          colour rules, same opacity for unearned slots, same font
          sizing for name / detail / date. */}
      <div>
        <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary mb-2">
          Elite Achievements ({personalRecords.filter(r => PR_CATEGORIES.some(c => c.key === r.category)).length}/{PR_CATEGORIES.length})
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PR_CATEGORIES.map((cat) => {
            const record = personalRecords.find((r) => r.category === cat.key);
            const earned = !!record;
            return (
              <div
                key={cat.key}
                className={`bg-bg-panel border p-3 text-center ${earned ? "border-xp-gold" : "border-green-dark opacity-40"}`}
              >
                <Trophy size={20} className={`mx-auto mb-1 ${earned ? "text-xp-gold" : "text-text-secondary"}`} />
                <p className={`text-[0.6rem] font-heading uppercase tracking-wider ${earned ? "text-sand" : "text-text-secondary"}`}>
                  {cat.label}
                </p>
                <p className={`text-[0.55rem] font-mono mt-0.5 ${earned ? "text-xp-gold" : "text-text-secondary"}`}>
                  {earned ? formatPRValue(cat.key, Number(record!.value)) : "No record"}
                </p>
                {earned && record && (
                  <p className="text-[0.45rem] font-mono text-xp-gold mt-1">
                    {new Date(record.achieved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
