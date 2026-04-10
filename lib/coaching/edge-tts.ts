/* ============================================
   BARRAX — Microsoft Edge TTS wrapper
   Free server-side neural text-to-speech using
   Microsoft's "Read Aloud" WebSocket endpoint.
   No API key, MIT-licensed (`msedge-tts` package).

   SERVER-ONLY. This module imports `msedge-tts`
   which depends on Node `stream`/`ws`/`buffer` and
   will blow up if imported from the browser.
   ============================================ */

import "server-only";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Voice registry. Shortnames are passed directly to Edge TTS.
 * Sourced from Microsoft Azure Neural Voices catalogue.
 * Full list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
 *
 * Deliberately kept small — these are the handful that fit the BARRAX
 * military drill-instructor persona. Add more via the settings UI later.
 */
export const VOICES = {
  "en-GB-RyanNeural": {
    shortname: "en-GB-RyanNeural",
    label: "Ryan (UK Commander)",
    description: "Deep, authoritative British baritone. BARRAX default.",
    locale: "en-GB",
    gender: "Male",
  },
  "en-US-DavisNeural": {
    shortname: "en-US-DavisNeural",
    label: "Davis (US Drill Instructor)",
    description: "Grounded, controlled US baritone. Supports shouting SSML.",
    locale: "en-US",
    gender: "Male",
  },
  "en-US-GuyNeural": {
    shortname: "en-US-GuyNeural",
    label: "Guy (US Briefing Officer)",
    description: "Clear, confident US baritone. Newsreader polish.",
    locale: "en-US",
    gender: "Male",
  },
  "en-AU-WilliamNeural": {
    shortname: "en-AU-WilliamNeural",
    label: "William (Aussie SAS)",
    description: "Deep Australian voice. Novelty drill instructor.",
    locale: "en-AU",
    gender: "Male",
  },
} as const;

export type VoiceId = keyof typeof VOICES;

export const DEFAULT_VOICE: VoiceId = "en-GB-RyanNeural";

export function isVoiceId(v: string): v is VoiceId {
  return v in VOICES;
}

/**
 * Synthesise a single cue to an MP3 Buffer.
 *
 * Uses 24kHz 48kbps mono MP3 (~15 KB per 2s utterance).
 * The WebSocket session is opened, used, and closed per call — this is
 * less efficient than pooling, but keeps the surface small and avoids
 * leaking connections if a batch fails mid-flight.
 *
 * Called in parallel from the API route with concurrency=6.
 * Typical latency: 400–900ms per short utterance.
 */
export async function synthesizeCue(
  text: string,
  voice: VoiceId = DEFAULT_VOICE,
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);

    // Collect the audio stream into a Buffer.
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } finally {
    // Always close the WebSocket connection.
    try {
      tts.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Run an async function for each item in `items` with bounded concurrency.
 * Stops short-circuits on failure: each rejection is caught and turned
 * into a `{ ok: false, error }` result so the caller can decide policy.
 */
export async function parallelMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<{ ok: true; value: R } | { ok: false; error: unknown; item: T }>> {
  const results: Array<
    { ok: true; value: R } | { ok: false; error: unknown; item: T }
  > = new Array(items.length);

  let nextIndex = 0;
  const runWorker = async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      try {
        const value = await fn(items[i], i);
        results[i] = { ok: true, value };
      } catch (error) {
        results[i] = { ok: false, error, item: items[i] };
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runWorker);
  await Promise.all(workers);
  return results;
}
