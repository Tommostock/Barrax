/* ============================================
   Exercise Detail Sheet
   Slide-up panel that shows a full breakdown of
   an exercise: setup, execution, breathing,
   common mistakes, and pro tips.

   Used on:
   - Mission briefing page (tap an exercise card)
   - Workout player (tap the HOW TO button)
   ============================================ */

"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import { getExerciseInstructions } from "@/lib/exercise-instructions";
import type { WorkoutExercise } from "@/types";
import { Target, Play, Wind, AlertTriangle, Lightbulb } from "lucide-react";

interface ExerciseDetailSheetProps {
  exercise: WorkoutExercise | null;
  onClose: () => void;
}

export default function ExerciseDetailSheet({ exercise, onClose }: ExerciseDetailSheetProps) {
  if (!exercise) return null;

  const detailed = getExerciseInstructions(exercise.name);

  return (
    <BottomSheet isOpen={!!exercise} onClose={onClose} title={exercise.name}>
      <div className="space-y-5 text-text-primary">
        {/* Quick stats row */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2 py-1 border border-green-dark bg-bg-panel-alt text-text-primary">
            {exercise.sets} SET{exercise.sets > 1 ? "S" : ""}
          </span>
          <span className="px-2 py-1 border border-green-dark bg-bg-panel-alt text-text-primary">
            {exercise.reps ? `${exercise.reps} REPS` : `${exercise.duration_seconds}S`}
          </span>
          <span className="px-2 py-1 border border-green-dark bg-bg-panel-alt text-text-secondary">
            {exercise.rest_seconds}s rest
          </span>
        </div>

        {/* Muscle tags */}
        {exercise.muscles && exercise.muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscles.map((muscle) => (
              <span
                key={muscle}
                className="px-2 py-0.5 bg-green-primary/20 border border-green-primary/40 text-[0.65rem] font-mono text-green-light uppercase"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        {/* ─── DETAILED INSTRUCTIONS (if available) ─── */}
        {detailed ? (
          <>
            {/* Setup */}
            <Section icon={<Target size={14} />} title="SETUP">
              <ol className="space-y-2 list-decimal list-inside text-sm leading-relaxed marker:text-green-light marker:font-mono">
                {detailed.setup.map((step, i) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </Section>

            {/* Execution */}
            <Section icon={<Play size={14} />} title="EXECUTION">
              <ol className="space-y-2 list-decimal list-inside text-sm leading-relaxed marker:text-green-light marker:font-mono">
                {detailed.execution.map((step, i) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </Section>

            {/* Breathing */}
            <Section icon={<Wind size={14} />} title="BREATHING">
              <p className="text-sm leading-relaxed">{detailed.breathing}</p>
            </Section>

            {/* Common mistakes */}
            <Section icon={<AlertTriangle size={14} />} title="COMMON MISTAKES" danger>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                {detailed.commonMistakes.map((mistake, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-danger font-mono shrink-0">✗</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Tips */}
            <Section icon={<Lightbulb size={14} />} title="PRO TIPS">
              <ul className="space-y-1.5 text-sm leading-relaxed">
                {detailed.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-xp-gold font-mono shrink-0">★</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        ) : (
          /* Fallback: use the exercise's own AI-generated description
             and form cue when the static instruction library doesn't
             have a match for this exercise name. */
          <>
            <Section icon={<Target size={14} />} title="OVERVIEW">
              <p className="text-sm leading-relaxed">{exercise.description}</p>
            </Section>

            {exercise.form_cue && (
              <Section icon={<Lightbulb size={14} />} title="FORM CUE">
                <p className="text-sm leading-relaxed">{exercise.form_cue}</p>
              </Section>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

// ─── Helper section component ──────────────────────────
function Section({
  icon,
  title,
  children,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-2 mb-2 pb-1 border-b ${
          danger ? "border-danger/40" : "border-green-dark"
        }`}
      >
        <span className={danger ? "text-danger" : "text-green-light"}>{icon}</span>
        <h4
          className={`text-[0.7rem] font-heading uppercase tracking-wider ${
            danger ? "text-danger" : "text-sand"
          }`}
        >
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}
