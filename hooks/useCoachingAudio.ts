"use client";

/* ============================================
   BARRAX — useCoachingAudio
   React hook that wraps CoachingAudioController.
   Responsibilities:
   - Create a singleton controller per workoutId
   - Read user preferences from localStorage
     (enabled, muted, voice)
   - Fetch/load the manifest (cache first, then API)
   - Expose state, dispatch, mute, resume, subtitle
   - Clean up on unmount
   ============================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkoutData, CoachingCue, CoachingState } from "@/types";
import { CoachingAudioController } from "@/lib/coaching/controller";
import {
  getCachedScript,
  putCachedScript,
  hasAllBlobs,
  hashWorkoutData,
} from "@/lib/coaching/cache";

// LocalStorage keys — match settings page naming pattern
export const COACH_ENABLED_KEY = "barrax_coach_enabled";
export const COACH_MUTED_KEY = "barrax_coach_muted";
export const COACH_VOICE_KEY = "barrax_coach_voice";
export const COACH_SUBTITLES_KEY = "barrax_coach_subtitles";

export const DEFAULT_COACH_VOICE = "en-GB-RyanNeural";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "true";
}

function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

interface UseCoachingAudioOptions {
  workoutId: string | null;
  workoutData: WorkoutData | null;
}

export function useCoachingAudio({ workoutId, workoutData }: UseCoachingAudioOptions) {
  const controllerRef = useRef<CoachingAudioController | null>(null);
  const [state, setState] = useState<CoachingState>("idle");
  const [muted, setMutedState] = useState<boolean>(() =>
    readBool(COACH_MUTED_KEY, false),
  );
  const [enabled] = useState<boolean>(() => readBool(COACH_ENABLED_KEY, true));
  const [voice] = useState<string>(() =>
    readString(COACH_VOICE_KEY, DEFAULT_COACH_VOICE),
  );
  const [lastSubtitle, setLastSubtitle] = useState<CoachingCue | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);

  // Lazy controller creation — don't create if disabled
  const getController = useCallback((): CoachingAudioController | null => {
    if (!enabled) return null;
    if (!controllerRef.current) {
      controllerRef.current = new CoachingAudioController();
    }
    return controllerRef.current;
  }, [enabled]);

  // Wire listeners on mount of the controller
  useEffect(() => {
    if (!enabled) return;
    const ctrl = getController();
    if (!ctrl) return;

    const offState = ctrl.onStateChange((s) => setState(s));
    const offSub = ctrl.onSubtitle((c) => setLastSubtitle(c));

    return () => {
      offState();
      offSub();
    };
  }, [enabled, getController]);

  // Destroy on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  /**
   * Initialise audio — MUST be called from inside a user-gesture handler
   * (e.g. the DEPLOY button onClick). Returns true on success.
   * Synchronous: does NOT wait for manifest loading.
   */
  const initAudio = useCallback((): boolean => {
    if (!enabled || !workoutId) return false;
    const ctrl = getController();
    if (!ctrl) return false;
    return ctrl.init(workoutId);
  }, [enabled, workoutId, getController]);

  /**
   * Load the manifest (cache first, then API). Call this after initAudio.
   * Can be awaited outside the user gesture — no iOS constraint here.
   */
  const loadManifest = useCallback(async (): Promise<void> => {
    if (!enabled || !workoutId || !workoutData) return;
    const ctrl = getController();
    if (!ctrl) return;

    setManifestError(null);
    try {
      // Compute hash client-side to match server
      const workoutHash = await hashWorkoutData(workoutData);

      // 1. Try IndexedDB cache first
      const cached = await getCachedScript(workoutId);
      if (
        cached &&
        cached.workout_hash === workoutHash &&
        cached.voice === voice &&
        (await hasAllBlobs(workoutId, cached.manifest))
      ) {
        await ctrl.loadManifest(cached.manifest);
        return;
      }

      // 2. Cache miss — hit the API
      const resp = await fetch("/api/coaching-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId, voice }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API ${resp.status}: ${text}`);
      }

      const { manifest } = (await resp.json()) as { manifest: import("@/types").CoachingScript };
      if (!manifest) throw new Error("No manifest in response");

      // Persist to IndexedDB for next time
      await putCachedScript({
        workoutId,
        manifest,
        voice,
        workout_hash: workoutHash,
        created_at: Date.now(),
      });

      await ctrl.loadManifest(manifest);
    } catch (err) {
      console.error("[useCoachingAudio] loadManifest failed:", err);
      setManifestError(err instanceof Error ? err.message : String(err));
    }
  }, [enabled, workoutId, workoutData, voice, getController]);

  const dispatch = useCallback(
    (
      trigger: import("@/types").CueTrigger,
      exerciseIndex: number | null = null,
      setNumber: number | null = null,
    ) => {
      controllerRef.current?.dispatch(trigger, exerciseIndex, setNumber);
    },
    [],
  );

  const setMute = useCallback((m: boolean) => {
    controllerRef.current?.setMute(m);
    setMutedState(m);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COACH_MUTED_KEY, m ? "true" : "false");
    }
  }, []);

  const resume = useCallback(async () => {
    await controllerRef.current?.resume();
  }, []);

  const getContext = useCallback((): AudioContext | null => {
    return controllerRef.current?.getContext() ?? null;
  }, []);

  return {
    /** True if `barrax_coach_enabled` is set (user can disable feature entirely). */
    enabled,
    /** Runtime controller state: idle / initialised / loading / ready / lost / error. */
    state,
    /** True when manifest is loaded and cues can be dispatched. */
    ready: state === "ready",
    /** Current mute state. */
    muted,
    /** Most recent cue (for subtitle rendering). */
    lastSubtitle,
    /** Error message if manifest loading failed (UI shows "COACH OFFLINE"). */
    manifestError,
    /** Sync: initialises AudioContext + silent loop. Call inside DEPLOY gesture. */
    initAudio,
    /** Async: fetches manifest from cache/API, decodes buffers. */
    loadManifest,
    /** Fire a cue on the player's state transition. No-op if manifest not loaded. */
    dispatch,
    /** Toggle mute. Persists to localStorage. */
    setMute,
    /** Recover after interruption (phone call etc). Call inside a user tap. */
    resume,
    /** Share the AudioContext with workout-audio.ts so beeps and cues coexist. */
    getContext,
  };
}
