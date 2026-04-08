/* ============================================
   Workout Audio Cues
   Generates beep sounds using the Web Audio API.
   No audio files needed — pure synthesized tones.
   ============================================ */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

// Play a short beep tone
// freq: pitch in Hz (higher = higher pitch)
// duration: length in seconds
function beep(freq: number, duration: number, volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = volume;

    // Quick fade out to avoid clicks
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported — silently fail
  }
}

// Countdown beep: short, lower pitch (plays at 3, 2, 1)
export function countdownBeep() {
  beep(600, 0.15, 0.25);
}

// Final countdown beep: longer, higher pitch (plays at 0 / complete)
export function completeBeep() {
  beep(900, 0.3, 0.35);
  // Double beep for emphasis
  setTimeout(() => beep(1100, 0.2, 0.3), 150);
}

// Exercise complete: ascending two-tone
export function exerciseCompleteSound() {
  beep(700, 0.15, 0.3);
  setTimeout(() => beep(1000, 0.2, 0.3), 180);
}

// Workout complete: triumphant ascending three-tone
export function workoutCompleteSound() {
  beep(600, 0.15, 0.3);
  setTimeout(() => beep(800, 0.15, 0.3), 200);
  setTimeout(() => beep(1100, 0.3, 0.35), 400);
}

// Rest over beep: two quick high beeps
export function restOverBeep() {
  beep(800, 0.1, 0.3);
  setTimeout(() => beep(800, 0.1, 0.3), 150);
}
