/* ============================================
   Personal Records Page
   Shows all-time bests across different categories.
   Records are tracked automatically and shown here.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { ArrowLeft, Trophy, Calendar } from "lucide-react";
import type { PersonalRecord } from "@/types";

export default function PersonalRecordsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (data) setRecords(data as PersonalRecord[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // All possible record categories
  const categories = [
    { key: "most_xp_week", label: "Most XP in a Week", icon: "XP" },
    { key: "fastest_1km", label: "Fastest 1km", icon: "sec/km" },
    { key: "fastest_5km", label: "Fastest 5km (Pace)", icon: "sec/km" },
    { key: "longest_run", label: "Longest Run", icon: "km" },
    // Challenge Run total-time PRs (new, populated by challenge runs)
    { key: "fastest_1mi", label: "Fastest 1 Mile", icon: "sec" },
    { key: "fastest_2p4km", label: "Fastest 2.4 km", icon: "sec" },
    { key: "fastest_1500m", label: "Fastest 1.5 Mile (PFT)", icon: "sec" },
    { key: "fastest_5km_total", label: "Fastest 5 km (Total)", icon: "sec" },
    { key: "fastest_10km", label: "Fastest 10 km", icon: "sec" },
    { key: "most_pushups", label: "Most Push-Ups", icon: "reps" },
    { key: "longest_plank", label: "Longest Plank", icon: "sec" },
    { key: "longest_workout", label: "Longest Workout", icon: "min" },
  ];

  if (loading) {
    return <div className="px-4 py-4 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}</div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Personal Records</h2>

      <div className="space-y-2">
        {categories.map((cat) => {
          const record = records.find((r) => r.category === cat.key);

          return (
            <Card key={cat.key} className={record ? "" : "opacity-50"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy size={18} className={record ? "text-xp-gold" : "text-text-secondary"} />
                  <div>
                    <p className="text-sm font-heading uppercase tracking-wider text-sand">{cat.label}</p>
                    {record && (
                      <p className="text-[0.6rem] font-mono text-text-secondary flex items-center gap-1 mt-1">
                        <Calendar size={10} />
                        {new Date(record.achieved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {record ? (
                    <p className="text-lg font-bold font-mono text-xp-gold">
                      {record.value} {record.unit}
                    </p>
                  ) : (
                    <Tag variant="locked">NO RECORD</Tag>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
