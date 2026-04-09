/* ============================================
   Onboarding Page
   Multi-step form that collects user profile data,
   food preferences, and settings. Saves to Supabase
   and redirects to the dashboard on completion.
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import type { FitnessLevel, UnitPreference, OnboardingData } from "@/types";

// Total number of steps in the onboarding flow
const TOTAL_STEPS = 9;

// Default notification settings
const DEFAULT_NOTIFICATIONS = {
  morning_mission: true,
  missed_workout: true,
  water_reminder: true,
  weekly_programme: true,
  rank_up: true,
  personal_record: true,
  reminder_time: "07:00",
  quiet_start: "22:00",
  quiet_end: "06:00",
};

// Common approved foods pre-populated during onboarding
const DEFAULT_APPROVED_FOODS = [
  "Chicken breast", "Rice", "Pasta", "Bread", "Eggs", "Milk",
  "Cheese", "Potatoes", "Carrots", "Peas", "Sweetcorn",
  "Apples", "Bananas", "Butter", "Mince beef", "Sausages",
  "Bacon", "Toast", "Cereal", "Chips", "Pizza",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding form state
  const [data, setData] = useState<OnboardingData>({
    name: "",
    age: null,
    height_cm: null,
    weight_kg: null,
    fitness_level: "beginner",
    goals: [],
    default_workout_minutes: 30,
    food_preferences: {
      no_go: [],
      maybe: [],
      approved: [...DEFAULT_APPROVED_FOODS],
    },
    calorie_target: 2000,
    unit_preference: "metric",
    notification_settings: DEFAULT_NOTIFICATIONS,
  });

  // Food input states
  const [foodInput, setFoodInput] = useState("");
  const [activeFoodList, setActiveFoodList] = useState<"no_go" | "maybe" | "approved">("no_go");

  // Navigate between steps
  function nextStep() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  // Toggle a goal in the goals array
  function toggleGoal(goal: string) {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  }

  // Add a food to the active preference list
  function addFood() {
    const food = foodInput.trim();
    if (!food) return;

    setData((prev) => ({
      ...prev,
      food_preferences: {
        ...prev.food_preferences,
        [activeFoodList]: [...prev.food_preferences[activeFoodList], food],
      },
    }));
    setFoodInput("");
  }

  // Remove a food from a specific list
  function removeFood(list: "no_go" | "maybe" | "approved", food: string) {
    setData((prev) => ({
      ...prev,
      food_preferences: {
        ...prev.food_preferences,
        [list]: prev.food_preferences[list].filter((f) => f !== food),
      },
    }));
  }

  // Save all onboarding data to Supabase
  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign in again.");
        setLoading(false);
        return;
      }

      // Upsert the profile (trigger may have already created a row)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        name: data.name,
        age: data.age,
        height_cm: data.height_cm,
        fitness_level: data.fitness_level,
        goals: data.goals,
        default_workout_minutes: data.default_workout_minutes,
        calorie_target: data.calorie_target,
        unit_preference: data.unit_preference,
        notification_settings: data.notification_settings,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Save initial weight if provided
      if (data.weight_kg) {
        await supabase.from("weight_logs").insert({
          user_id: user.id,
          weight_kg: data.weight_kg,
        });
      }

      // Save all food preferences
      const foodRows = [
        ...data.food_preferences.no_go.map((f) => ({
          user_id: user.id,
          food_name: f,
          category: "no_go" as const,
        })),
        ...data.food_preferences.maybe.map((f) => ({
          user_id: user.id,
          food_name: f,
          category: "maybe" as const,
        })),
        ...data.food_preferences.approved.map((f) => ({
          user_id: user.id,
          food_name: f,
          category: "approved" as const,
        })),
      ];

      if (foodRows.length > 0) {
        const { error: foodError } = await supabase
          .from("food_preferences")
          .insert(foodRows);
        if (foodError) throw foodError;
      }

      // Redirect to the dashboard
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Progress bar at the top */}
      <div className="px-4 pt-4">
        <ProgressBar value={step} max={TOTAL_STEPS} height="h-1" />
        <p className="text-[0.6rem] font-mono text-text-secondary mt-1 text-right">
          STEP {step}/{TOTAL_STEPS}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-3xl font-heading font-bold tracking-[0.15em] text-sand mb-4">
              BARRAX
            </h1>
            <p className="text-text-secondary text-sm max-w-xs">
              Your assault begins NOW, soldier. No gym, no equipment, no excuses.
              Just your body, the ground, and YOUR willpower. Let&apos;s go.
            </p>
          </div>
        )}

        {/* STEP 2: Profile basics */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Personnel File
            </h2>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
                Name
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                           focus:border-green-primary focus:outline-none text-sm"
                placeholder="What should we call you?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
                  Age
                </label>
                <input
                  type="number"
                  value={data.age ?? ""}
                  onChange={(e) => setData({ ...data, age: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                             focus:border-green-primary focus:outline-none text-sm"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={data.height_cm ?? ""}
                  onChange={(e) => setData({ ...data, height_cm: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                             focus:border-green-primary focus:outline-none text-sm"
                  placeholder="cm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
                Current Weight (optional)
              </label>
              <input
                type="number"
                value={data.weight_kg ?? ""}
                onChange={(e) => setData({ ...data, weight_kg: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                           focus:border-green-primary focus:outline-none text-sm"
                placeholder="kg"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Fitness level */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Fitness Level
            </h2>
            <p className="text-xs text-text-secondary">
              This affects the difficulty of your workouts. Be honest.
            </p>
            {(["beginner", "intermediate", "advanced"] as FitnessLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setData({ ...data, fitness_level: level })}
                className={`w-full p-4 border text-left transition-colors
                  ${data.fitness_level === level
                    ? "bg-green-primary/20 border-green-primary"
                    : "bg-bg-panel border-green-dark hover:bg-bg-panel-alt"
                  }`}
              >
                <p className="text-sm font-heading uppercase tracking-wider text-sand">
                  {level}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {level === "beginner" && "New to regular exercise or getting back into it."}
                  {level === "intermediate" && "Exercise regularly. Comfortable with most bodyweight movements."}
                  {level === "advanced" && "Highly active. Push-ups, pull-ups, and running are routine."}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* STEP 4: Goals */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Mission Objectives
            </h2>
            <p className="text-xs text-text-secondary">Select all that apply.</p>
            {["General fitness", "Weight loss", "Strength", "Endurance", "Mental health"].map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`w-full p-4 border text-left transition-colors
                  ${data.goals.includes(goal)
                    ? "bg-green-primary/20 border-green-primary"
                    : "bg-bg-panel border-green-dark hover:bg-bg-panel-alt"
                  }`}
              >
                <p className="text-sm font-heading uppercase tracking-wider text-sand">
                  {goal}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* STEP 5: Workout time */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Available Time
            </h2>
            <p className="text-xs text-text-secondary">
              How long can you train per session?
            </p>
            {[15, 20, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setData({ ...data, default_workout_minutes: mins })}
                className={`w-full p-4 border text-left transition-colors
                  ${data.default_workout_minutes === mins
                    ? "bg-green-primary/20 border-green-primary"
                    : "bg-bg-panel border-green-dark hover:bg-bg-panel-alt"
                  }`}
              >
                <p className="text-sm font-heading uppercase tracking-wider text-sand">
                  {mins} Minutes
                </p>
              </button>
            ))}
          </div>
        )}

        {/* STEP 6: Food preferences */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Food Preferences
            </h2>
            <p className="text-xs text-text-secondary">
              Sort foods into three lists. This controls your AI meal plans.
            </p>

            {/* Tab selector for the three lists */}
            <div className="flex border border-green-dark">
              {(["no_go", "maybe", "approved"] as const).map((list) => (
                <button
                  key={list}
                  onClick={() => setActiveFoodList(list)}
                  className={`flex-1 py-2 text-[0.65rem] font-mono uppercase tracking-wider transition-colors
                    ${activeFoodList === list
                      ? "bg-green-primary text-text-primary"
                      : "bg-bg-panel text-text-secondary"
                    }`}
                >
                  {list === "no_go" ? "NO GO" : list === "maybe" ? "MAYBE" : "APPROVED"}
                </button>
              ))}
            </div>

            {/* Description of the active list */}
            <p className="text-xs text-text-secondary">
              {activeFoodList === "no_go" && "Foods you absolutely will NOT eat. Never included in meals."}
              {activeFoodList === "maybe" && "Foods you might try. Occasionally suggested, clearly marked."}
              {activeFoodList === "approved" && "Foods you like. Prioritised in meal plans."}
            </p>

            {/* Add food input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFood()}
                className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                           focus:border-green-primary focus:outline-none text-sm"
                placeholder="Add a food..."
              />
              <Button onClick={addFood} className="px-4">
                ADD
              </Button>
            </div>

            {/* Food list */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {data.food_preferences[activeFoodList].map((food) => (
                <div
                  key={food}
                  className="flex items-center justify-between px-3 py-2 bg-bg-panel border border-green-dark/50"
                >
                  <span className="text-sm text-text-primary">{food}</span>
                  <button
                    onClick={() => removeFood(activeFoodList, food)}
                    className="text-danger text-xs font-mono hover:underline min-w-[44px] min-h-[44px]
                               flex items-center justify-center"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
              {data.food_preferences[activeFoodList].length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">
                  No foods added yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: Calorie target */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Calorie Target
            </h2>
            <p className="text-xs text-text-secondary">
              Daily calorie target for your meal plans. Adjust as needed.
            </p>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-text-primary">
                {data.calorie_target}
              </p>
              <p className="text-xs text-text-secondary font-mono">KCAL / DAY</p>
            </div>
            <input
              type="range"
              min={1200}
              max={4000}
              step={50}
              value={data.calorie_target}
              onChange={(e) => setData({ ...data, calorie_target: Number(e.target.value) })}
              className="w-full accent-[var(--green-primary)]"
            />
            <div className="flex justify-between text-xs font-mono text-text-secondary">
              <span>1200</span>
              <span>4000</span>
            </div>
          </div>
        )}

        {/* STEP 8: Notifications */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Notifications
            </h2>
            <p className="text-xs text-text-secondary">
              Choose which alerts you want. You can change these later.
            </p>
            {[
              { key: "morning_mission", label: "Morning mission reminder" },
              { key: "missed_workout", label: "Missed workout nudge" },
              { key: "water_reminder", label: "Water intake reminder" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 bg-bg-panel border border-green-dark cursor-pointer"
              >
                <span className="text-sm text-text-primary">{label}</span>
                <input
                  type="checkbox"
                  checked={data.notification_settings[key as keyof typeof data.notification_settings] as boolean}
                  onChange={(e) =>
                    setData({
                      ...data,
                      notification_settings: {
                        ...data.notification_settings,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-[var(--green-primary)]"
                />
              </label>
            ))}
          </div>
        )}

        {/* STEP 9: Unit preferences + Deploy */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
              Unit Preference
            </h2>
            <div className="flex border border-green-dark">
              {(["metric", "imperial"] as UnitPreference[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setData({ ...data, unit_preference: unit })}
                  className={`flex-1 py-3 text-sm font-heading uppercase tracking-wider transition-colors
                    ${data.unit_preference === unit
                      ? "bg-green-primary text-text-primary"
                      : "bg-bg-panel text-text-secondary"
                    }`}
                >
                  {unit === "metric" ? "METRIC (km, kg)" : "IMPERIAL (mi, lbs)"}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-bg-panel border border-green-dark p-4 space-y-2 mt-6">
              <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                Enlistment Summary
              </h3>
              <p className="text-xs text-text-secondary">Name: {data.name || "Not set"}</p>
              <p className="text-xs text-text-secondary">Level: {data.fitness_level}</p>
              <p className="text-xs text-text-secondary">Goals: {data.goals.join(", ") || "None"}</p>
              <p className="text-xs text-text-secondary">Workout time: {data.default_workout_minutes} min</p>
              <p className="text-xs text-text-secondary">Calories: {data.calorie_target} kcal/day</p>
              <p className="text-xs text-text-secondary">Units: {data.unit_preference}</p>
            </div>

            {error && <p className="text-danger text-sm font-mono">{error}</p>}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 py-4 border-t border-green-dark flex gap-3 safe-bottom">
        {step > 1 && (
          <Button variant="secondary" onClick={prevStep} className="flex-1">
            BACK
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={nextStep} fullWidth={step === 1} className={step > 1 ? "flex-1" : ""}>
            {step === 1 ? "SOUND OFF" : "MOVE OUT"}
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={loading || !data.name} className="flex-1">
            {loading ? "DEPLOYING..." : "REPORT FOR DUTY"}
          </Button>
        )}
      </div>
    </div>
  );
}
