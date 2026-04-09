/* ============================================
   Shopping List Page
   Auto-generated from the active meal plan.
   Organised by supermarket section with checkboxes.
   Persists checked state to Supabase.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";

interface ShoppingItem {
  name: string;
  quantity: string;
  section: string;
  checked: boolean;
}

// Display order for supermarket sections
const SECTION_ORDER = ["produce", "meat", "dairy", "pantry", "frozen"];
const SECTION_LABELS: Record<string, string> = {
  produce: "PRODUCE",
  meat: "MEAT & FISH",
  dairy: "DAIRY",
  pantry: "PANTRY",
  frozen: "FROZEN",
};

export default function ShoppingListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: plan } = await supabase
      .from("meal_plans")
      .select("id, shopping_list")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    if (plan) {
      setPlanId(plan.id);
      setItems((plan.shopping_list as ShoppingItem[]) || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadList(); }, [loadList]);

  // Toggle an item's checked state and persist to DB
  async function toggleItem(index: number) {
    const updated = [...items];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    setItems(updated);

    // Save to Supabase
    if (planId) {
      const { error } = await supabase
        .from("meal_plans")
        .update({ shopping_list: updated })
        .eq("id", planId);
      if (error) console.error("Failed to update shopping list:", error);
    }
  }

  // Count checked vs total
  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

  // Group items by section
  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const sectionItems = items
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter((item) => item.section === section);
    if (sectionItems.length > 0) acc[section] = sectionItems;
    return acc;
  }, {} as Record<string, (ShoppingItem & { originalIndex: number })[]>);

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/rations")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Rations</span>
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Supply Requisition</h2>
        <span className="text-xs font-mono text-text-secondary">{checkedCount}/{totalCount} ACQUIRED</span>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full h-2 bg-bg-panel-alt border border-green-dark">
          <div className="h-full bg-green-primary transition-all duration-300"
            style={{ width: `${(checkedCount / totalCount) * 100}%` }} />
        </div>
      )}

      {items.length === 0 ? (
        <Card tag="NO MANIFEST" tagVariant="default">
          <div className="text-center py-6">
            <ShoppingCart size={32} className="text-text-secondary mx-auto mb-3" />
            <p className="text-xs text-text-secondary">Build your meal arsenal first. Then you can requisition supplies.</p>
          </div>
        </Card>
      ) : (
        Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section}>
            <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">
              {SECTION_LABELS[section] || section}
            </h3>
            <div className="space-y-1">
              {sectionItems.map((item) => (
                <button
                  key={item.originalIndex}
                  onClick={() => toggleItem(item.originalIndex)}
                  className={`w-full flex items-center gap-3 px-3 py-3 bg-bg-panel border border-green-dark/50
                    text-left transition-colors min-h-[44px]
                    ${item.checked ? "opacity-50" : ""}`}
                >
                  <div className={`w-5 h-5 border flex items-center justify-center flex-shrink-0
                    ${item.checked ? "bg-green-primary border-green-primary" : "border-green-dark"}`}>
                    {item.checked && <Check size={14} className="text-text-primary" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${item.checked ? "line-through text-text-secondary" : "text-text-primary"}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary">{item.quantity}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
