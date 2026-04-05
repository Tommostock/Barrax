/* ============================================
   Timer Component
   Countdown or count-up timer display.
   Shows time in MM:SS or HH:MM:SS format.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";

interface TimerProps {
  initialSeconds: number;  // Starting seconds
  mode?: "countdown" | "countup";
  running?: boolean;
  onComplete?: () => void; // Called when countdown reaches 0
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Timer({
  initialSeconds,
  mode = "countdown",
  running = true,
  onComplete,
  size = "md",
  className = "",
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Reset when initialSeconds changes (e.g. new exercise)
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Tick every second when running
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (mode === "countdown") {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, mode, onComplete]);

  // Format seconds into a readable time string
  const formatTime = useCallback((totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, []);

  // Size variants
  const sizes = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <span className={`font-mono font-bold ${sizes[size]} text-text-primary ${className}`}>
      {formatTime(seconds)}
    </span>
  );
}
