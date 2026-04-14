/* ============================================
   WEEKLY REPORT CARD Page
   A military-styled briefing document showing
   the user's weekly performance summary:
     - Workouts completed
     - Total workout time
     - XP earned
     - Meals followed
     - Badges earned
     - Runs completed
     - Performance rating (S/A/B/C/D)
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  ArrowLeft,
  Swords,
  Clock,
  Zap,
  Trophy,
  MapPin,
  Utensils,
  Shield,
} from "lucide-react";

/* ------------------------------------------
   TYPES
   All the stats we pull together for the
   weekly report card.
   ------------------------------------------ */
interface WeeklyStats {
  workoutsCompleted: number;
  workoutsScheduled: number;
  totalWorkoutSeconds: number;
  xpEarned: number;
  mealsFollowed: number;
  badgesEarned: number;
  runsCompleted: number;
  totalRunDistance: number;
}

/* ------------------------------------------
   PERFORMANCE RATINGS
   S = 90%+, A = 75%+, B = 60%+, C = 40%+, D = <40%
   Each rating has a letter, colour, and label.
   ------------------------------------------ */
const RATINGS = [
  { min: 90, letter: "S", colour: "text-xp-gold", borderColour: "border-xp-gold", label: "OUTSTANDING" },
  { min: 75, letter: "A", colour: "text-green-light", borderColour: "border-green-light", label: "EXCELLENT" },
  { min: 60, letter: "B", colour: "text-green-primary", borderColour: "border-green-primary", label: "GOOD" },
  { min: 40, letter: "C", colour: "text-text-secondary", borderColour: "border-text-secondary", label: "NEEDS WORK" },
  { min: 0,  letter: "D", colour: "text-danger", borderColour: "border-danger", label: "POOR" },
] as const;

/* ==============================================
   MAIN COMPONENT
   ============================================== */
