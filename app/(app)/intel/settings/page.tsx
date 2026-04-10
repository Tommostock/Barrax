/* ============================================
   Settings Page (BASE OPERATIONS)
   Edit profile, food preferences, notifications,
   units, and manage account data.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BottomSheet from "@/components/ui/BottomSheet";
import { ArrowLeft, Save, Trash2, LogOut } from "lucide-react";
import Link from "next/link";
import type { Profile, FoodPreference, TrainingSchedule, ScheduleDay, DayType } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [foods, setFoods] = useState<FoodPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetSheet, setShowResetSheet] = useState(false);
  const [foodInput, setFoodInput] = useState("");
  const [activeFoodList, setActiveFoodList] = useState<"no_go" | "maybe" | "approved">("no_go");
  const [oledMode, setOledMode] = useState(false);

  // Read OLED mode from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("barrax_oled_mode");
      if (stored === "true") {
        setOledMode(true);
        document.documentElement.style.setProperty("--bg-primary", "#000000");
      }
    } catch {}
  }, []);

  // Load profile and food preferences on mount
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: foodData } = await supabase
        .from("food_preferences")
        .select("*")
        .eq("user_id", user.id);

      if (profileData) setProfile(profileData);
      if (foodData) setFoods(foodData);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Save profile changes
  async function saveProfile() {
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").update({
      name: profile.name,
      age: profile.age,
      height_cm: profile.height_cm,
      fitness_level: profile.fitness_level,
      default_workout_minutes: profile.default_workout_minutes,
      calorie_target: profile.calorie_target,
      rest_day_calorie_target: profile.rest_day_calorie_target ?? null,
      unit_preference: profile.unit_preference,
      notification_settings: profile.notification_settings,
      training_schedule: profile.training_schedule ?? {},
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    setSaving(false);
    setMessage(error ? "Failed to save." : "Settings saved.");
    setTimeout(() => setMessage(null), 3000);
  }

  // Add food preference
  async function addFood() {
    const food = foodInput.trim();
    if (!food) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("food_preferences")
      .insert({ user_id: user.id, food_name: food, category: activeFoodList })
      .select()
      .single();

    if (!error && data) {
      setFoods((prev) => [...prev, data]);
      setFoodInput("");
    }
  }

  // Remove food preference
  async function removeFood(id: string) {
    await supabase.from("food_preferences").delete().eq("id", id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }

  // Reset all user progress — deletes XP, rank, badges,
  // workouts, runs, programmes, food diary, and weight logs.
  // Profile and food preferences are kept so they don't have to
  // re-enter their settings.
  const [resetting, setResetting] = useState(false);

  async function resetAllProgress() {
    setResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete progress data from all tables in parallel.
      // Order doesn't matter because RLS scopes to the user
      // and there are no cross-table FK constraints blocking deletes.
      await Promise.all([
        supabase.from("workouts").delete().eq("user_id", user.id),
        supabase.from("workout_programmes").delete().eq("user_id", user.id),
        supabase.from("workout_exercises").delete().in(
          "workout_id",
          // Sub-select: get all workout IDs for this user first
          (await supabase.from("workouts").select("id").eq("user_id", user.id)).data?.map((w) => w.id) ?? []
        ),
        supabase.from("runs").delete().eq("user_id", user.id),
        supabase.from("weight_logs").delete().eq("user_id", user.id),
        supabase.from("food_diary").delete().eq("user_id", user.id),
        supabase.from("badges").delete().eq("user_id", user.id),
        // Reset rank to defaults (rank 1, 0 XP) rather than deleting
        supabase.from("ranks").update({
          current_rank: 1,
          total_xp: 0,
          rank_history: [],
        }).eq("user_id", user.id),
      ]);

      setShowResetSheet(false);
      setMessage("All progress has been reset.");
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error("Reset failed:", err);
      setMessage("Reset failed. Please try again.");
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setResetting(false);
    }
  }

  // Sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/intel" className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Base Operations
        </h2>
      </div>

      {/* Profile section */}
      <Card tag="PROFILE" tagVariant="active">
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Name</label>
            <input
              type="text"
              value={profile.name ?? ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Age</label>
              <input
                type="number"
                value={profile.age ?? ""}
                onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Height (cm)</label>
              <input
                type="number"
                value={profile.height_cm ?? ""}
                onChange={(e) => setProfile({ ...profile, height_cm: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Fitness Level</label>
            <div className="flex border border-green-dark">
              {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, fitness_level: level })}
                  className={`flex-1 py-2 text-[0.65rem] font-mono uppercase tracking-wider transition-colors
                    ${profile.fitness_level === level ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Workout Time (min)</label>
            <input
              type="number"
              value={profile.default_workout_minutes ?? 30}
              onChange={(e) => setProfile({ ...profile, default_workout_minutes: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Calorie Target (Workout Days)</label>
            <input
              type="number"
              value={profile.calorie_target ?? 2000}
              onChange={(e) => setProfile({ ...profile, calorie_target: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
              Calorie Target (Rest Days)
              <span className="ml-2 text-text-secondary/60 normal-case">optional — leave blank to use same target</span>
            </label>
            <input
              type="number"
              value={profile.rest_day_calorie_target ?? ""}
              onChange={(e) => setProfile({ ...profile, rest_day_calorie_target: e.target.value ? Number(e.target.value) : null })}
              placeholder={String(profile.calorie_target ?? 2000)}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm placeholder:text-text-secondary/40"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Units</label>
            <div className="flex border border-green-dark">
              {(["metric", "imperial"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setProfile({ ...profile, unit_preference: unit })}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors
                    ${profile.unit_preference === unit ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Display</label>
            <div className="flex border border-green-dark">
              <button onClick={() => { setOledMode(false); localStorage.setItem("barrax_oled_mode", "false"); document.documentElement.style.setProperty("--bg-primary", "#0C0C0C"); }}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${!oledMode ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}>
                STANDARD
              </button>
              <button onClick={() => { setOledMode(true); localStorage.setItem("barrax_oled_mode", "true"); document.documentElement.style.setProperty("--bg-primary", "#000000"); }}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${oledMode ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}>
                OLED BLACK
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Food preferences */}
      <Card tag="FOOD PREFS" tagVariant="active">
        <div className="space-y-3">
          <div className="flex border border-green-dark">
            {(["no_go", "maybe", "approved"] as const).map((list) => (
              <button
                key={list}
                onClick={() => setActiveFoodList(list)}
                className={`flex-1 py-2 text-[0.65rem] font-mono uppercase tracking-wider transition-colors
                  ${activeFoodList === list ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}
              >
                {list === "no_go" ? "NO GO" : list === "maybe" ? "MAYBE" : "APPROVED"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFood()}
              className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
              placeholder="Add a food..."
            />
            <Button onClick={addFood} className="px-4">ADD</Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {foods.filter((f) => f.category === activeFoodList).map((food) => (
              <div key={food.id} className="flex items-center justify-between px-3 py-2 bg-bg-panel border border-green-dark/50">
                <span className="text-sm text-text-primary">{food.food_name}</span>
                <button onClick={() => removeFood(food.id)} className="text-danger text-xs font-mono min-w-[44px] min-h-[44px] flex items-center justify-center">
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Training schedule — define what each day of the week should be */}
      <TrainingScheduleEditor
        schedule={(profile.training_schedule ?? {}) as TrainingSchedule}
        onChange={(schedule) => setProfile({ ...profile, training_schedule: schedule })}
      />

      {/* Save button */}
      <Button onClick={saveProfile} disabled={saving} fullWidth>
        <span className="flex items-center justify-center gap-2">
          <Save size={16} />
          {saving ? "LOCKING IN..." : "LOCK IN CHANGES"}
        </span>
      </Button>
      {message && <p className="text-xs text-green-light font-mono text-center">{message}</p>}

      {/* Account management */}
      <Card tag="ACCOUNT" tagVariant="default">
        <div className="space-y-3">
          <button onClick={() => setShowResetSheet(true)} className="w-full flex items-center gap-3 p-3 bg-bg-panel-alt border border-danger/50 hover:bg-danger/10 transition-colors min-h-[44px]">
            <Trash2 size={16} className="text-danger" />
            <span className="text-sm text-danger">Wipe the Slate Clean</span>
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 bg-bg-panel-alt border border-green-dark hover:bg-bg-input transition-colors min-h-[44px]">
            <LogOut size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Dismiss from Duty</span>
          </button>
        </div>
      </Card>

      {/* Reset confirmation sheet */}
      <BottomSheet isOpen={showResetSheet} onClose={() => setShowResetSheet(false)} title="Acknowledge the Wipe">
        <div className="space-y-4">
          <p className="text-sm text-text-primary">
            This will PERMANENTLY DELETE all your progress: XP, rank, badges, workouts, runs, food logs, weight history. EVERYTHING. There&apos;s NO coming back from this.
          </p>
          <p className="text-sm text-text-secondary">
            Your profile and food preferences stay. You&apos;ll start from ZERO.
          </p>
          <Button variant="danger" fullWidth onClick={resetAllProgress} disabled={resetting}>
            {resetting ? "WIPING..." : "WIPE IT ALL"}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setShowResetSheet(false)} disabled={resetting}>
            HOLD ON
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

// ──────────────────────────────────────────────
// Training Schedule Editor
// Lets the user assign a type to each day of the
// week: workout, rest, run, or a custom activity.
// ──────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "MON", tuesday: "TUE", wednesday: "WED",
  thursday: "THU", friday: "FRI", saturday: "SAT", sunday: "SUN",
};

// Available day types and their display colours
const DAY_TYPES: { value: DayType; label: string; color: string }[] = [
  { value: "workout", label: "WORKOUT", color: "bg-green-primary" },
  { value: "rest",    label: "REST",    color: "bg-bg-panel-alt" },
  { value: "run",     label: "RUN",     color: "bg-green-muted" },
  { value: "activity", label: "ACTIVITY", color: "bg-khaki/30" },
];

function TrainingScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: TrainingSchedule;
  onChange: (schedule: TrainingSchedule) => void;
}) {
  // Which day is expanded for editing (null = none)
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Update a single day's config
  function updateDay(day: string, updates: Partial<ScheduleDay>) {
    const current = schedule[day as keyof TrainingSchedule] ?? { type: "workout" as DayType };
    onChange({
      ...schedule,
      [day]: { ...current, ...updates },
    });
  }

  // Get the display info for a day
  function getDayInfo(day: string): { label: string; color: string } {
    const dayData = schedule[day as keyof TrainingSchedule];
    if (!dayData) return { label: "WORKOUT", color: "bg-green-primary" };

    if (dayData.type === "activity" && dayData.activity_name) {
      return { label: dayData.activity_name.toUpperCase(), color: "bg-khaki/30" };
    }

    const typeInfo = DAY_TYPES.find((t) => t.value === dayData.type);
    return { label: typeInfo?.label ?? "WORKOUT", color: typeInfo?.color ?? "bg-green-primary" };
  }

  return (
    <Card tag="TRAINING SCHEDULE" tagVariant="active">
      <p className="text-[0.6rem] font-mono text-text-secondary mb-3">
        Set what each day should be. The programme generator will follow these rules.
      </p>

      {/* Day grid — tap to expand */}
      <div className="space-y-1">
        {DAYS.map((day) => {
          const info = getDayInfo(day);
          const isExpanded = expandedDay === day;
          const dayData = schedule[day as keyof TrainingSchedule];

          return (
            <div key={day}>
              {/* Day row — tap to toggle editor */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day)}
                className="w-full flex items-center justify-between p-2 border border-green-dark
                           hover:bg-bg-panel-alt transition-colors min-h-[44px]"
              >
                <span className="text-xs font-mono text-sand uppercase tracking-wider w-10">
                  {DAY_LABELS[day]}
                </span>
                <span className={`text-[0.6rem] font-mono uppercase tracking-wider px-2 py-0.5
                                  ${info.color} text-text-primary`}>
                  {info.label}
                </span>
              </button>

              {/* Expanded editor for this day */}
              {isExpanded && (
                <div className="border border-green-dark border-t-0 bg-bg-panel p-3 space-y-2">
                  {/* Type selector — row of buttons */}
                  <div className="flex border border-green-dark">
                    {DAY_TYPES.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateDay(day, { type: opt.value })}
                        className={`flex-1 py-2 text-[0.55rem] font-mono uppercase tracking-wider transition-colors
                          ${(dayData?.type ?? "workout") === opt.value
                            ? "bg-green-primary text-text-primary"
                            : "bg-bg-panel text-text-secondary"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Activity-specific fields (name + duration) */}
                  {dayData?.type === "activity" && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[0.55rem] uppercase tracking-wider text-text-secondary mb-1 font-mono">
                          Activity Name
                        </label>
                        <input
                          type="text"
                          value={dayData.activity_name ?? ""}
                          onChange={(e) => updateDay(day, { activity_name: e.target.value })}
                          placeholder="e.g. Football"
                          className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary
                                     focus:border-green-primary focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.55rem] uppercase tracking-wider text-text-secondary mb-1 font-mono">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={dayData.duration_minutes ?? 60}
                          onChange={(e) => updateDay(day, { duration_minutes: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary
                                     focus:border-green-primary focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
