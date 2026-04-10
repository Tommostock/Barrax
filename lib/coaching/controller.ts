/* ============================================
   BARRAX — CoachingAudioController

   The core of the AI Audio Coach feature. Owns:
   - the iOS-silent-mode-bypass silent loop
     (HTMLAudioElement playing a silent WAV)
   - the shared AudioContext + GainNode graph
   - the manifest (loaded via loadManifest)
   - the decoded AudioBuffer map
   - the currently-playing cue source
   - mute state
   - subtitle listeners
   - interruption recovery (phone call, Siri, etc.)

   CLIENT-ONLY. Instantiate from the workout player
   via the useCoachingAudio hook. Call init() inside
   the DEPLOY button handler — it MUST run synchronously
   in a user-gesture event for iOS Safari to route audio
   through the media channel.

   The silent-loop trick is based on:
   - https://github.com/swevans/unmute
   - https://github.com/feross/unmute-ios-audio
   - https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
   ============================================ */

import type {
  CoachingScript,
  CoachingCue,
  CueTrigger,
  CoachingState,
} from "@/types";
import { findCue } from "./script-schema";
import { getCachedBlob, putCachedBlob } from "./cache";

const SILENT_LOOP_SRC = "/audio/silent-loop.wav";

type StateListener = (state: CoachingState) => void;
type SubtitleListener = (cue: CoachingCue | null) => void;

export class CoachingAudioController {
  private ctx: AudioContext | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private gain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private currentSource: AudioBufferSourceNode | null = null;
  private manifest: CoachingScript | null = null;
  private workoutId: string | null = null;

  private _state: CoachingState = "idle";
  private _muted = false;

  private stateListeners = new Set<StateListener>();
  private subtitleListeners = new Set<SubtitleListener>();

  get state(): CoachingState {
    return this._state;
  }

  get muted(): boolean {
    return this._muted;
  }

  /**
   * Initialise audio. **Must be called synchronously inside a user-gesture
   * event handler** (e.g. onClick) on iOS Safari. Creates the silent loop,
   * the AudioContext, and the audio graph.
   */
  init(workoutId: string): boolean {
    if (this._state !== "idle" && this._state !== "lost" && this._state !== "error") {
      // Already initialised — resume() handles the "lost" case, not init()
      return true;
    }
    try {
      this.workoutId = workoutId;

      // --- Silent loop (HTMLAudioElement) ---
      // This MUST be an <audio> element, not a decoded AudioBuffer. The hack
      // only works because HTMLAudioElement routes to the media channel on
      // iOS when started inside a user gesture.
      const silent = new Audio(SILENT_LOOP_SRC);
      silent.loop = true;
      silent.preload = "auto";
      silent.setAttribute("playsinline", "");
      silent.setAttribute("webkit-playsinline", "");
      // NOT 0 and NOT muted — either defeats the hack.
      silent.volume = 0.001;

      // Start it inside the gesture. We deliberately ignore the Promise
      // here — failures fire the `pause` event which sets state=lost.
      silent.play().catch((err) => {
        console.warn("[coach] silent loop play() rejected:", err);
        this.setState("lost");
      });

      this.silentAudio = silent;

      // --- Shared AudioContext ---
      const Ctor =
        typeof window !== "undefined" && window.AudioContext
          ? window.AudioContext
          : (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;

      const ctx = new Ctor({ latencyHint: "playback" });
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
          /* retry handled in resume() */
        });
      }
      this.ctx = ctx;

      // --- Graph: source -> gain -> destination ---
      const gain = ctx.createGain();
      gain.gain.value = this._muted ? 0 : 1;
      gain.connect(ctx.destination);
      this.gain = gain;

