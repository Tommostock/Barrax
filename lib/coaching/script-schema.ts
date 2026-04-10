/* ============================================
   BARRAX — Coaching Script Schema
   Runtime validator + helpers for the Gemini
   cue script. Shared between server (API route)
   and client (cache / decoder).
   No Zod — hand-rolled to keep client bundle small.
   ============================================ */

import type { CoachingScript, CoachingCue, CueTrigger } from "@/types";

const ALLOWED_TRIGGERS: ReadonlySet<CueTrigger> = new Set<CueTrigger>([
  "mission_start",
  "exercise_start",
  "exercise_halfway",
  "exercise_countdown_10s",
  "exercise_countdown_go",
  "exercise_done",
  "rest_start",
  "rest_countdown_10s",
  "final_exercise_intro",
  "mission_end",
]);

export const MAX_CUE_WORDS = 15;

/**
 * Validate a raw Gemini response into a CoachingScript.
 * Returns null if the shape is invalid.
 * Trims any cue whose text exceeds MAX_CUE_WORDS to the first N words
 * (with a console warning) rather than rejecting — Gemini occasionally
 * overshoots the word limit, but the first 15 words are usually a
 * complete phrase.
 */
export function validateCoachingScript(raw: unknown): CoachingScript | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.voice !== "string" || r.voice.length === 0) return null;
  if (!Array.isArray(r.cues)) return null;

  const cues: CoachingCue[] = [];
  for (const item of r.cues) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as Record<string, unknown>;

    if (typeof c.id !== "string" || c.id.length === 0) continue;
    if (typeof c.trigger !== "string" || !ALLOWED_TRIGGERS.has(c.trigger as CueTrigger)) continue;
    if (typeof c.text !== "string" || c.text.trim().length === 0) continue;

    const exerciseIndex =
      typeof c.exerciseIndex === "number" ? c.exerciseIndex :
      c.exerciseIndex === null ? null :
      null;

    const setNumber =
      typeof c.setNumber === "number" ? c.setNumber :
      c.setNumber === null ? null :
      null;

    // Trim long cues instead of rejecting
    const text = trimToWordLimit(c.text, MAX_CUE_WORDS, c.id as string);

    cues.push({
      id: c.id,
      trigger: c.trigger as CueTrigger,
      exerciseIndex,
      setNumber,
      text,
      audioUrl: null, // filled in after Edge TTS + Storage upload
    });
  }

  if (cues.length === 0) return null;

  return {
    voice: r.voice,
    cues,
  };
}

/**
 * Trim `text` to the first `limit` whitespace-separated words.
 * Logs a warning if trimming occurs so we can spot Gemini drift.
 */
export function trimToWordLimit(text: string, limit: number, cueId: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();
  const trimmed = words.slice(0, limit).join(" ");
  console.warn(
    `[coaching] cue "${cueId}" exceeded word limit: ${words.length} > ${limit}. Trimmed.`,
  );
  return trimmed;
}

/**
 * Find the cue matching a (trigger, exerciseIndex, setNumber) lookup.
 * `exerciseIndex` and `setNumber` allow null matches for global cues.
 */
export function findCue(
  script: CoachingScript,
  trigger: CueTrigger,
  exerciseIndex: number | null = null,
  setNumber: number | null = null,
): CoachingCue | null {
  // First pass: exact match on all three
  let match = script.cues.find(
    (c) =>
      c.trigger === trigger &&
      c.exerciseIndex === exerciseIndex &&
      c.setNumber === setNumber,
  );
  if (match) return match;

  // Second pass: exact trigger + exerciseIndex (ignore setNumber)
  if (exerciseIndex !== null) {
    match = script.cues.find(
      (c) => c.trigger === trigger && c.exerciseIndex === exerciseIndex,
    );
    if (match) return match;
  }

  // Third pass: trigger only (e.g. mission_start, mission_end)
  match = script.cues.find((c) => c.trigger === trigger);
  return match ?? null;
}
