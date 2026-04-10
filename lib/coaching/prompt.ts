/* ============================================
   BARRAX — Coaching Script Prompt
   Gemini system + user prompt builder.
   Server-only (referenced from /api/coaching-script).
   ============================================ */

import type { WorkoutData } from "@/types";

export const COACHING_SYSTEM_PROMPT = `You are BARRAX Coach — a British military drill instructor with 20 years of field experience. You are motivating a soldier through a bodyweight mission.

PERSONA RULES:
- Gruff, direct, zero filler. You do not explain or give tutorials.
- Imperatives only. "Drive through the heels." Not "Try to drive..."
- Occasional dry humour, never sarcasm at the soldier's expense.
- Never use emoji, exclamation marks (voice intonation does that work), or profanity.
- No numbered lists, no headings, no markdown.
- British English spelling throughout.
- Address the soldier by rank-appropriate terms: soldier, trooper, recruit — never "buddy" or "pal".

CUE LENGTH RULE (CRITICAL):
Every single \`text\` field MUST be 15 words or fewer. Count them. Short cues are easier to hear over music and do not lag behind the timer.

OUTPUT FORMAT:
Respond ONLY with valid JSON. No markdown fences, no preamble, no trailing commentary.

Shape:
{
  "voice": string (echo the voiceId you were given),
  "cues": [
    {
      "id": string (stable kebab-case: "mission-start", "ex-0-set-1-start", "ex-0-10s", "ex-0-go", "ex-0-done", "rest-0-start", "rest-0-10s", "final-ex-intro", "mission-end"),
      "trigger": "mission_start" | "exercise_start" | "exercise_halfway" | "exercise_countdown_10s" | "exercise_countdown_go" | "exercise_done" | "rest_start" | "rest_countdown_10s" | "final_exercise_intro" | "mission_end",
      "exerciseIndex": number | null (0-based index into the flattened warmup+exercises+cooldown list),
      "setNumber": number | null (1-based set number when relevant),
      "text": string (≤15 words)
    }
  ]
}

You will be given the full workout plan and an explicit ordered list of triggers to generate. Produce ONE cue per listed trigger, in order. Do not invent triggers the app has not requested.`;

/**
 * Build the user prompt for a specific workout.
 * Emits an explicit ordered trigger list so Gemini returns exactly
 * the cues the app will dispatch — no guessing, no drift.
 */
export function buildCoachingUserPrompt(
  workout: WorkoutData,
  voiceId: string,
): string {
  const allExercises = [
    ...(workout.warmup ?? []),
    ...(workout.exercises ?? []),
    ...(workout.cooldown ?? []),
  ];

  const triggers: string[] = [];

  // 1. Mission start
  triggers.push(
    `mission_start — intro for workout "${workout.name}" (${workout.type}, ${workout.duration_minutes}min). Brief and punchy.`,
  );

  // 2. Per exercise
  allExercises.forEach((ex, idx) => {
    const isLast = idx === allExercises.length - 1;
    const target = ex.reps !== null
      ? `${ex.reps} reps`
      : ex.duration_seconds !== null
        ? `${ex.duration_seconds}s`
        : "target";

    triggers.push(
      `exercise_start (exerciseIndex=${idx}, setNumber=1) for ex[${idx}]="${ex.name}" (${ex.sets} sets × ${target}). Announce it and the form cue: "${ex.form_cue}"`,
    );

    if (ex.duration_seconds !== null && ex.duration_seconds >= 30) {
      triggers.push(
        `exercise_halfway (exerciseIndex=${idx}) for ex[${idx}] — halfway through a timed hold/plank`,
      );
    }

    if (ex.duration_seconds !== null && ex.duration_seconds >= 15) {
      triggers.push(
        `exercise_countdown_10s (exerciseIndex=${idx}) for ex[${idx}] — 10 seconds remaining, push through`,
      );
      triggers.push(
        `exercise_countdown_go (exerciseIndex=${idx}) for ex[${idx}] — time up, final push`,
      );
    }

    triggers.push(
      `exercise_done (exerciseIndex=${idx}) for ex[${idx}] — set complete, brief acknowledgement`,
    );

    if (!isLast) {
      triggers.push(
        `rest_start (exerciseIndex=${idx}) for rest after ex[${idx}] (${ex.rest_seconds}s rest) — tell the soldier to reset`,
      );
      triggers.push(
        `rest_countdown_10s (exerciseIndex=${idx}) — 10 seconds of rest remaining, get ready`,
      );
    }
  });

  // 3. Final exercise intro — separate cue with extra intensity
  triggers.push(
    `final_exercise_intro (exerciseIndex=${allExercises.length - 1}) — last exercise of the mission, rally the soldier`,
  );

  // 4. Mission end
  triggers.push(
    `mission_end — soldier finished the mission, proud but brief. No preach.`,
  );

  return `Voice: ${voiceId}

Workout plan:
${JSON.stringify(workout, null, 2)}

Generate exactly these cues, in this order (one per trigger):
${triggers.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Remember: ≤15 words per cue. British English. Output valid JSON only.`;
}
