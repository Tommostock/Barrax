/* ============================================
   WorkoutCalendar Component
   A month-view heat map of workout history.
   Days are coloured by workout status:
     - Green  = completed workout
     - Red    = missed (past day, no workout)
     - Grey   = rest day or future date
   Today gets a highlighted border.
   ============================================ */

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------------------------------
   TYPES
   Each workout has a date string (YYYY-MM-DD)
   and a status like "complete" or "pending".
   ------------------------------------------ */
interface WorkoutEntry {
  scheduled_date: string; // e.g. "2026-04-06"
  status: string;         // e.g. "complete", "pending", "skipped"
}

interface WorkoutCalendarProps {
  month: Date;                     // The initial month to display
  workouts: WorkoutEntry[];        // Array of workouts to plot on the calendar
  onMonthChange?: (date: Date) => void; // Optional callback when user navigates months
}

/* ------------------------------------------
   DAY LABELS
   Short military-style day headers for the
   top of the calendar grid.
   ------------------------------------------ */
const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/* ==============================================
   MAIN COMPONENT
   ============================================== */
export default function WorkoutCalendar({
  month: initialMonth,
  workouts,
  onMonthChange,
}: WorkoutCalendarProps) {
  // Track which month is currently displayed
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  // Today's date at midnight (for comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ------------------------------------------
     MONTH NAVIGATION
     Go forward or backward by one month.
     ------------------------------------------ */
  function goToPreviousMonth() {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
    onMonthChange?.(prev);
  }

  function goToNextMonth() {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
    onMonthChange?.(next);
  }

  /* ------------------------------------------
     BUILD THE CALENDAR GRID
     We need to figure out:
     1. What day of the week the month starts on
     2. How many days are in the month
     3. Leading empty cells for alignment
     ------------------------------------------ */

  // First day of the displayed month
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

  // Total days in this month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  // Day of the week for the 1st (0=Sun, 1=Mon, ..., 6=Sat)
  // We convert to Monday-start: Mon=0, Tue=1, ..., Sun=6
  const startDayOfWeek = firstDay.getDay();
  const mondayStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Build an array of day numbers (1..daysInMonth)
  // with leading nulls to align the first day correctly
  const calendarCells: (number | null)[] = [];

  // Add empty cells before the first day
  for (let i = 0; i < mondayStart; i++) {
    calendarCells.push(null);
  }

  // Add each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  /* ------------------------------------------
     GET STATUS FOR A SPECIFIC DAY
     Look up the workout array to find a match.
     Returns "complete", "missed", or "none".
     ------------------------------------------ */
  function getDayStatus(dayNumber: number): "complete" | "missed" | "none" {
    // Build the date string for this day (YYYY-MM-DD format)
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const day = String(dayNumber).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Check if there's a workout on this date
    const workout = workouts.find((w) => w.scheduled_date === dateStr);

    if (workout) {
      // If the workout exists and is complete, it's green
      if (workout.status === "complete") return "complete";
      // If it's a past date and not complete, it's missed
      const cellDate = new Date(year, currentMonth.getMonth(), dayNumber);
      if (cellDate < today) return "missed";
      // Otherwise it's a future pending workout — treat as none
      return "none";
    }

    // No workout scheduled for this day
    return "none";
  }

  /* ------------------------------------------
     CHECK IF A DAY IS TODAY
     Compare year, month, and day.
     ------------------------------------------ */
  function isToday(dayNumber: number): boolean {
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === dayNumber
    );
  }

  /* ------------------------------------------
     GET BACKGROUND COLOUR CLASS FOR A DAY
     Maps the status to Tailwind classes.
     ------------------------------------------ */
  function getDayColour(dayNumber: number): string {
    const status = getDayStatus(dayNumber);

    switch (status) {
      case "complete":
        // Green background for completed workouts
        return "bg-green-primary";
      case "missed":
        // Red/danger tint for missed workouts
        return "bg-danger/30";
      default:
        // Default grey for rest days or future dates
        return "bg-bg-panel-alt";
    }
  }

  /* ------------------------------------------
     FORMAT THE MONTH/YEAR HEADER
     e.g. "APRIL 2026"
     ------------------------------------------ */
  const monthLabel = currentMonth
    .toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    .toUpperCase();

  /* ==============================================
     RENDER
     ============================================== */
  return (
    <div className="bg-bg-panel border border-green-dark p-4">
      {/* ---- HEADER: Month label + navigation arrows ---- */}
      <div className="flex items-center justify-between mb-4">
        {/* Left arrow — go to previous month */}
        <button
          onClick={goToPreviousMonth}
          className="p-2 text-text-secondary hover:text-green-light transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Month and year label */}
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
          {monthLabel}
        </h3>

        {/* Right arrow — go to next month */}
        <button
          onClick={goToNextMonth}
          className="p-2 text-text-secondary hover:text-green-light transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ---- DAY-OF-WEEK HEADERS ---- */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-[0.5rem] font-mono text-text-secondary uppercase tracking-wider py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ---- CALENDAR GRID ---- */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((dayNumber, index) => {
          // Empty cells (before the 1st of the month)
          if (dayNumber === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          // Determine styling for this day
          const todayHighlight = isToday(dayNumber);
          const bgColour = getDayColour(dayNumber);

          return (
            <div
              key={dayNumber}
              className={`
                aspect-square flex items-center justify-center
                ${bgColour}
                ${todayHighlight ? "border-2 border-green-light" : "border border-green-dark/30"}
                transition-colors
              `}
            >
              {/* Day number in small monospace font */}
              <span
                className={`
                  text-[0.6rem] font-mono
                  ${todayHighlight ? "text-green-light font-bold" : "text-text-secondary"}
                `}
              >
                {dayNumber}
              </span>
            </div>
          );
        })}
      </div>

      {/* ---- LEGEND ---- */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-green-dark/50">
        {/* Complete indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-primary" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Complete
          </span>
        </div>
        {/* Missed indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-danger/30" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Missed
          </span>
        </div>
        {/* Rest/Future indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-bg-panel-alt border border-green-dark/30" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Rest
          </span>
        </div>
      </div>
    </div>
  );
}
