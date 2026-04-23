/* ============================================
   Workout Detail Page
   Shows the full workout details and allows
   launching the workout player.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import ExerciseDetailSheet from "@/components/workout/ExerciseDetailSheet";
import { Play, Clock, Zap, Swords, Flame, Info } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import { estimateCaloriesBurned } from "@/lib/calories";
import type { Workout, WorkoutData, WorkoutExercise } from "@/types";

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<WorkoutExercise | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .single();

      if (data) setWorkout(data as Workout);
      setLoading(false);
    }
    load();
  }, [workoutId, supabase]);

  if (loading) {
    return <div className="px-4 py-4 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full" />)}</div>;
  }

  if (!workout) {
    return (
      <div className="px-4 py-8 text-center">
        <Swords size={32} className="text-text-secondary mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Workout not found.</p>
        <p className="text-[0.6rem] text-text-secondary mt-1">This mission may have been removed or reassigned.</p>
        <Button onClick={() => router.push("/missions")} className="mt-4">BACK TO MISSIONS</Button>
      </div>
    );
  }

  const wd = workout.workout_data as WorkoutData;
  const isComplete = workout.status === "complete";

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <BackLink href="/missions" label="Missions" />

      {/* Mission briefing header */}
      <div className="bg-bg-panel border border-green-dark p-4">
        <div>
          <Tag variant={isComplete ? "complete" : "active"}>
            {isComplete ? "COMPLETE" : "MISSION BRIEFING"}
          </Tag>
          <h2 className="text-xl font-heading uppercase tracking-wider text-sand mt-2">{wd.name}</h2>
          <p className="text-xs text-text-secondary mt-1 capitalize">{wd.type?.replace("_", " ")}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-sm font-mono text-text-primary">
              <Clock size={14} /> {wd.duration_minutes} min
            </span>
            <span className="flex items-center gap-1 text-sm font-mono text-xp-gold">
              <Zap size={14} /> +{wd.xp_value} XP
            </span>
            <span className="flex items-center gap-1 text-sm font-mono text-sand">
              <Flame size={14} /> ~{estimateCaloriesBurned(wd.type, (wd.duration_minutes ?? 30) * 60)} kcal
            </span>
            <span className="flex items-center gap-1 text-sm font-mono text-text-secondary">
              <Swords size={14} /> {wd.exercises?.length ?? 0} exercises
            </span>
          </div>
        </div>
      </div>

      {/* Warmup section */}
      {wd.warmup && wd.warmup.length > 0 && (
        <div>
          <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">Warm-Up</h3>
          {wd.warmup.map((ex, i) => (
            <div key={i} className="bg-bg-panel border border-green-dark/50 p-3 mb-1">
              <p className="text-sm text-text-primary">{ex.name}</p>
              <p className="text-xs text-text-secondary">{ex.description} - {ex.duration_seconds}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Exercise list — tap any card to see the full breakdown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary">Exercises</h3>
          <span className="text-[0.55rem] font-mono text-text-secondary italic flex items-center gap-1">
            <Info size={10} /> TAP FOR HOW-TO
          </span>
        </div>
        {wd.exercises?.map((ex, i) => (
          <Card key={i} className="mb-2 press-scale" onClick={() => setActiveExercise(ex)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-heading uppercase tracking-wider text-sand">{ex.name}</p>
                  <Info size={12} className="text-green-light shrink-0" />
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ex.form_cue}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[0.65rem] font-mono text-text-primary">
                    {ex.sets} sets x {ex.reps ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
                  </span>
                  <span className="text-[0.65rem] font-mono text-text-secondary">
                    {ex.rest_seconds}s rest
                  </span>
                </div>
              </div>
              <span className="text-[0.6rem] font-mono text-text-secondary shrink-0 text-right">
                {ex.muscles?.slice(0, 2).join(", ")}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Exercise detail bottom sheet */}
      <ExerciseDetailSheet exercise={activeExercise} onClose={() => setActiveExercise(null)} />

      {/* Cooldown section */}
      {wd.cooldown && wd.cooldown.length > 0 && (
        <div>
          <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">Cool-Down</h3>
          {wd.cooldown.map((ex, i) => (
            <div key={i} className="bg-bg-panel border border-green-dark/50 p-3 mb-1">
              <p className="text-sm text-text-primary">{ex.name}</p>
              <p className="text-xs text-text-secondary">{ex.description} - {ex.duration_seconds}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Deploy button — sticky so it's always visible above the bottom nav.
          `above-bottom-nav` lifts it above the nav + the home-indicator safe
          area (critical on iPhone 17 where the nav extends ~34px higher than
          on older iPhones). `safe-bottom` kept for internal content breathing
          room below the button. */}
      {!isComplete && (
        <div className="sticky above-bottom-nav left-0 right-0 p-4 bg-bg-primary/95 backdrop-blur-sm border-t border-green-dark safe-bottom">
          <Button fullWidth onClick={() => router.push(`/missions/player/${workoutId}`)}>
            <span className="flex items-center justify-center gap-2">
              <Play size={18} /> DEPLOY
            </span>
          </Button>
        </div>
      )}

      {/* Completed stats */}
      {isComplete && workout.duration_seconds && (
        <Card tag="DEBRIEF" tagVariant="complete">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">
                {Math.floor(workout.duration_seconds / 60)}:{String(workout.duration_seconds % 60).padStart(2, "0")}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">DURATION</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-text-primary">{wd.exercises?.length ?? 0}</p>
              <p className="text-[0.55rem] font-mono text-text-secondary">EXERCISES</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-xp-gold">+{workout.xp_earned}</p>
              <p className="text-[0.55rem] font-mono text-text-secondary">XP EARNED</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
