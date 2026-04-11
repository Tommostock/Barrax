/* ============================================
   RUN TRACKER Page
   GPS-based run tracking with three states:
   1. READY   — waiting to start, shows map preview
   2. RUNNING — live tracking with stats + route
   3. COMPLETE — post-run summary, XP award, DB save

   Uses the browser Geolocation API to record the
   runner's position, then calculates distance,
   pace, splits, and elevation gain.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  totalDistance,
  calculatePace,
  formatPace,
  formatDistance,
  formatDuration,
  calculateSplits,
  calculateElevationGain,
  bestPace,
} from "@/lib/geolocation";
import { getRunXP } from "@/lib/xp";
import { countdownBeep, completeBeep } from "@/lib/workout-audio";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  Play,
  Pause,
  Square,
  Lock,
  Unlock,
  MapPin,
  Clock,
  Zap,
  ArrowLeft,
} from "lucide-react";
import type { GpsPoint, RunSplit } from "@/types";

// ---------- Dynamic map import (Leaflet needs the browser window) ----------
const RunMap = nextDynamic(() => import("@/components/run/RunMap"), { ssr: false });

// ---------- Page states ----------
// "countdown" is the 5-second prep window after the user taps GO,
// before GPS tracking actually begins.
type RunState = "ready" | "countdown" | "running" | "complete";

/** Duration of the GO → GPS-watch-start prep countdown, in seconds. */
const RUN_PREP_COUNTDOWN_SECONDS = 5;

// ---------- Challenge-run presets ----------
// Pre-set benchmark distances with per-distance PR tracking.
// Selecting one on the ready screen auto-stops the run when the
// target is reached. Distances are in metres; FREE RUN has null.
interface RunChallenge {
  id: string;
  label: string;
  distanceM: number | null;
}

const RUN_CHALLENGES: RunChallenge[] = [
  { id: "free", label: "FREE RUN", distanceM: null },
  { id: "1mi", label: "1 MI", distanceM: 1609 },
  { id: "2p4km", label: "2.4 KM", distanceM: 2400 },
  { id: "1500m", label: "1.5 MI", distanceM: 2414 },
  { id: "5km", label: "5 KM", distanceM: 5000 },
  { id: "10km", label: "10 KM", distanceM: 10000 },
];

// ---------- Post-run stats computed once when stopping ----------
interface RunStats {
  distanceMetres: number;
  durationSeconds: number;
  avgPace: number;           // seconds per km
  bestPaceSplit: number;     // seconds per km
  elevationGain: number | null;
  splits: RunSplit[];
  xpEarned: number;
}

