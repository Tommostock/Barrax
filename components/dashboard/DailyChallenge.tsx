/* ============================================
   DailyChallenge Component
   Shows today's bonus challenge with XP reward.
   Fetches or generates a daily challenge.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import { Trophy, Zap, Check } from "lucide-react";

interface ChallengeData {
  title: string;
  description: string;
  target: number;
  unit: string;
  type: string;
  xp: number;
}

export default function DailyChallenge() {
  const supabase = createClient();

  const [challenge, setChallenge] = useState<{
    id: string;
    challenge_data: ChallengeData;
    accepted: boolean;
    completed: boolean;
    xp_value: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(1);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get rank to check if challenges are unlocked (rank 2+)
      const { data: rank } = await supabase
        .from("ranks").select("current_rank").eq("user_id", user.id).single();
      setUserRank(rank?.current_rank ?? 1);

      // Get today's challenge
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (existing) {
        setChallenge(existing as typeof challenge);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Generate today's challenge
  async function generateChallenge() {
    const response = await fetch("/api/generate-challenge", { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setChallenge(data.challenge);
    }
  }

  // Accept the challenge
  async function acceptChallenge() {
    if (!challenge) return;
    await supabase
      .from("daily_challenges")
      .update({ accepted: true })
      .eq("id", challenge.id);
    setChallenge({ ...challenge, accepted: true });
  }

  // Mark challenge as complete
  async function completeChallenge() {
    if (!challenge) return;
    await supabase
      .from("daily_challenges")
      .update({ completed: true })
      .eq("id", challenge.id);

    // Award XP
    await fetch("/api/award-xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: challenge.xp_value, source: "daily_challenge" }),
    });

    setChallenge({ ...challenge, completed: true });
  }

  if (loading) return <div className="skeleton h-24 w-full" />;

  // Challenges unlock at rank 2
  if (userRank < 2) {
    return (
      <Card tag="CHALLENGE" tagVariant="gold">
        <div className="flex items-start gap-3">
          <Trophy size={20} className="text-text-secondary mt-1" />
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Daily Gauntlet</h3>
            <p className="text-xs text-text-secondary mt-1">Unlock at Rank 2 (Private). Prove yourself first.</p>
          </div>
        </div>
      </Card>
    );
  }

  // No challenge yet — offer to generate one
  if (!challenge) {
    return (
      <Card tag="GAUNTLET" tagVariant="gold">
        <div className="flex items-start gap-3">
          <Trophy size={20} className="text-xp-gold mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Gauntlet</h3>
            <p className="text-xs text-text-secondary mt-1">Face a bonus challenge. Extra XP for the brave.</p>
            <Button onClick={generateChallenge} className="mt-2 text-xs px-3 py-2">
              TAKE THE CHALLENGE
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const cd = challenge.challenge_data;

  return (
    <Card
      tag={challenge.completed ? "COMPLETE" : challenge.accepted ? "ACCEPTED" : "CHALLENGE"}
      tagVariant={challenge.completed ? "complete" : "gold"}
    >
      <div className="flex items-start gap-3">
        <Trophy size={20} className={challenge.completed ? "text-green-light mt-1" : "text-xp-gold mt-1"} />
        <div className="flex-1">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">{cd.title}</h3>
          <p className="text-xs text-text-secondary mt-1">{cd.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Tag variant="gold">{`+${challenge.xp_value} XP`}</Tag>
          </div>

          {/* Action buttons */}
          {!challenge.accepted && !challenge.completed && (
            <Button onClick={acceptChallenge} className="mt-2 text-xs px-3 py-2">
              I ACCEPT
            </Button>
          )}
          {challenge.accepted && !challenge.completed && (
            <Button onClick={completeChallenge} className="mt-2 text-xs px-3 py-2">
              <span className="flex items-center gap-1"><Check size={14} /> DONE. VERIFIED.</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