      // --- Interruption listeners ---
      silent.addEventListener("pause", this.handleSilentPause);
      silent.addEventListener("ended", this.handleSilentEnded);
      ctx.addEventListener("statechange", this.handleCtxStateChange);
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", this.handleVisibility);
      }

      this.setState("initialised");
      return true;
    } catch (err) {
      console.error("[coach] init failed:", err);
      this.setState("error");
      return false;
    }
  }

  /** Load a manifest and decode every MP3 into an AudioBuffer. */
  async loadManifest(manifest: CoachingScript): Promise<void> {
    if (!this.ctx || !this.workoutId) {
      throw new Error("[coach] loadManifest called before init()");
    }
    this.manifest = manifest;
    this.setState("loading");

    const workoutId = this.workoutId;
    const ctx = this.ctx;

    // Decode cues in parallel; cache blobs into IndexedDB.
    await Promise.all(
      manifest.cues.map(async (cue) => {
        if (!cue.audioUrl) return; // subtitle-only cue
        try {
          let arrayBuffer: ArrayBuffer | null = null;

          // 1. IndexedDB cache first
          const cached = await getCachedBlob(workoutId, cue.id);
          if (cached) {
            arrayBuffer = await cached.arrayBuffer();
          } else {
            // 2. Fetch from Supabase Storage signed URL
            const resp = await fetch(cue.audioUrl);
            if (!resp.ok) throw new Error(`fetch ${resp.status}`);
            const blob = await resp.blob();
            arrayBuffer = await blob.arrayBuffer();
            // Fire-and-forget cache write
            void putCachedBlob(workoutId, cue.id, blob);
          }

          // decodeAudioData detaches the ArrayBuffer, so slice() first
          const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
          this.buffers.set(cue.id, decoded);
        } catch (err) {
          console.warn(`[coach] decode failed for cue ${cue.id}:`, err);
          // Leave it out of the buffer map — subtitle-only fallback
        }
      }),
    );

    // If every cue failed to decode we're in error territory — but the
    // subtitle strip still works, so stay in 'ready' for a degraded UX.
    this.setState(this._state === "lost" ? "lost" : "ready");
  }

  /**
   * Fire a cue by trigger/exercise/set. Looks up the best match in the
   * manifest and plays its buffer. Also emits a subtitle event so the
   * on-screen strip can render the text.
   */
  dispatch(
    trigger: CueTrigger,
    exerciseIndex: number | null = null,
    setNumber: number | null = null,
  ): void {
    if (!this.manifest || !this.ctx) return;
    const cue = findCue(this.manifest, trigger, exerciseIndex, setNumber);
    if (!cue) return;

    // Emit subtitle regardless of audio status
    this.subtitleListeners.forEach((fn) => {
      try {
        fn(cue);
      } catch {
        /* ignore listener errors */
      }
    });

    const buf = this.buffers.get(cue.id);
    if (!buf) return; // subtitle-only for this one

    // Interrupt the previous cue if still playing
    if (this.currentSource) {
      try {
        this.currentSource.stop(0);
      } catch {
        /* already stopped */
      }
      this.currentSource = null;
    }

    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.gain!);
      src.start(0);
      this.currentSource = src;
      src.onended = () => {
        if (this.currentSource === src) this.currentSource = null;
      };
    } catch (err) {
      console.warn("[coach] dispatch play failed:", err);
    }
  }

  /** Mute/unmute the coach. Silent loop keeps running. */
  setMute(muted: boolean): void {
    this._muted = muted;
    if (this.gain) {
      this.gain.gain.value = muted ? 0 : 1;
    }
  }

  /**
   * Recover from a "lost" state after a phone call / Siri / backgrounding.
   * **Must be called inside a user gesture** because Safari requires
   * re-unlocking the audio session. Typically wired to the "TAP TO RESUME
   * COACH" banner.
   */
  async resume(): Promise<void> {
    if (!this.silentAudio || !this.ctx) return;
    try {
      await this.silentAudio.play();
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      this.setState(this.manifest ? "ready" : "initialised");
    } catch (err) {
      console.error("[coach] resume failed:", err);
      this.setState("lost");
    }
  }

  /** Stop + release all resources. Called on player unmount. */
  destroy(): void {
    try {
      this.currentSource?.stop();
    } catch {
      /* noop */
    }
    this.currentSource = null;

    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch {
        /* noop */
      }
      this.silentAudio.removeEventListener("pause", this.handleSilentPause);
      this.silentAudio.removeEventListener("ended", this.handleSilentEnded);
      this.silentAudio.src = "";
      this.silentAudio = null;
    }

    if (this.ctx) {
      this.ctx.removeEventListener("statechange", this.handleCtxStateChange);
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }

    this.buffers.clear();
    this.manifest = null;
    this.setState("idle");
    this.stateListeners.clear();
    this.subtitleListeners.clear();
  }

  // --- Public accessors for consumers (hooks, player) ---

  getContext(): AudioContext | null {
    return this.ctx;
  }

  onStateChange(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  onSubtitle(fn: SubtitleListener): () => void {
    this.subtitleListeners.add(fn);
    return () => this.subtitleListeners.delete(fn);
  }

  // --- Private ---

  private setState(next: CoachingState): void {
    if (this._state === next) return;
    this._state = next;
    this.stateListeners.forEach((fn) => {
      try {
        fn(next);
      } catch {
        /* ignore */
      }
    });
  }

  private handleSilentPause = () => {
    // If the silent loop pauses without our say-so (phone call, Siri,
    // Bluetooth disconnect, OS audio session steal), we've lost the
    // iOS unlock and the user needs to tap to recover.
    if (this._state === "idle") return;
    this.setState("lost");
  };

  private handleSilentEnded = () => {
    // Shouldn't fire when loop=true, but if it does, try to restart.
    if (!this.silentAudio) return;
    this.silentAudio.play().catch(() => this.setState("lost"));
  };

  private handleCtxStateChange = () => {
    if (!this.ctx) return;
    // AudioContext state can go suspended (e.g. iOS audio session steal)
    // or closed (when we call destroy()). Only treat suspend as "lost".
    if (this.ctx.state === "suspended") {
      if (this._state !== "idle") {
        this.setState("lost");
      }
    }
  };

  private handleVisibility = () => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "visible") {
      // Best-effort silent recovery on return from background. If it
      // fails, state stays "lost" and the banner appears.
      if (this._state === "lost" && this.ctx && this.silentAudio) {
        this.silentAudio.play().catch(() => {});
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
      }
    }
  };
}
