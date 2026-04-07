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
import { ArrowLeft, Play, Clock, Zap, Swords, Flame } from "lucide-react";
import { estimateCaloriesBurned } from "@/lib/calories";
import type { Workout, WorkoutData } from "@/types";

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="px-4 py-4 text-center">
        <p className="text-text-secondary">Workout not found.</p>
        <Button onClick={() => router.push("/missions")} className="mt-4">BACK TO MISSIONS</Button>
      </div>
    );
  }

  const wd = workout.workout_data as WorkoutData;
  const isComplete = workout.status === "complete";

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Back button */}
      <button onClick={() => router.push("/missions")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Back</span>
      </button>

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
            <span className="flex items-center gap-1 text-sm font-mono text-khaki">
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

      {/* Exercise list */}
      <div>
        <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">Exercises</h3>
        {wd.exercises?.map((ex, i) => (
          <Card key={i} className="mb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-heading uppercase tracking-wider text-sand">{ex.name}</p>
                <p className="text-xs text-text-secondary mt-1">{ex.form_cue}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[0.65rem] font-mono text-text-primary">
                    {ex.sets} sets x {ex.reps ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
                  </span>
                  <span className="text-[0.65rem] font-mono text-text-secondary">
                    {ex.rest_seconds}s rest
                  </span>
                </div>
              </div>
              <span className="text-[0.6rem] font-mono text-text-secondary">
                {ex.muscles?.join(", ")}
              </span>
            </div>
          </Card>
        ))}
      </div>

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

      {/* Deploy button */}
      {!isComplete && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-bg-primary/95 backdrop-blur-sm border-t border-green-dark safe-bottom">
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
