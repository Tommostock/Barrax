/* ============================================
   XP Audit Log Screen
   /intel/xp-log
   Paginated list of xp_events rows so the user can see
   every point they've earned, with its source. Populated
   server-side by /api/award-xp on every XP gain.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import {
  Dumbbell,
  Footprints,
  Crosshair,
  Lock,
  Trophy,
  Droplets,
  Target,
  Award,
  CalendarCheck,
  Zap,
} from "lucide-react";
import type { XpEvent, XpSource } from "@/types/missions";

const PAGE_SIZE = 50;

const SOURCE_LABEL: Record<XpSource, string> = {
  workout_complete: "Workout",
  run_complete: "Run",
  daily_contract: "Contract",
  classified_op: "Classified Op",
  daily_challenge: "Daily Challenge (archive)",
  badge_earned: "Badge",
  personal_record: "Personal Record",
  water_goal_hit: "Water Goal",
  weekly_summary_bonus: "Weekly Summary",
  other: "Other",
};

function SourceIcon({ source }: { source: XpSource }) {
  const cls = "text-xp-gold";
  switch (source) {
    case "workout_complete":
      return <Dumbbell size={18} className={cls} />;
    case "run_complete":
      return <Footprints size={18} className={cls} />;
    case "daily_contract":
      return <Crosshair size={18} className={cls} />;
    case "classified_op":
      return <Lock size={18} className={cls} />;
    case "daily_challenge":
      return <Target size={18} className={cls} />;
    case "badge_earned":
      return <Award size={18} className={cls} />;
    case "personal_record":
      return <Trophy size={18} className={cls} />;
    case "water_goal_hit":
      return <Droplets size={18} className={cls} />;
    case "weekly_summary_bonus":
      return <CalendarCheck size={18} className={cls} />;
    default:
      return <Zap size={18} className={cls} />;
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function XPLogPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<XpEvent[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [weekXP, setWeekXP] = useState(0);

  const load = useCallback(
    async (reset: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const currentPage = reset ? 0 : page;

      // Events page
      const { data: eventsData } = await supabase
        .from("xp_events")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

      const fresh = (eventsData ?? []) as XpEvent[];
      setEvents((prev) => (reset ? fresh : [...prev, ...fresh]));
      setHasMore(fresh.length === PAGE_SIZE);

      // Summary stats (only on first load)
      if (reset) {
        const { data: rank } = await supabase
          .from("ranks")
          .select("total_xp")
          .eq("user_id", user.id)
          .maybeSingle();
        setTotalXP(rank?.total_xp ?? 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const { data: weekly } = await supabase
          .from("xp_events")
          .select("amount")
          .eq("user_id", user.id)
          .gte("occurred_at", weekStart.toISOString());
        const weekSum = (weekly ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
        setWeekXP(weekSum);
      }

      setLoading(false);
    },
    [supabase, page],
  );

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1);
    const fresh = (data ?? []) as XpEvent[];
    setEvents((prev) => [...prev, ...fresh]);
    setHasMore(fresh.length === PAGE_SIZE);
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        XP Audit Log
      </h2>

      {/* Sticky summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Last 7 Days
          </p>
          <p className="text-2xl font-bold font-mono text-xp-gold">
            +{weekXP.toLocaleString()}
          </p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            All Time
          </p>
          <p className="text-2xl font-bold font-mono text-xp-gold tabular-nums">
            {totalXP.toLocaleString()}
          </p>
        </div>
      </div>

      {events.length === 0 && (
        <Card>
          <p className="text-xs text-text-secondary">
            No XP events yet. Complete a workout, log a meal, or clear a
            contract to start the ledger.
          </p>
        </Card>
      )}

      {events.map((e) => {
        const source = (e.source as XpSource) ?? "other";
        return (
          <Card key={e.id}>
            <div className="flex items-start gap-3">
              <div className="min-w-[36px] min-h-[36px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
                <SourceIcon source={source} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag variant="gold">{`+${e.amount} XP`}</Tag>
                  <span className="text-sm font-heading uppercase tracking-wider text-sand">
                    {SOURCE_LABEL[source] ?? "Other"}
                  </span>
                </div>
                <p className="text-[0.65rem] font-mono text-text-secondary mt-1 uppercase tracking-wider">
                  {relativeTime(e.occurred_at)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
            </div>
          </Card>
        );
      })}

      {hasMore && events.length > 0 && (
        <button
          type="button"
          onClick={loadMore}
          className="w-full font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-sand transition-colors py-3 border border-green-dark"
        >
          [ LOAD MORE ]
        </button>
      )}
    </div>
  );
}