export default function WeeklyReportPage() {
  const router = useRouter();
  const supabase = createClient();

  // ---- State ----
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState("");

  /* ------------------------------------------
     HELPER: Get Monday and Sunday of this week
     Week runs Monday 00:00 to Sunday 23:59.
     ------------------------------------------ */
  function getWeekBounds(): { monday: string; sunday: string } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Calculate offset to get back to Monday
    // If today is Sunday (0), go back 6 days. Otherwise go back (dayOfWeek - 1) days.
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      monday: monday.toISOString(),
      sunday: sunday.toISOString(),
    };
  }

  /* ------------------------------------------
     FETCH DATA
     Pull all relevant stats from multiple
     Supabase tables for the current week.
     ------------------------------------------ */
  const loadReport = useCallback(async () => {
    setLoading(true);

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Get this week's date range
    const { monday, sunday } = getWeekBounds();

    // Format the week label for display (e.g. "31 MAR - 06 APR 2026")
    const monDate = new Date(monday);
    const sunDate = new Date(sunday);
    const formatOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    setWeekLabel(
      `${monDate.toLocaleDateString("en-GB", formatOpts).toUpperCase()} - ${sunDate.toLocaleDateString("en-GB", { ...formatOpts, year: "numeric" }).toUpperCase()}`
    );

    // 3. Fetch workouts completed this week
    const { data: completedWorkouts, count: completedCount } = await supabase
      .from("workouts")
      .select("duration_seconds, xp_earned", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "complete")
      .gte("scheduled_date", monday.split("T")[0])
      .lte("scheduled_date", sunday.split("T")[0]);

    // 4. Fetch total workouts scheduled this week (to calculate completion %)
    const { count: scheduledCount } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("scheduled_date", monday.split("T")[0])
      .lte("scheduled_date", sunday.split("T")[0]);

    // 5. Calculate total workout time and XP from workouts
    const totalWorkoutSeconds = completedWorkouts?.reduce(
      (sum, w) => sum + (w.duration_seconds || 0), 0
    ) ?? 0;

    const workoutXp = completedWorkouts?.reduce(
      (sum, w) => sum + (w.xp_earned || 0), 0
    ) ?? 0;

    // 6. Fetch runs completed this week (also earn XP)
    const { data: runs } = await supabase
      .from("runs")
      .select("distance_metres, xp_earned")
      .eq("user_id", user.id)
      .gte("started_at", monday)
      .lte("started_at", sunday);

    const runXp = runs?.reduce((sum, r) => sum + (r.xp_earned || 0), 0) ?? 0;
    const totalRunDistance = runs?.reduce(
      (sum, r) => sum + (r.distance_metres || 0), 0
    ) ?? 0;

    // 7. Fetch meals followed this week (from food_diary where source is meal_plan)
    const { count: mealsCount } = await supabase
      .from("food_diary")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("source", "meal_plan")
      .gte("logged_at", monday)
      .lte("logged_at", sunday);

    // 8. Fetch badges earned this week
    const { count: badgesCount } = await supabase
      .from("badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("earned_at", monday)
      .lte("earned_at", sunday);

    // 9. Build the stats object
    setStats({
      workoutsCompleted: completedCount ?? 0,
      workoutsScheduled: scheduledCount ?? 0,
      totalWorkoutSeconds,
      xpEarned: workoutXp + runXp,
      mealsFollowed: mealsCount ?? 0,
      badgesEarned: badgesCount ?? 0,
      runsCompleted: runs?.length ?? 0,
      totalRunDistance,
    });

    setLoading(false);
  }, [supabase]);

  // Fetch data on mount
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  /* ------------------------------------------
     CALCULATE PERFORMANCE RATING
     Based on completed / scheduled percentage.
     ------------------------------------------ */
  function getRating(completed: number, scheduled: number) {
    // Avoid division by zero — if nothing is scheduled, default to S
    if (scheduled === 0) return RATINGS[0];

    const percentage = (completed / scheduled) * 100;

    // Find the first rating where the percentage meets the minimum
    return RATINGS.find((r) => percentage >= r.min) ?? RATINGS[RATINGS.length - 1];
  }

  /* ------------------------------------------
     FORMAT DURATION
     Convert seconds to a "Xh Ym" string.
     ------------------------------------------ */
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /* ------------------------------------------
     FORMAT DISTANCE
     Convert metres to km with 1 decimal place.
     ------------------------------------------ */
  function formatDistance(metres: number): string {
    return (metres / 1000).toFixed(1);
  }

  /* ==============================================
     LOADING STATE
     ============================================== */
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-24 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20" />)}
        </div>
      </div>
    );
  }

  // Safety check — stats should be loaded by now
  if (!stats) return null;

  // Calculate the performance rating
  const rating = getRating(stats.workoutsCompleted, stats.workoutsScheduled);
  const completionPercent = stats.workoutsScheduled > 0
    ? Math.round((stats.workoutsCompleted / stats.workoutsScheduled) * 100)
    : 100;

  /* ==============================================
     RENDER
     ============================================== */
  return (
    <div className="px-4 py-4 space-y-6 pb-24">
      {/* ---- BACK BUTTON ---- */}
      <button
        onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      {/* ---- BRIEFING HEADER ---- */}
      <div>
        <Tag variant="active">WEEKLY BRIEFING</Tag>
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand mt-2">
          Performance Report
        </h2>
        <p className="text-[0.65rem] font-mono text-text-secondary mt-1">
          {weekLabel}
        </p>
      </div>

      {/* ---- PERFORMANCE RATING ---- */}
      <Card className="flex items-center gap-4">
        {/* Large rating letter in a bordered box */}
        <div className={`w-20 h-20 border-2 ${rating.borderColour} flex items-center justify-center shrink-0`}>
          <span className={`text-4xl font-heading font-bold ${rating.colour}`}>
            {rating.letter}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            {rating.label}
          </p>
          <p className="text-[0.65rem] font-mono text-text-secondary mt-1">
            Mission Completion: {completionPercent}%
          </p>
          {/* Visual progress bar for completion */}
          <ProgressBar
            value={stats.workoutsCompleted}
            max={Math.max(stats.workoutsScheduled, 1)}
            className="mt-2"
          />
        </div>
      </Card>

      {/* ---- STAT CARDS GRID ---- */}
      <div className="space-y-2">
        <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary">
          Operations Summary
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Workouts completed */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Swords size={16} className="text-green-primary" />
              <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                Missions
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary">
              {stats.workoutsCompleted}
              <span className="text-sm text-text-secondary">/{stats.workoutsScheduled}</span>
            </p>
          </Card>

          {/* Total workout time */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-green-primary" />
              <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                Time Active
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary">
              {formatDuration(stats.totalWorkoutSeconds)}
            </p>
          </Card>

          {/* XP earned */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-xp-gold" />
              <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                XP Earned
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-xp-gold">
              +{stats.xpEarned.toLocaleString()}
            </p>
          </Card>

          {/* Meals followed */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Utensils size={16} className="text-sand" />
              <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                Meals Logged
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary">
              {stats.mealsFollowed}
            </p>
          </Card>

          {/* Badges earned */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-xp-gold" />
              <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                Badges
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary">
              {stats.badgesEarned}
              <span className="text-sm text-text-secondary"> new</span>
            </p>
          </Card>
        </div>
      </div>

      {/* ---- RUNS SECTION ---- */}
      <div className="space-y-2">
        <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary">
          Recon Operations
        </h3>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bg-panel-alt border border-green-dark flex items-center justify-center">
                <MapPin size={18} className="text-green-primary" />
              </div>
              <div>
                <p className="text-sm font-heading uppercase tracking-wider text-sand">
                  Runs Completed
                </p>
                <p className="text-[0.6rem] font-mono text-text-secondary mt-1">
                  Total distance: {formatDistance(stats.totalRunDistance)} km
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-text-primary">
              {stats.runsCompleted}
            </p>
          </div>
        </Card>
      </div>

      {/* ---- REPORT FOOTER ---- */}
      <div className="border-t border-green-dark pt-4">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-green-dark" />
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Report generated {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
