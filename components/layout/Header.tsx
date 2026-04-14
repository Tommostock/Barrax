/* ============================================
   Header Component
   Top bar with BARRAX title, rank title, date,
   and contextual info based on current page.
   Settings cog navigates to Base Operations.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Settings } from "lucide-react";
import { RANK_THRESHOLDS } from "@/types";
import { formatDateMono } from "@/lib/format/date";
import OfflineIndicator from "./OfflineIndicator";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [rankTitle, setRankTitle] = useState<string | null>(null);

  const formattedDate = formatDateMono(new Date());

  // Fetch rank title once on mount
  useEffect(() => {
    async function loadRank() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("ranks")
        .select("current_rank")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const info = RANK_THRESHOLDS[data.current_rank - 1];
        if (info) setRankTitle(info.title.toUpperCase());
      }
    }
    loadRank();
  }, [supabase]);

  // Contextual subtitle based on current page
  function getSubtitle(): string {
    if (pathname.startsWith("/rations")) return "FUEL UP";
    if (pathname.startsWith("/missions")) return "ASSAULT";
    if (pathname.startsWith("/intel")) return "DEBRIEF";
    if (pathname.startsWith("/record")) return "REPORTS";
    return formattedDate;
  }

  const subtitle = getSubtitle();

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-sm border-b border-green-dark safe-top scan-line-header relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Title and contextual info */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-[0.2em] text-sand font-heading">
              BARRAX
            </h1>
            {rankTitle && (
              <span className="text-[0.5rem] font-mono text-green-primary border border-green-dark px-1.5 py-0.5 tracking-wider">
                {rankTitle}
              </span>
            )}
          </div>
          <p className="text-[0.65rem] text-text-secondary font-mono tracking-wider">
            {subtitle === formattedDate ? formattedDate : `${subtitle} // ${formattedDate}`}
          </p>
        </div>

        {/* Right side: offline indicator + settings cog */}
        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <button
            onClick={() => router.push("/intel/settings")}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center
                       text-text-secondary hover:text-green-light transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
