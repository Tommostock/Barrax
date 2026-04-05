/* ============================================
   Settings Page (BASE OPERATIONS)
   Edit profile, food preferences, notifications,
   units, and manage account data.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BottomSheet from "@/components/ui/BottomSheet";
import { ArrowLeft, Save, Trash2, Download, LogOut } from "lucide-react";
import Link from "next/link";
import type { Profile, FoodPreference } from "@/types";

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
      unit_preference: profile.unit_preference,
      notification_settings: profile.notification_settings,
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

  // Export data as JSON
  async function exportData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tables = ["profiles", "weight_logs", "workouts", "runs", "ranks", "streaks", "badges"];
    const exported: Record<string, unknown> = {};

    for (const table of tables) {
      const { data } = await supabase.from(table).select("*");
      exported[table] = data;
    }

    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barrax-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        <Link href="/record" className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
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
            <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">Calorie Target</label>
            <input
              type="number"
              value={profile.calorie_target ?? 2000}
              onChange={(e) => setProfile({ ...profile, calorie_target: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
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

      {/* Save button */}
      <Button onClick={saveProfile} disabled={saving} fullWidth>
        <span className="flex items-center justify-center gap-2">
          <Save size={16} />
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </span>
      </Button>
      {message && <p className="text-xs text-green-light font-mono text-center">{message}</p>}

      {/* Data management */}
      <Card tag="DATA" tagVariant="default">
        <div className="space-y-3">
          <button onClick={exportData} className="w-full flex items-center gap-3 p-3 bg-bg-panel-alt border border-green-dark hover:bg-bg-input transition-colors min-h-[44px]">
            <Download size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Export Data (JSON)</span>
          </button>
          <button onClick={() => setShowResetSheet(true)} className="w-full flex items-center gap-3 p-3 bg-bg-panel-alt border border-danger/50 hover:bg-danger/10 transition-colors min-h-[44px]">
            <Trash2 size={16} className="text-danger" />
            <span className="text-sm text-danger">Reset All Progress</span>
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 bg-bg-panel-alt border border-green-dark hover:bg-bg-input transition-colors min-h-[44px]">
            <LogOut size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Sign Out</span>
          </button>
        </div>
      </Card>

      {/* Reset confirmation sheet */}
      <BottomSheet isOpen={showResetSheet} onClose={() => setShowResetSheet(false)} title="Confirm Reset">
        <div className="space-y-4">
          <p className="text-sm text-text-primary">
            This will permanently delete all your progress, including XP, rank, streaks, badges, and workout history. This cannot be undone.
          </p>
          <Button variant="danger" fullWidth onClick={() => setShowResetSheet(false)}>
            CONFIRM RESET
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setShowResetSheet(false)}>
            CANCEL
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
