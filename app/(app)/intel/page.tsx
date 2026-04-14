/* ============================================
   INTEL (Debrief) Hub
   Collapsed the 7+ flat link cards of the old Intel
   hub into three grouped sections -- BODY, FUEL,
   PERFORMANCE -- each with its own aggregator hub
   page underneath, plus a compact MORE block for
   everything else (challenges, xp log, weekly
   report, base operations).

   Each section card shows a tiny headline metric
   so users see the state of the section without
   drilling in. Tap the card to go to its hub, where
   all the detail views for that section are one
   swipe away.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import WorkoutCalendar from "@/components/intel/WorkoutCalendar";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import {
  Activity,
  Utensils,
  TrendingUp,
  Target,
  ListChecks,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";
import { formatDistance } from "@/lib/geolocation";

interface IntelStats {
  workouts: number;
  distance: number;
  xp: number;
  hours: number;
  mins: number;
  latestWeightKg: number | null;
  todayCalories: number;
  calorieTarget: number;
  pftOverdue: boolean;
}

export default function IntelPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<IntelStats | null>(null);
  const [calendarWorkouts, setCalendarWorkouts] = useState<
    { scheduled_date: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      wcResult,
      runsResult,
      rankResult,
      wResult,
      calResult,
      weightRes,
      diaryRes,
      profileRes,
    ] = await Promise.all([
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
        .from("workouts")
        .select("scheduled_date, status")
        .eq("user_id", user.id),
      supabase
        .from("weight_logs")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("food_diary")
        .select("calories")
        .eq("user_id", user.id)
        .gte("logged_at", todayStart.toISOString())
        .lte("logged_at", todayEnd.toISOString()),
      supabase
        .from("profiles")
        .select("calorie_target")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (calResult.data) setCalendarWorkouts(calResult.data);

    const totalDist =
      runsResult.data?.reduce((s, r) => s + (r.distance_metres || 0), 0) ?? 0;
    const totalSecs =
      (wResult.data?.reduce((s, w) => s + (w.duration_seconds || 0), 0) ?? 0) +
      (runsResult.data?.reduce((s, r) => s + (r.duration_seconds || 0), 0) ?? 0);
    const todayCalories = Math.round(
      (diaryRes.data ?? []).reduce((s, r) => s + (r.calories ?? 0), 0),
    );

    // PFT overdue flag (loaded lazily, doesn't block headline stats)
    let pftOverdue = false;
    try {
      const { loadFitnessTestSummaries, hasOverdueTest } = await import(
        "@/lib/fitness/tests"
      );
      const summaries = await loadFitnessTestSummaries(user.id);
      pftOverdue = hasOverdueTest(summaries);
    } catch {
      /* non-fatal */
    }

    setStats({
      workouts: wcResult.count ?? 0,
      distance: totalDist,
      xp: rankResult.data?.total_xp ?? 0,
      hours: Math.floor(totalSecs / 3600),
      mins: Math.floor((totalSecs % 3600) / 60),
      latestWeightKg: weightRes.data?.weight_kg ?? null,
      todayCalories,
      calorieTarget: profileRes.data?.calorie_target ?? 2000,
      pftOverdue,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: load });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
        <div className="skeleton h-64" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    );
  }

  // Pre-computed headline text for each section card
  const bodyHeadline = stats?.latestWeightKg
    ? `${stats.latestWeightKg} kg · latest weight`
    : "No weight logged";
  const fuelHeadline = stats
    ? `${stats.todayCalories.toLocaleString()} / ${stats.calorieTarget.toLocaleString()} cal today`
    : "";
  const performanceHeadline = stats
    ? `${stats.workouts} workouts · ${formatDistance(stats.distance)} km run`
    : "";

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Intelligence Report
      </h2>

      {/* ---- Top-line stats grid ---- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Total Workouts
          </p>
          <p className="text-2xl font-bold font-mono text-text-primary tabular-nums">
            {stats?.workouts ?? 0}
          </p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Total Distance
          </p>
          <p className="text-2xl font-bold font-mono text-text-primary tabular-nums">
            {formatDistance(stats?.distance ?? 0)} km
          </p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Total XP
          </p>
          <p className="text-2xl font-bold font-mono text-xp-gold tabular-nums">
            {(stats?.xp ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Time Trained
          </p>
          <p className="text-2xl font-bold font-mono text-text-primary tabular-nums">
            {stats?.hours ?? 0}h {stats?.mins ?? 0}m
          </p>
        </div>
      </div>

      {/* ---- Workout history calendar ---- */}
      <WorkoutCalendar month={new Date()} workouts={calendarWorkouts} />

      {/* ---- Three section hubs ---- */}
      <SectionCard
        href="/intel/body"
        icon={Activity}
        title="Body"
        headline={bodyHeadline}
        description="Weight, measurements, progress photos"
      />
      <SectionCard
        href="/intel/fuel"
        icon={Utensils}
        title="Fuel"
        headline={fuelHeadline}
        description="Calories, macros, water, nutrition trends"
      />
      <SectionCard
        href="/intel/performance"
        icon={TrendingUp}
        title="Performance"
        headline={performanceHeadline}
        description="Runs, volume, PFT benchmarks, personal records"
        badge={stats?.pftOverdue ? "PFT DUE" : null}
      />

      {/* ---- MORE block: everything that didn't fit a section ---- */}
      <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary pt-2">
        More
      </h3>
      <div className="space-y-2">
        <MoreRow
          href="/intel/challenges"
          icon={Target}
          title="Challenge Events"
          description="Multi-day missions"
        />
        <MoreRow
          href="/intel/xp-log"
          icon={ListChecks}
          title="XP Audit Log"
          description="Every point earned, with source"
        />
        <MoreRow
          href="/intel/report"
          icon={FileText}
          title="Weekly Debrief"
          description="Last week's performance summary"
        />
        <MoreRow
          href="/intel/settings"
          icon={Settings}
          title="Base Operations"
          description="Settings, preferences, account"
        />
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

interface SectionCardProps {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  headline: string;
  description: string;
  badge?: string | null;
}

function SectionCard({
  href,
  icon: Icon,
  title,
  headline,
  description,
  badge,
}: SectionCardProps) {
  return (
    <Link href={href}>
      <Card className="press-scale hover:bg-bg-panel-alt transition-colors">
        <div className="flex items-center gap-3">
          <div className="min-w-[44px] min-h-[44px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-green-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-heading uppercase tracking-wider text-sand">
                {title}
              </h3>
              {badge && (
                <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.1em] px-2 py-[2px] border border-danger text-danger">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mt-0.5">
              {headline}
            </p>
            <p className="text-[0.65rem] text-text-secondary mt-1">
              {description}
            </p>
          </div>
          <ChevronRight
            size={18}
            className="text-text-secondary flex-shrink-0"
          />
        </div>
      </Card>
    </Link>
  );
}

function MoreRow({
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
          <ChevronRight
            size={14}
            className="text-text-secondary flex-shrink-0"
          />
        </div>
      </Card>
    </Link>
  );
}
