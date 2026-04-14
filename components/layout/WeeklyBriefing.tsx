/* ============================================
   Weekly Briefing
   Forward-looking counterpart to WeeklySummary. Fires on
   Sunday at 18:00 or later (once per week) and shows:

   - Next 7 days of scheduled workouts
   - Active classified op + current progress
   - Last 7 days XP earned + rank position
   - Avg calories vs target over last 7 days

   Rendered as a full-screen overlay and also fires a local
   notification so the user sees it even if the tab is backgrounded.
   Localstorage key 'barrax_last_briefing_week' dedupes to once per week.
   ============================================ */

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyWeeklyBriefing, getPermissionStatus } from "@/lib/notifications";
import Tag from "@/components/ui/Tag";
import { X, Calendar, Shield, TrendingUp, Utensils } from "lucide-react";
import { formatDateFull, formatDayShort } from "@/lib/format/date";

// ---------- Config ----------
const BRIEFING_DAY = 0;            // Sunday (0 = Sunday in JS)
const BRIEFING_HOUR = 18;          // 18:00
const LAST_KEY = "barrax_last_briefing_week";
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

// ---------- Types ----------
interface UpcomingWorkout {
  id: string;
  scheduled_date: string;
  workout_data: {
    name?: string;
    duration_minutes?: number;
    xp_value?: number;
  };
}

interface BriefingData {
  workouts: UpcomingWorkout[];
  op: {
    codename: string;
    current_value: number;
    target_value: number;
    unit: string;
  } | null;
  weekXP: number;
  totalXP: number;
  avgCalories: number;
  calorieTarget: number;
}

// ---------- Helpers ----------
function getWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getFullYear()}-W${weekNum}`;
}

function shouldShow(): boolean {
  const now = new Date();
  if (now.getDay() !== BRIEFING_DAY) return false;
  if (now.getHours() < BRIEFING_HOUR) return false;
  return localStorage.getItem(LAST_KEY) !== getWeekKey(now);
}

function localDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function prettyDayLabel(iso: string): string {
  return formatDayShort(new Date(iso));
}

// ---------- Data load ----------
async function loadBriefing(): Promise<BriefingData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-01`;

  // Next 7 days: tomorrow (inclusive) to tomorrow + 6
  const tomorrow = localDateISO(1);
  const weekEnd = localDateISO(7);

  const [
    workoutsRes,
    opRes,
    rankRes,
    workoutXPRes,
    runXPRes,
    diaryRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, scheduled_date, workout_data")
      .eq("user_id", user.id)
      .gte("scheduled_date", tomorrow)
      .lte("scheduled_date", weekEnd)
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("classified_ops")
      .select("codename, current_value, target_value, unit")
      .eq("user_id", user.id)
      .eq("month_start", monthStartStr)
      .maybeSingle(),
    supabase
      .from("ranks")
      .select("total_xp")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("xp_earned")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .gte("completed_at", weekStart.toISOString()),
    supabase
      .from("runs")
      .select("xp_earned")
      .eq("user_id", user.id)
      .gte("completed_at", weekStart.toISOString()),
    supabase
      .from("food_diary")
      .select("calories, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", weekStart.toISOString()),
    supabase
      .from("profiles")
      .select("calorie_target")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const workouts = (workoutsRes.data ?? []) as UpcomingWorkout[];

  const weekXP =
    ((workoutXPRes.data ?? []).reduce((s, r) => s + (r.xp_earned ?? 0), 0)) +
    ((runXPRes.data ?? []).reduce((s, r) => s + (r.xp_earned ?? 0), 0));

  // Average calories across distinct days in the window
  const byDay = new Map<string, number>();
  for (const row of diaryRes.data ?? []) {
    const day = (row.logged_at as string).slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + (row.calories ?? 0));
  }
  const avgCalories =
    byDay.size > 0
      ? Math.round([...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size)
      : 0;

  return {
    workouts,
    op: opRes.data
      ? {
          codename: opRes.data.codename as string,
          current_value: opRes.data.current_value as number,
          target_value: opRes.data.target_value as number,
          unit: opRes.data.unit as string,
        }
      : null,
    weekXP,
    totalXP: rankRes.data?.total_xp ?? 0,
    avgCalories,
    calorieTarget: profileRes.data?.calorie_target ?? 2000,
  };
}

