/* ============================================
   TodayWorkoutCard
   Half-width HQ card showing today's scheduled
   workout. Paired with TodayCaloriesCard in a
   two-column grid on the HQ screen.

   Reads the workout from HQDataProvider so the
   card re-renders instantly on tab switches. Tap
   the card to open the workout player (or the
   debrief view if already complete).
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { Check, Clock, Zap } from "lucide-react";
import type { WorkoutData } from "@/types";
import { useHQData } from "@/components/providers/HQDataProvider";

export default function TodayWorkoutCard() {
  const router = useRouter();
  const { data, loading } = useHQData();

  if (loading && !data) return <div className="skeleton h-full w-full" />;

  const workout = data?.todayWorkout ?? null;
  const wd = (workout?.workout_data as WorkoutData | undefined) ?? null;
  const isComplete = workout?.status === "complete";

  // Short focus line with a couple of sensible fallbacks so the
  // second row of the card never looks empty.
  const focusLine =
    wd?.focus?.trim() ||
    (wd?.type ? wd.type.replace(/_/g, " ") : null) ||
    (wd ? "No focus set" : null);

  // Main exercise roster (excludes warmup + cooldown). Show up to 3
  // to fill the expanded card without overflowing.
  const mainExercises = wd?.exercises ?? [];
  const previewExercises = mainExercises.slice(0, 3);
  const extraCount = Math.max(0, mainExercises.length - previewExercises.length);

  function handleTap() {
    if (!workout) {
      router.push("/missions");
      return;
    }
    router.push(
      isComplete
        ? `/missions/${workout.id}`
        : `/missions/player/${workout.id}`,
    );
  }

  return (
    <Card
      tag={isComplete ? "COMPLETE" : "MISSION"}
      tagVariant={isComplete ? "complete" : "active"}
      onClick={handleTap}
      hudFrame
    >
      <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
        {/* Label (icon removed — was taking up valuable space) */}
        <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
          {isComplete ? "Workout · done" : "Workout · today"}
        </p>

        {/* Operation codename */}
        <p className="text-sm font-heading uppercase tracking-wider text-sand truncate w-full">
          {wd?.name ?? "No orders"}
        </p>

        {/* Focus line (2 lines max) */}
        {focusLine ? (
          <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider line-clamp-2 leading-snug w-full">
            {focusLine}
          </p>
        ) : (
          <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
            Tap to build
          </p>
        )}

        {/* Exercise roster — up to 3 main exercises, one per line */}
        {previewExercises.length > 0 && (
          <div className="w-full mt-1 space-y-0.5">
            {previewExercises.map((ex, i) => (
              <p
                key={`${ex.name}-${i}`}
                className="text-[0.6rem] font-mono text-text-primary truncate"
              >
                <span className="text-green-primary">›</span> {ex.name}
                {ex.sets && ex.reps ? (
                  <span className="text-text-secondary">
                    {" "}
                    · {ex.sets}×{ex.reps}
                  </span>
                ) : null}
              </p>
            ))}
            {extraCount > 0 && (
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                +{extraCount} more
              </p>
            )}
          </div>
        )}

        {/* Footer: duration + XP badge (gold) anchored to bottom */}
        {wd && (
          <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
            <span className="flex items-center gap-1 text-[0.6rem] font-mono text-text-secondary">
              <Clock size={10} />
              {wd.duration_minutes} min
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] font-mono text-text-secondary">
              {mainExercises.length} ex
            </span>
            {isComplete ? (
              <span className="flex items-center gap-1 text-[0.6rem] font-mono text-green-light uppercase tracking-wider">
                <Check size={10} /> done
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[0.6rem] font-mono text-xp-gold uppercase tracking-wider">
                <Zap size={10} /> +{wd.xp_value} XP
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