export default function RunTrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ===================== STATE =====================

  // Which screen the user sees (ready / countdown / running / complete)
  const [runState, setRunState] = useState<RunState>("ready");

  // Selected challenge (null = FREE RUN)
  const [selectedChallenge, setSelectedChallenge] = useState<RunChallenge>(
    RUN_CHALLENGES[0],
  );

  // Was this run started from the Physical Fitness Test hub?
  // If so, on complete we also write a fitness_test_results row.
  const pftSourceRef = useRef(false);

  // Prep-countdown seconds remaining. Only relevant when runState="countdown".
  // Set to 5 when the user taps GO and ticks down to 0, at which point the
  // real GPS watch + elapsed timer start.
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);

  // Array of every GPS reading during the run
  const [points, setPoints] = useState<GpsPoint[]>([]);

  // Elapsed time in seconds — updated every second by an interval
  const [elapsed, setElapsed] = useState(0);

  // Is the run paused? (GPS still tracking but timer stops)
  const [paused, setPaused] = useState(false);

  // Ref mirror of paused — the GPS watcher callback captures a stale
  // closure, so we read from this ref to always get the current value.
  const pausedRef = useRef(false);

  // Lock mode prevents accidental button taps
  const [locked, setLocked] = useState(false);

  // GPS error messages shown to the user
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Whether the browser supports geolocation at all
  const [gpsAvailable, setGpsAvailable] = useState(true);

  // Stats computed after the run finishes
  const [stats, setStats] = useState<RunStats | null>(null);

  // Saving state for the database write
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ===================== REFS =====================

  // Geolocation watch ID — needed to clear the watcher on stop
  const watchIdRef = useRef<number | null>(null);

  // Timer interval ID — needed to clear the timer on pause/stop
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timestamp when the run started (used for total duration)
  const startTimeRef = useRef<number>(0);

  // Total milliseconds spent paused (subtracted from elapsed)
  const pausedDurationRef = useRef<number>(0);

  // Timestamp when the user last hit "pause"
  const pauseStartRef = useRef<number>(0);

  // ===================== GPS AVAILABILITY CHECK =====================

  useEffect(() => {
    // Check once on mount whether the browser has geolocation
    if (!navigator.geolocation) {
      setGpsAvailable(false);
      setGpsError("Your browser does not support GPS.");
    }
  }, []);

  // ===================== URL CHALLENGE PRE-SELECTION =====================
  //
  // ?challenge=2414 selects the matching preset; ?source=pft sets the
  // flag so saveRun also writes a fitness_test_results row.
  useEffect(() => {
    const challengeParam = searchParams.get("challenge");
    const sourceParam = searchParams.get("source");

    if (challengeParam) {
      const distanceM = parseInt(challengeParam, 10);
      if (Number.isFinite(distanceM)) {
        const match = RUN_CHALLENGES.find((c) => c.distanceM === distanceM);
        if (match) setSelectedChallenge(match);
      }
    }

    if (sourceParam === "pft") {
      pftSourceRef.current = true;
    }
    // Only read on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================== TIMER LOGIC =====================

  // Starts a 1-second interval that updates the elapsed counter.
  // We calculate elapsed from wall-clock time minus paused time
  // so the display stays accurate even if the tab is backgrounded.
  const startTimer = useCallback(() => {
    // Clear any existing timer first
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const running = now - startTimeRef.current - pausedDurationRef.current;
      setElapsed(Math.floor(running / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ===================== GPS WATCHER =====================

  // Called every time the browser gets a new position fix.
  // Adds the point to state (only while not paused).
  // Uses pausedRef instead of the paused state directly because
  // watchPosition keeps a reference to the original callback —
  // reading from a ref ensures we always see the latest value.
  const handleGpsPosition = useCallback(
    (position: GeolocationPosition) => {
      // Clear any previous error — GPS is working again
      setGpsError(null);

      // Don't record points while paused (read from ref, not state)
      if (pausedRef.current) return;

      const newPoint: GpsPoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
      };

      setPoints((prev) => [...prev, newPoint]);
    },
    []
  );

  // Called when the GPS encounters an error (signal lost, denied, etc.)
  const handleGpsError = useCallback((error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setGpsError("Location permission denied. Please enable GPS.");
        break;
      case error.POSITION_UNAVAILABLE:
        setGpsError("GPS signal lost. Keep moving — tracking will resume.");
        break;
      case error.TIMEOUT:
        setGpsError("GPS signal lost. Keep moving — tracking will resume.");
        break;
      default:
        setGpsError("GPS error. Tracking will resume when signal returns.");
    }
  }, []);

  // ===================== START RUN =====================

  /** User tapped GO on the ready screen. Enter the 5-second prep
      countdown — the GPS watch and elapsed clock don't start until
      the countdown hits zero (see prep countdown effect below). */
  function startRun() {
    // Haptic on the tap itself for confirmation
    navigator.vibrate?.(200);

    // Reset any prior state before counting down
    setPoints([]);
    setElapsed(0);
    setPaused(false);
    pausedRef.current = false;
    setLocked(false);
    setStats(null);
    setSaved(false);
    setGpsError(null);

    setPrepSecondsLeft(RUN_PREP_COUNTDOWN_SECONDS);
    setRunState("countdown");
  }

  /** The real run starter — called by the prep countdown effect when
      it hits zero. Begins GPS tracking and the elapsed clock. */
  const beginRunNow = useCallback(() => {
    // Record the start time
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;

    // Begin watching the user's position with high accuracy
    const id = navigator.geolocation.watchPosition(
      handleGpsPosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 3000,    // Accept cached positions up to 3s old
        timeout: 10000,      // Wait up to 10s for a fix
      },
    );
    watchIdRef.current = id;

    // Start the elapsed-time timer
    startTimer();

    // Switch to the running view
    setRunState("running");
  }, [handleGpsPosition, handleGpsError, startTimer]);

  // ===================== PREP COUNTDOWN TICK =====================
  // Ticks prepSecondsLeft down 1/sec while runState="countdown".
  // Plays countdown beeps at 3, 2, 1 and a final "go" beep at 0.
  // When it hits 0, calls beginRunNow() to start the real tracking.
  useEffect(() => {
    if (runState !== "countdown" || prepSecondsLeft === null) return;

    if (prepSecondsLeft === 3 || prepSecondsLeft === 2 || prepSecondsLeft === 1) {
      countdownBeep();
    }

    if (prepSecondsLeft === 0) {
      // Final "go" cue — loud double-beep — then start the run
      completeBeep();
      navigator.vibrate?.([100, 50, 100]);
      beginRunNow();
      setPrepSecondsLeft(null);
      return;
    }

    const timer = setTimeout(() => {
      setPrepSecondsLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [runState, prepSecondsLeft, beginRunNow]);

  // ===================== PAUSE / RESUME =====================

  function pauseRun() {
    setPaused(true);
    pausedRef.current = true;
    pauseStartRef.current = Date.now();
    stopTimer();
  }

  function resumeRun() {
    // Add the time spent paused to our offset
    pausedDurationRef.current += Date.now() - pauseStartRef.current;
    setPaused(false);
    pausedRef.current = false;
    startTimer();
  }

  // ===================== STOP RUN =====================

  async function stopRun() {
    // Haptic feedback
    navigator.vibrate?.(200);

    // Stop the GPS watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Stop the timer
    stopTimer();

    // If paused, account for that final pause window
    if (paused) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
    }

    // Calculate the final elapsed time
    const finalElapsed = Math.floor(
      (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
    );

    // --- Compute all post-run statistics ---
    const dist = totalDistance(points);
    const avgPace = calculatePace(dist, finalElapsed);
    const splits = calculateSplits(points);
    const best = bestPace(splits);
    const elevation = calculateElevationGain(points);
    const xp = getRunXP(dist);

    const computed: RunStats = {
      distanceMetres: dist,
      durationSeconds: finalElapsed,
      avgPace,
      bestPaceSplit: best,
      elevationGain: elevation,
      splits,
      xpEarned: xp,
    };

    setStats(computed);
    setElapsed(finalElapsed);
    setRunState("complete");

    // --- Save to database and award XP ---
    await saveRun(computed);
  }

  // ===================== SAVE TO DATABASE =====================

  async function saveRun(computed: RunStats) {
    setSaving(true);
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert the run record into the "runs" table with the optional
      // challenge_distance_m column so per-benchmark PRs can be queried
      // later. We capture the inserted row so fitness_test_results can
      // reference it via source_run_id.
      const challengeDistanceM = selectedChallenge.distanceM;
      const { data: insertedRun, error: insertError } = await supabase
        .from("runs")
        .insert({
          user_id: user.id,
          route_data: points,
          distance_metres: Math.round(computed.distanceMetres),
          duration_seconds: computed.durationSeconds,
          avg_pace_seconds_per_km: computed.avgPace,
          best_pace_seconds_per_km: computed.bestPaceSplit,
          elevation_gain_metres: computed.elevationGain,
          splits: computed.splits,
          started_at: new Date(startTimeRef.current).toISOString(),
          completed_at: new Date().toISOString(),
          xp_earned: computed.xpEarned,
          challenge_distance_m: challengeDistanceM,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to save run:", insertError);
      }

      // If this run was started from the PFT hub (?source=pft) and the
      // selected challenge was the 1.5-mile preset, also write a
      // fitness_test_results row so the PFT hub sees the result on
      // the trajectory sparkline. Only counts for the 1500m preset.
      if (
        pftSourceRef.current &&
        challengeDistanceM === 2414 &&
        insertedRun
      ) {
        try {
          const { recordTestResult } = await import("@/lib/fitness/tests");
          await recordTestResult({
            userId: user.id,
            testType: "run_1500m",
            value: computed.durationSeconds,
            unit: "seconds",
            sourceRunId: (insertedRun as { id: string }).id,
          });
        } catch (err) {
          console.warn("[pft] run_1500m record failed:", err);
        }
      }

      const { awardXPAndNotify } = await import("@/lib/award-and-notify");
      await awardXPAndNotify(computed.xpEarned, "run_complete");

      // Recompute daily contract + classified op progress. Fire-and-forget.
      import("@/lib/missions/progress")
        .then(({ updateMissionsProgress }) => updateMissionsProgress(supabase, user.id))
        .catch(() => {});

      // Check and award badges
      const { checkRunBadges, checkTimeBadges } = await import("@/lib/badges");
      const { notifyBadgeEarned } = await import("@/lib/notifications");
      const dist = computed.distanceMetres;
      const runBadges = await checkRunBadges(user.id, dist);
      const timeBadges = await checkTimeBadges(user.id, new Date());
      for (const badge of [...runBadges, ...timeBadges]) {
        notifyBadgeEarned(badge);
      }

      // Check personal records (pass challenge distance so per-benchmark
      // total-time PRs like fastest_5km_total / fastest_1mi also fire)
      const { checkRunRecords } = await import("@/lib/records");
      const { notifyPersonalRecord } = await import("@/lib/notifications");
      const elapsedSeconds = computed.durationSeconds;
      const avgP = computed.avgPace;
      const runPRs = await checkRunRecords(
        user.id,
        dist,
        elapsedSeconds,
        avgP,
        challengeDistanceM,
      );
      for (const pr of runPRs) {
        notifyPersonalRecord(pr, "");
      }

      setSaved(true);
    } catch (err) {
      console.error("Error saving run:", err);
    } finally {
      setSaving(false);
    }
  }

  // ===================== CLEANUP ON UNMOUNT =====================

  useEffect(() => {
    return () => {
      // If the user navigates away mid-run, clean up watchers
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ===================== DERIVED VALUES =====================

  // Current distance from recorded points (recalculates on every render
  // during the run, which is fine — totalDistance is cheap for GPS arrays)
  const currentDistance = totalDistance(points);

  // Current pace: seconds per km based on the last ~10 seconds of movement.
  // We look at the last two points for a "live" pace reading.
  const currentPace =
    points.length >= 2
      ? (() => {
          const last = points[points.length - 1];
          const prev = points[points.length - 2];
          const segDist =
            totalDistance([prev, last]); // distance between last 2 points
          const segTime = (last.timestamp - prev.timestamp) / 1000;
          return calculatePace(segDist, segTime);
        })()
      : 0;

  // Average pace for the entire run so far
  const avgPaceLive = calculatePace(currentDistance, elapsed);

  // ===================== CHALLENGE AUTO-STOP =====================
  //
  // When a challenge distance is selected and the run is live, stop the
  // run automatically the moment currentDistance hits the target. The
  // haptic pulse + complete beep give the runner an unmistakable "done"
  // signal even through a pocket.
  useEffect(() => {
    if (runState !== "running") return;
    if (!selectedChallenge.distanceM) return;
    if (currentDistance < selectedChallenge.distanceM) return;
    // Fire once -- stopRun flips runState away from "running" so the
    // effect won't re-enter.
    navigator.vibrate?.([100, 50, 100, 50, 200]);
    completeBeep();
    stopRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runState, currentDistance, selectedChallenge.distanceM]);

  // ===================== RENDER =====================

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-4 pb-24">
      {/* ========== READY STATE ========== */}
      {runState === "ready" && (
        <div className="space-y-4">
          {/* Header with back button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/missions")}
              className="text-text-secondary hover:text-sand transition-colors"
              aria-label="Back to missions"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-heading uppercase tracking-wider text-sand">
                Run Tracker
              </h1>
              <Tag variant="default">STANDBY</Tag>
            </div>
          </div>

          {/* Map preview showing user's current location */}
          <RunMap points={points} isLive={false} height="h-56" />

          {/* GPS error / unavailable message */}
          {!gpsAvailable && (
            <Card tag="ERROR" tagVariant="danger">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-danger" />
                <p className="text-sm text-danger font-mono">
                  GPS is not available on this device. Run tracking requires
                  location services.
                </p>
              </div>
            </Card>
          )}

          {gpsError && gpsAvailable && (
            <Card tag="WARNING" tagVariant="danger">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-danger" />
                <p className="text-sm text-danger font-mono">{gpsError}</p>
              </div>
            </Card>
          )}

          {/* Challenge picker -- preset benchmark distances with PR
              tracking. FREE RUN is the default. Selecting a preset
              arms auto-stop when the target distance is reached. */}
          <div>
            <p className="text-[0.6rem] font-mono uppercase tracking-[0.15em] text-text-secondary mb-2">
              Challenge
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RUN_CHALLENGES.map((challenge) => {
                const active = challenge.id === selectedChallenge.id;
                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => setSelectedChallenge(challenge)}
                    className={`
                      min-h-[44px] px-2 py-2 font-mono text-xs uppercase tracking-wider
                      transition-colors border
                      ${active
                        ? "bg-xp-gold/10 border-xp-gold text-xp-gold"
                        : "bg-bg-panel border-green-dark text-text-secondary hover:text-sand"}
                    `}
                  >
                    {challenge.label}
                  </button>
                );
              })}
            </div>
            {selectedChallenge.distanceM && (
              <p className="text-[0.6rem] font-mono text-text-secondary mt-2 uppercase tracking-wider">
                Auto-stop at {selectedChallenge.distanceM} m
                {pftSourceRef.current ? " · PFT LOG" : ""}
              </p>
            )}
          </div>

          {/* Start run button */}
          <Button
            fullWidth
            onClick={startRun}
            disabled={!gpsAvailable}
            className="text-base py-4"
          >
            <span className="flex items-center justify-center gap-2">
              <Play size={20} />
              LIGHTS OUT, MOVE OUT
            </span>
          </Button>

          {/* Tip for the user */}
          <p className="text-[0.65rem] text-text-secondary font-mono text-center">
            GPS ARMED. Outdoors only. No cheating.
          </p>
        </div>
      )}

      {/* ========== COUNTDOWN STATE ========== */}
      {/* 5-second prep window after the user taps GO. GPS watcher and
          elapsed clock don't start until the countdown effect calls
          beginRunNow() at 0. */}
      {runState === "countdown" && (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center">
          <Tag variant="default">GET READY</Tag>

          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            GPS ARMED
          </p>
          <h2 className="text-2xl sm:text-3xl font-heading uppercase tracking-wider text-sand leading-tight">
            Lights Out, Move Out
          </h2>

          <div className="flex items-center justify-center w-40 h-40 border-2 border-green-primary bg-bg-panel">
            <span className="text-7xl font-heading text-green-light tabular-nums drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
              {prepSecondsLeft ?? RUN_PREP_COUNTDOWN_SECONDS}
            </span>
          </div>

          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary animate-pulse">
            TRACKING BEGINS IN {prepSecondsLeft ?? RUN_PREP_COUNTDOWN_SECONDS} SECONDS
          </p>
          <p className="text-[0.65rem] font-mono text-text-secondary opacity-70 max-w-xs leading-snug">
            Get to your start line, phone secure. Auto-starts when counter hits zero.
          </p>
        </div>
      )}

      {/* ========== RUNNING STATE ========== */}
      {runState === "running" && (
        <div className="space-y-4">
          {/* Large elapsed time display */}
          <div className="text-center py-2">
            <p className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-widest mb-1">
              Elapsed Time
            </p>
            <p className="text-5xl font-mono text-sand tracking-wider">
              {formatDuration(elapsed)}
            </p>
            {paused && (
              <Tag variant="danger" className="mt-2">
                PAUSED
              </Tag>
            )}
          </div>

          {/* Stats row: distance, current pace, average pace */}
          <div className="grid grid-cols-3 gap-2">
            {/* Distance */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Distance
              </p>
              <p className="text-3xl font-mono text-sand mt-1">
                {formatDistance(currentDistance)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">km</p>
            </Card>

            {/* Current pace (live reading from last GPS segment) */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Pace
              </p>
              <p className="text-3xl font-mono text-sand mt-1">
                {formatPace(currentPace)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">
                min/km
              </p>
            </Card>

            {/* Average pace */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Avg Pace
              </p>
              <p className="text-3xl font-mono text-sand mt-1">
                {formatPace(avgPaceLive)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">
                min/km
              </p>
            </Card>
          </div>

          {/* GPS signal warning */}
          {gpsError && (
            <div className="flex items-center gap-2 px-2 py-2 bg-bg-panel border border-danger">
              <MapPin size={14} className="text-danger flex-shrink-0" />
              <p className="text-[0.65rem] text-danger font-mono">{gpsError}</p>
            </div>
          )}

          {/* Live map showing the route being drawn */}
          <RunMap points={points} isLive={!paused} height="h-64" />

          {/* Lock overlay — blocks accidental taps on controls */}
          {locked && (
            <div
              className="fixed inset-0 bg-black/60 z-40 flex flex-col items-center justify-center gap-4"
              onClick={() => setLocked(false)}
            >
              <Lock size={48} className="text-text-secondary" />
              <p className="text-sm font-mono text-text-secondary uppercase tracking-wider">
                Screen Locked
              </p>
              <p className="text-[0.65rem] font-mono text-text-secondary">
                Tap anywhere to unlock
              </p>
            </div>
          )}

          {/* Control buttons */}
          <div className="space-y-3">
            {/* Pause / Resume */}
            <div className="grid grid-cols-2 gap-3">
              {paused ? (
                <Button fullWidth onClick={resumeRun}>
                  <span className="flex items-center justify-center gap-2">
                    <Play size={18} />
                    RESUME
                  </span>
                </Button>
              ) : (
                <Button fullWidth variant="secondary" onClick={pauseRun}>
                  <span className="flex items-center justify-center gap-2">
                    <Pause size={18} />
                    PAUSE
                  </span>
                </Button>
              )}

              {/* Stop button */}
              <Button fullWidth variant="danger" onClick={stopRun}>
                <span className="flex items-center justify-center gap-2">
                  <Square size={18} />
                  STOP
                </span>
              </Button>
            </div>

            {/* Lock toggle */}
            <button
              onClick={() => setLocked(true)}
              className="w-full flex items-center justify-center gap-2 min-h-[44px]
                         text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider
                         border border-green-dark bg-bg-panel hover:bg-bg-panel-alt transition-colors"
            >
              {locked ? (
                <Unlock size={14} />
              ) : (
                <Lock size={14} />
              )}
              Lock Screen
            </button>
          </div>
        </div>
      )}

      {/* ========== COMPLETE STATE ========== */}
      {runState === "complete" && stats && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <Tag variant="complete" className="mb-2">
              TERRAIN CONQUERED
            </Tag>
            <h1 className="text-lg font-heading uppercase tracking-wider text-sand">
              Combat Run Debrief
            </h1>
          </div>

          {/* XP earned card */}
          <Card tag="XP EARNED" tagVariant="gold" className="text-center py-4">
            <div className="flex items-center justify-center gap-2">
              <Zap size={24} className="text-xp-gold" />
              <p className="text-4xl font-mono text-xp-gold">
                +{stats.xpEarned}
              </p>
            </div>
            <p className="text-[0.65rem] font-mono text-text-secondary mt-1">
              {saving ? "Saving..." : saved ? "Saved to profile" : "Awarding XP..."}
            </p>
          </Card>

          {/* Main stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total distance */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Total Distance
              </p>
              <p className="text-4xl font-mono text-sand mt-1">
                {formatDistance(stats.distanceMetres)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">km</p>
            </Card>

            {/* Total time */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Total Time
              </p>
              <p className="text-4xl font-mono text-sand mt-1">
                {formatDuration(stats.durationSeconds)}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock size={10} className="text-text-secondary" />
                <p className="text-[0.55rem] font-mono text-text-secondary">
                  duration
                </p>
              </div>
            </Card>

            {/* Average pace */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Avg Pace
              </p>
              <p className="text-3xl font-mono text-sand mt-1">
                {formatPace(stats.avgPace)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">
                min/km
              </p>
            </Card>

            {/* Best pace (fastest split) */}
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Best Pace
              </p>
              <p className="text-3xl font-mono text-green-light mt-1">
                {formatPace(stats.bestPaceSplit)}
              </p>
              <p className="text-[0.55rem] font-mono text-text-secondary">
                min/km
              </p>
            </Card>
          </div>

          {/* Elevation gain (if available) */}
          {stats.elevationGain !== null && (
            <Card className="text-center py-3">
              <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                Elevation Gain
              </p>
              <p className="text-3xl font-mono text-sand mt-1">
                {stats.elevationGain}
                <span className="text-sm text-text-secondary ml-1">m</span>
              </p>
            </Card>
          )}

          {/* Split table (one row per km) */}
          {stats.splits.length > 0 && (
            <div>
              <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">
                Splits
              </h3>
              <div className="bg-bg-panel border border-green-dark overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-green-dark">
                  <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
                    KM
                  </p>
                  <p className="text-[0.55rem] font-mono text-text-secondary uppercase text-center">
                    Pace
                  </p>
                  <p className="text-[0.55rem] font-mono text-text-secondary uppercase text-right">
                    Elapsed
                  </p>
                </div>

                {/* One row per split */}
                {stats.splits.map((split, i) => {
                  // Highlight the fastest split in green
                  const isBest =
                    split.pace_seconds_per_km === stats.bestPaceSplit &&
                    stats.bestPaceSplit > 0;

                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-3 gap-0 px-3 py-2 border-b border-green-dark last:border-b-0
                        ${isBest ? "bg-bg-panel-alt" : ""}`}
                    >
                      <p className="text-sm font-mono text-sand">
                        {split.distance_km.toFixed(0)}
                      </p>
                      <p
                        className={`text-sm font-mono text-center ${
                          isBest ? "text-green-light" : "text-sand"
                        }`}
                      >
                        {formatPace(split.pace_seconds_per_km)}
                      </p>
                      <p className="text-sm font-mono text-text-secondary text-right">
                        {formatDuration(split.elapsed_seconds)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route map showing the full completed run */}
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">
              Route
            </h3>
            <RunMap points={points} isLive={false} height="h-56" />
          </div>

          {/* Distance progress bar (visual flair showing how far towards 10km) */}
          <div>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mb-1">
              Distance Progress (10km)
            </p>
            <ProgressBar
              value={Math.min(stats.distanceMetres, 10000)}
              max={10000}
              showLabel
            />
          </div>

          {/* Dismiss button — returns to missions page */}
          <Button
            fullWidth
            onClick={() => router.push("/missions")}
            className="text-base py-4"
          >
            <span className="flex items-center justify-center gap-2">
              <ArrowLeft size={18} />
              DISMISS
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