// ---------- Component ----------
export default function WeeklyBriefing() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [open, setOpen] = useState(false);

  const fire = useCallback(async () => {
    const briefing = await loadBriefing();
    if (!briefing) return;
    setData(briefing);
    setOpen(true);
    localStorage.setItem(LAST_KEY, getWeekKey(new Date()));
    if (getPermissionStatus() === "granted") {
      notifyWeeklyBriefing(briefing.workouts.length);
    }
  }, []);

  useEffect(() => {
    if (shouldShow()) fire();
    const interval = setInterval(() => {
      if (shouldShow()) fire();
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fire]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !data) return null;

  const opPct = data.op
    ? Math.max(
        0,
        Math.min(100, Math.round((data.op.current_value / data.op.target_value) * 100)),
      )
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-briefing-title"
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm overflow-y-auto"
      onClick={() => setOpen(false)}
    >
      <div
        className="min-h-full px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 20px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-sand">
            CLASSIFIED — EYES ONLY
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss briefing"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-sand"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="weekly-briefing-title"
          className="font-heading text-3xl uppercase tracking-wider text-sand leading-tight"
        >
          Weekly Briefing
        </h2>
        <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mt-1">
          Week of {formatDateFull(new Date())}
        </p>

        {/* Section: scheduled workouts */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-green-light" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              Mission Schedule
            </h3>
          </div>
          {data.workouts.length === 0 ? (
            <p className="text-xs text-text-secondary font-mono uppercase tracking-wider">
              No workouts scheduled. Generate a programme from the ASSAULT tab.
            </p>
          ) : (
            <div className="space-y-2">
              {data.workouts.map((w) => (
                <div
                  key={w.id}
                  className="bg-bg-panel border border-green-dark p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                      {prettyDayLabel(w.scheduled_date)}
                    </p>
                    <p className="text-sm font-heading uppercase tracking-wider text-sand truncate">
                      {w.workout_data?.name ?? "Mission briefing pending"}
                    </p>
                  </div>
                  <Tag variant="gold">
                    {w.workout_data?.duration_minutes
                      ? `${w.workout_data.duration_minutes} MIN`
                      : "TBD"}
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: classified op progress */}
        {data.op && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-danger" />
              <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                Active Operation
              </h3>
            </div>
            <div className="bg-bg-panel border border-danger p-3">
              <p className="text-sm font-heading uppercase tracking-wider text-sand">
                {data.op.codename}
              </p>
              <div className="mt-2 h-2 bg-bg-input w-full overflow-hidden border border-green-dark">
                <div
                  className="h-full bg-danger transition-all duration-500"
                  style={{ width: `${opPct}%` }}
                />
              </div>
              <p className="text-[0.6rem] font-mono text-text-secondary mt-1 uppercase tracking-wider">
                {data.op.current_value} / {data.op.target_value} {data.op.unit} ({opPct}%)
              </p>
            </div>
          </div>
        )}

        {/* Section: performance */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-bg-panel border border-green-dark p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={12} className="text-xp-gold" />
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Last 7 Days</p>
            </div>
            <p className="text-xl font-bold font-mono text-xp-gold">
              +{data.weekXP.toLocaleString()} XP
            </p>
          </div>
          <div className="bg-bg-panel border border-green-dark p-3">
            <div className="flex items-center gap-1 mb-1">
              <Utensils size={12} className="text-green-light" />
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Avg Calories</p>
            </div>
            <p className="text-xl font-bold font-mono text-text-primary">
              {data.avgCalories || "—"}
            </p>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase mt-1">
              target {data.calorieTarget}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-3 border border-green-dark text-sand font-mono text-xs uppercase tracking-wider hover:bg-bg-panel-alt transition-colors"
          >
            [ STAND BY ]
          </button>
        </div>
      </div>
    </div>
  );
}
