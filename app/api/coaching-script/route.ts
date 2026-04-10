/* ============================================
   Coaching Script API Route
   POST /api/coaching-script

   Generates (or returns cached) a drill-sergeant
   audio coaching script for a specific workout.

   Flow:
   1. Auth user
   2. Load workout
   3. Compute workout_hash (sha256 of workout_data)
   4. Cache check against workout_coaching_scripts
      — if hit AND hash matches → re-sign URLs, return
   5. Otherwise: call Gemini → validate → parallel
      Edge TTS → upload MP3s to Supabase Storage
      → upsert row → return manifest

   Node runtime only — Edge TTS needs Node Buffer +
   WebSocket client. Vercel Hobby with Fluid Compute
   supports up to 300s; we set maxDuration = 60 as a
   belt-and-braces cap (expected: 4–6s).
   ============================================ */

import "server-only";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/gemini";
import {
  COACHING_SYSTEM_PROMPT,
  buildCoachingUserPrompt,
} from "@/lib/coaching/prompt";
import {
  validateCoachingScript,
} from "@/lib/coaching/script-schema";
import {
  synthesizeCue,
  parallelMap,
  isVoiceId,
  DEFAULT_VOICE,
  type VoiceId,
} from "@/lib/coaching/edge-tts";
import type {
  CoachingScript,
  CoachingCue,
  WorkoutData,
} from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const BUCKET = "coaching-audio";
const SIGNED_URL_TTL = 3600; // 1 hour
const TTS_CONCURRENCY = 6;

interface CoachingScriptRequest {
  workoutId: string;
  voice?: string;
  forceRegenerate?: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CoachingScriptRequest = await request.json();
    if (!body.workoutId) {
      return NextResponse.json({ error: "workoutId required" }, { status: 400 });
    }

    // Resolve voice, defaulting if invalid
    const voice: VoiceId =
      body.voice && isVoiceId(body.voice) ? body.voice : DEFAULT_VOICE;

    // 1. Load the workout row
    const { data: workoutRow, error: workoutError } = await supabase
      .from("workouts")
      .select("id, user_id, workout_data")
      .eq("id", body.workoutId)
      .eq("user_id", user.id)
      .single();

    if (workoutError || !workoutRow) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 },
      );
    }

    const workoutData = workoutRow.workout_data as WorkoutData;
    if (!workoutData || !Array.isArray(workoutData.exercises)) {
      return NextResponse.json(
        { error: "Workout has no exercises to coach" },
        { status: 400 },
      );
    }

    // 2. Compute hash of workout data for cache invalidation
    const workoutHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(workoutData))
      .digest("hex");

    // 3. Cache check — has this (workout, voice) been generated before?
    if (!body.forceRegenerate) {
      const { data: cached } = await supabase
        .from("workout_coaching_scripts")
        .select("manifest, workout_hash")
        .eq("workout_id", body.workoutId)
        .eq("voice", voice)
        .maybeSingle();

      if (cached && cached.workout_hash === workoutHash) {
        const manifest = cached.manifest as CoachingScript;
        // Signed URLs from previous generation may have expired — re-sign each
        const resigned = await resignManifestUrls(
          supabase,
          manifest,
          user.id,
          body.workoutId,
        );
        return NextResponse.json({ manifest: resigned, cached: true });
      }
    }

    // 4. Cache miss — call Gemini to generate the script text
    const userPrompt = buildCoachingUserPrompt(workoutData, voice);

    const raw = await callGemini<unknown>({
      systemPrompt: COACHING_SYSTEM_PROMPT,
      userPrompt,
    });

    const script = validateCoachingScript(raw);
    if (!script) {
      console.error("[coaching-script] Gemini returned invalid script:", raw);
      return NextResponse.json(
        { error: "AI returned an invalid script" },
        { status: 502 },
      );
    }
    // Echo-check: if Gemini ignored the voice, force it
    script.voice = voice;

    // 5. Parallel Edge TTS + Storage upload per cue
    const results = await parallelMap(script.cues, TTS_CONCURRENCY, async (cue) => {
      const mp3 = await synthesizeCue(cue.text, voice);

      const path = `${user.id}/${body.workoutId}/${cue.id}.mp3`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, mp3, {
          contentType: "audio/mpeg",
          upsert: true,
        });
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signError || !signed) {
        throw new Error(`Sign URL failed: ${signError?.message ?? "unknown"}`);
      }

      return signed.signedUrl;
    });

    // Attach URLs to cues; leave audioUrl=null for failed ones (subtitle-only)
    results.forEach((result, i) => {
      if (result.ok) {
        script.cues[i].audioUrl = result.value;
      } else {
        console.warn(
          `[coaching-script] TTS failed for cue ${script.cues[i].id}:`,
          result.error,
        );
        script.cues[i].audioUrl = null;
      }
    });

    const successCount = results.filter((r) => r.ok).length;
    if (successCount === 0) {
      // All failed — still return the manifest for subtitle-only mode
      console.error("[coaching-script] All Edge TTS calls failed");
    }

    // 6. Upsert the manifest row (store with the signed URLs; they'll be
    // re-signed on cache hit so storing them is fine)
    const { error: upsertError } = await supabase
      .from("workout_coaching_scripts")
      .upsert(
        {
          workout_id: body.workoutId,
          user_id: user.id,
          voice,
          workout_hash: workoutHash,
          manifest: script,
        },
        { onConflict: "workout_id,voice" },
      );

    if (upsertError) {
      console.warn("[coaching-script] upsert failed:", upsertError);
      // Non-fatal — return the manifest anyway
    }

    return NextResponse.json({ manifest: script, cached: false });
  } catch (error) {
    console.error("[coaching-script] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate script",
      },
      { status: 500 },
    );
  }
}

/**
 * Re-generate signed URLs for every cue in a cached manifest.
 * Supabase signed URLs expire after SIGNED_URL_TTL seconds, so a manifest
 * loaded from the DB will have stale URLs. We overwrite them in place.
 */
async function resignManifestUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  manifest: CoachingScript,
  userId: string,
  workoutId: string,
): Promise<CoachingScript> {
  const fresh: CoachingCue[] = await Promise.all(
    manifest.cues.map(async (cue) => {
      if (!cue.audioUrl) return cue;
      try {
        const path = `${userId}/${workoutId}/${cue.id}.mp3`;
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL);
        if (error || !data) {
          return { ...cue, audioUrl: null };
        }
        return { ...cue, audioUrl: data.signedUrl };
      } catch {
        return { ...cue, audioUrl: null };
      }
    }),
  );
  return { ...manifest, cues: fresh };
}
