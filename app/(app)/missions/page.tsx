/* ============================================
   MISSIONS Page
   Weekly workout programme view. Shows a 7-day
   calendar with workout details, and allows
   generating a new programme via AI.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Swords, Plus, Play, Check, Clock, Zap, MapPin, Loader2, Wrench } from "lucide-react";
import type { Workout } from "@/types";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ProgrammeDay {
  day: string;
  is_rest_day: boolean;
  workout: { type: string; focus: string; name: string } | null;
}

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [programme, setProgramme] = useState<{ id: string; programme_data: ProgrammeDay[] } | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgramme = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prog } = await supabase
      .from("workout_programmes")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    if (prog) {
      setProgramme(prog as { id: string; programme_data: ProgrammeDay[] });

      const { data: workoutData } = await supabase
        .from("workouts")
        .select("*")
        .eq("programme_id", prog.id)
        .order("scheduled_date", { ascending: true });

      if (workoutData) setWorkouts(workoutData as Workout[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProgramme(); }, [loadProgramme]);

  async function generateProgramme() {
    setGenerating(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: rank } = await supabase.from("ranks").select("current_rank").eq("user_id", user.id).single();

      // Seed exercises if not done
      await fetch("/api/seed-exercises", { method: "POST" });

      const response = await fetch("/api/generate-programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableMinutes: profile?.default_workout_minutes ?? 30,
          currentRank: rank?.current_rank ?? 1,
          fitnessLevel: profile?.fitness_level ?? "beginner",
          goals: profile?.goals ?? ["general fitness"],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate programme");
      }
      await loadProgramme();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  const todayIndex = new Date().getDay();
  const todayName = DAY_NAMES[todayIndex === 0 ? 6 : todayIndex - 1];

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="grid grid-cols-7 gap-1">{DAY_LABELS.map((d) => <div key={d} className="skeleton h-16" />)}</div>
        <SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Weekly Programme</h2>
        <Button onClick={generateProgramme} disabled={generating} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1"><Plus size={14} />{generating ? "GENERATING..." : "NEW"}</span>
        </Button>
      </div>

      {/* Week calendar */}
      {programme && (
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((dayName, i) => {
            const dayData = programme.programme_data?.find((d) => d.day === dayName);
            const workout = workouts.find((w) => {
              const wd = new Date(w.scheduled_date);
              return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === dayName;
            });
            const isToday = dayName === todayName;
            const isRest = dayData?.is_rest_day;
            const isComplete = workout?.status === "complete";

            return (
              <div key={dayName}
                className={`p-2 text-center border cursor-pointer transition-colors
                  ${isToday ? "border-green-primary bg-bg-panel-alt" : "border-green-dark bg-bg-panel"}
                  ${isComplete ? "border-green-light" : ""}`}
                onClick={() => workout && router.push(`/missions/${workout.id}`)}
              >
                <p className={`text-[0.55rem] font-mono ${isToday ? "text-green-light" : "text-text-secondary"}`}>{DAY_LABELS[i]}</p>
                <div className="w-6 h-6 mx-auto mt-1 flex items-center justify-center">
                  {isRest ? <span className="text-[0.5rem] font-mono text-text-secondary">REST</span>
                    : isComplete ? <Check size={14} className="text-green-light" />
                    : <Swords size={12} className={isToday ? "text-green-primary" : "text-text-secondary"} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading overlay when generating */}
      {generating && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-green-primary animate-spin mb-4" />
          <p className="text-sm font-heading uppercase tracking-wider text-sand">Generating Programme</p>
          <p className="text-xs text-text-secondary mt-1">AI is building your week...</p>
        </div>
      )}

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      {/* No programme state */}
      {!programme && !generating && (
        <Card tag="NO PROGRAMME" tagVariant="default">
          <div className="text-center py-6">
            <Swords size={32} className="text-text-secondary mx-auto mb-3" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">No Active Programme</h3>
            <p className="text-xs text-text-secondary mb-4">Generate a weekly workout programme tailored to your fitness level and goals.</p>
            <Button onClick={generateProgramme} disabled={generating}>
              <span className="flex items-center gap-2"><Plus size={16} />{generating ? "GENERATING..." : "GENERATE PROGRAMME"}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Workout list */}
      {programme && workouts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">This Week&apos;s Missions</h3>
          {workouts.map((workout) => {
            const wd = workout.workout_data as { name: string; type: string; duration_minutes: number; xp_value: number; focus?: string };
            const isComplete = workout.status === "complete";
            const isToday = workout.scheduled_date === new Date().toISOString().split("T")[0];

            return (
              <Card key={workout.id}
                tag={isComplete ? "COMPLETE" : isToday ? "TODAY" : "PENDING"}
                tagVariant={isComplete ? "complete" : isToday ? "active" : "default"}
                onClick={() => router.push(`/missions/${workout.id}`)}
                className="press-scale"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-heading uppercase tracking-wider text-sand">{wd.name}</h4>
                    <p className="text-xs text-text-secondary mt-1">{wd.type?.replace("_", " ")} {wd.focus ? `- ${wd.focus}` : ""}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary"><Clock size={12} /> {wd.duration_minutes} min</span>
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-xp-gold"><Zap size={12} /> +{wd.xp_value} XP</span>
                    </div>
                  </div>
                  {isComplete ? <Check size={20} className="text-green-light" /> : <Play size={20} className="text-green-primary" />}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Run tracker card */}
      <Card onClick={() => router.push("/missions/run")} className="press-scale">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
            <MapPin size={18} className="text-green-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-heading uppercase tracking-wider text-sand">Run Tracker</h4>
            <p className="text-xs text-text-secondary">GPS run tracking with live map</p>
          </div>
          <Play size={16} className="text-green-primary" />
        </div>
      </Card>

      {/* Custom workout builder card */}
      <Card onClick={() => router.push("/missions/builder")} className="press-scale">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
            <Wrench size={18} className="text-green-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-heading uppercase tracking-wider text-sand">Custom Workout</h4>
            <p className="text-xs text-text-secondary">Build your own from the exercise library</p>
          </div>
        </div>
      </Card>

      <div className="pt-1">
        <button onClick={() => router.push("/missions/library")}
          className="text-xs text-green-light font-mono uppercase tracking-wider hover:text-green-primary transition-colors">
          BROWSE EXERCISE LIBRARY →
        </button>
      </div>
    </div>
  );
}
