/* ============================================
   PERFORMANCE hub
   /intel/performance

   Aggregator screen for everything training-related
   that used to live on separate Intel links:

     - Total workouts / total distance / total XP
       (headline stats)
     - Latest PFT snapshot (with overdue flag if any
       test is >= 90 days old)
     - Top 3 recent personal records
     - Deep links:
         /intel/runs          run history + detail
         /intel/volume        muscle volume charts
         /intel/fitness-test  full PFT hub
         /record              Service Record (full PR list)

   One screen, glanceable. The old /intel/records is
   reachable from here as "Legacy PR list" since the
   main PR view now lives on the Service Record tab.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import BackLink from "@/components/ui/BackLink";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import {
  Footprints,
  BarChart3,
  Target,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { formatDistance } from "@/lib/geolocation";
import { formatDateRelative } from "@/lib/format/date";
import {
  loadFitnessTestSummaries,
  formatTestValue,
  hasOverdueTest,
} from "@/lib/fitness/tests";
import {
  FITNESS_TEST_META,
  type FitnessTestType,
  type FitnessTestSummary,
} from "@/types";
import type { PersonalRecord } from "@/types";

interface PerformanceSnapshot {
  workouts: number;
  distance: number;
  xp: number;
  hours: number;
  mins: number;
  pftSummaries: Record<FitnessTestType, FitnessTestSummary>;
  pftOverdue: boolean;
  topPRs: PersonalRecord[];
}

const PFT_ORDER: FitnessTestType[] = ["push_up_max", "plank_hold", "run_1500m"];

// Human-friendly labels for personal-record category keys so the
// Recent PRs list shows "Longest Workout" rather than the raw
// snake_case value stored in the personal_records table.
const PR_CATEGORY_LABELS: Record<string, string> = {
  most_xp_week: "Most XP / Week",
  fastest_1km: "Fastest 1 km",
  fastest_5km: "Fastest 5 km (Pace)",
  longest_run: "Longest Run",
  fastest_1mi: "Fastest 1 Mile",
  fastest_2p4km: "Fastest 2.4 km",
  fastest_1500m: "Fastest 1.5 Mile (PFT)",
  fastest_5km_total: "Fastest 5 km",
  fastest_10km: "Fastest 10 km",
  most_pushups: "Most Push-Ups",
  longest_plank: "Longest Plank",
  longest_workout: "Longest Workout",
};

// Fall back to a Title-Case version of the raw key so unknown
// categories still display as normal words rather than snake_case.
function formatPRCategory(category: string): string {
  if (PR_CATEGORY_LABELS[category]) return PR_CATEGORY_LABELS[category];
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PerformanceHubPage() {
  const supabase = createClient();
  const [data, setData] = useState<PerformanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [wcRes, runsRes, rankRes, wRes, prRes, pftSummaries] =
      await Promise.all([
        supabase
          .from("workouts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "complete"),
        supabase
          .from("runs")
          .select("distance_metres, duration_seconds")
          .eq("user_id", user.id),
        supabase
          .from("ranks")
          .select("total_xp")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("workouts")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .eq("status", "complete"),
        supabase
          .from("personal_records")
          .select("*")
          .eq("user_id", user.id)
          .order("achieved_at", { ascending: false })
          .limit(5),
        loadFitnessTestSummaries(user.id),
      ]);

    const totalDist =
      runsRes.data?.reduce((s, r) => s + (r.distance_metres || 0), 0) ?? 0;
    const totalSecs =
      (wRes.data?.reduce((s, w) => s + (w.duration_seconds || 0), 0) ?? 0) +
      (runsRes.data?.reduce((s, r) => s + (r.duration_seconds || 0), 0) ?? 0);

    setData({
      workouts: wcRes.count ?? 0,
      distance: totalDist,
      xp: rankRes.data?.total_xp ?? 0,
      hours: Math.floor(totalSecs / 3600),
      mins: Math.floor((totalSecs % 3600) / 60),
      pftSummaries,
      pftOverdue: hasOverdueTest(pftSummaries),
      topPRs: (prRes.data as PersonalRecord[]) ?? [],
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: load });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-6 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <BackLink href="/intel" label="Intel" />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Performance
        </h2>
        {data?.pftOverdue && <Tag variant="danger">PFT DUE</Tag>}
      </div>

      {/* ---- Headline stats grid ---- */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Total Workouts" value={(data?.workouts ?? 0).toString()} />
        <StatBox
          label="Total Distance"
          value={`${formatDistance(data?.distance ?? 0)} km`}
        />
        <StatBox
          label="Total XP"
          value={(data?.xp ?? 0).toLocaleString()}
          colour="text-xp-gold"
        />
        <StatBox
          label="Time Trained"
          value={`${data?.hours ?? 0}h ${data?.mins ?? 0}m`}
        />
      </div>

      {/* ---- PFT snapshot ---- */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-green-primary" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              Physical Assessment
            </h3>
          </div>
          <Link
            href="/intel/fitness-test"
            className="text-[0.6rem] font-mono uppercase tracking-wider text-green-light hover:text-green-primary"
          >
            FULL PFT →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PFT_ORDER.map((type) => {
            const meta = FITNESS_TEST_META[type];
            const summary = data?.pftSummaries[type];
            const best = summary?.best?.value ?? null;
            return (
              <div
                key={type}
                className="bg-bg-panel-alt border border-green-dark p-2"
              >
                <p className="text-[0.5rem] font-mono uppercase tracking-wider text-text-secondary">
                  {meta.label}
                </p>
                <p className="text-base font-mono font-bold text-xp-gold tabular-nums">
                  {best !== null ? formatTestValue(best, meta.unit) : "—"}
                </p>
                <p className="text-[0.5rem] font-mono uppercase text-text-secondary mt-0.5">
                  {summary?.latest
                    ? formatDateRelative(summary.latest.measured_at)
                    : "untested"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---- Recent personal records ---- */}
      {data && data.topPRs.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-xp-gold" />
              <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                Recent PRs
              </h3>
            </div>
            <Link
              href="/record"
              className="text-[0.6rem] font-mono uppercase tracking-wider text-green-light hover:text-green-primary"
            >
              ALL RECORDS →
            </Link>
          </div>
          <div className="space-y-1">
            {data.topPRs.slice(0, 3).map((pr) => (
              <div
                key={pr.id}
                className="flex items-center justify-between py-1.5 border-b border-green-dark/50 last:border-0"
              >
                <span className="text-xs text-text-primary">{formatPRCategory(pr.category)}</span>
                <span className="text-sm font-mono font-bold text-xp-gold tabular-nums">
                  {pr.value} {pr.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- Deep links ---- */}
      <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary pt-2">
        Detail
      </h3>
      <PerformanceLink
        href="/intel/runs"
        icon={Footprints}
        title="Run History"
        description="Routes, splits, pace, elevation"
      />
      <PerformanceLink
        href="/intel/volume"
        icon={BarChart3}
        title="Muscle Volume"
        description="Sets and reps by muscle group"
      />
      <PerformanceLink
        href="/intel/fitness-test"
        icon={Target}
        title="PFT Hub"
        description="Take a push-up / plank / 1.5-mile test"
      />
      <PerformanceLink
        href="/intel/records"
        icon={Trophy}
        title="Legacy PR List"
        description="Classic personal records table"
      />
    </div>
  );
}

// ---------- Subcomponents ----------

function StatBox({
  label,
  value,
  colour = "text-text-primary",
}: {
  label: string;
  value: string;
  colour?: string;
}) {
  return (
    <div className="bg-bg-panel border border-green-dark p-3">
      <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
        {label}
      </p>
      <p className={`text-2xl font-bold font-mono tabular-nums ${colour}`}>
        {value}
      </p>
    </div>
  );
}

function PerformanceLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="press-scale hover:bg-bg-panel-alt transition-colors">
        <div className="flex items-center gap-3">
          <div className="min-w-[36px] min-h-[36px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-green-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              {title}
            </h3>
            <p className="text-[0.65rem] text-text-secondary">{description}</p>
          </div>
          <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
