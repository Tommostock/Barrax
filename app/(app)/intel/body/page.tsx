/* ============================================
   Body Tracking Page
   Log weight and body measurements over time.
   Displays trend with a simple chart.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/ui/PullToRefresh";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ArrowLeft, Plus, Scale, Camera, Trash2, ArrowLeftRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { WeightLog } from "@/types";

// NOTE: despite the column name, `photo_url` now stores the STORAGE
// PATH (e.g. "user-uuid/1713100000000.jpg") rather than a full URL.
// The bucket is private -- we generate short-lived signed URLs on
// load and render those. Keeping the column name avoids a migration.
//
// Legacy rows created before commit 2bdac32 may still contain a full
// public URL in this column. extractStoragePath() below normalises
// both formats so the viewer keeps working regardless.
interface ProgressPhoto { id: string; photo_url: string; note: string | null; taken_at: string; }

/** Return a storage object path from either a raw path or a legacy full URL. */
function extractStoragePath(value: string): string {
  if (!value) return "";
  // New format: stored as path e.g. "user-uuid/123.jpg"
  if (!value.startsWith("http")) return value;
  // Legacy format: full URL, may be public or signed, with optional
  // query string. Match everything after "/progress-photos/" up to "?".
  const match = value.match(/\/progress-photos\/([^?]+)/);
  return match ? match[1] : value;
}

export default function BodyTrackingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  // Map of photo.id -> freshly signed URL. Regenerated on every
  // loadData so expiries stay fresh while the page is open.
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<{ id: string; path: string } | null>(null);
  // Fullscreen photo viewer -- null when closed, else the currently
  // shown photo's index into the `photos` array so prev/next work.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(30);

    if (data) setWeightLogs(data as WeightLog[]);

    // Load progress photos (metadata only; actual images served via signed URL)
    const { data: photoData } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false });

    if (photoData) {
      const rows = photoData as ProgressPhoto[];
      setPhotos(rows);

      // Generate short-lived signed URLs in parallel for rendering.
      // Private bucket means the raw object is inaccessible without
      // a token -- only the owner (authenticated via RLS SELECT
      // policy) can mint a signed URL here.
      const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
      const entries = await Promise.all(
        rows.map(async (row) => {
          if (!row.photo_url) return [row.id, ""] as const;
          const path = extractStoragePath(row.photo_url);
          const { data: signed, error } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
          if (error) {
            console.error("[body] createSignedUrl failed", { path, error });
          }
          return [row.id, signed?.signedUrl ?? ""] as const;
        }),
      );
      setPhotoUrls(Object.fromEntries(entries));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Keyboard navigation for the fullscreen viewer.
  useEffect(() => {
    if (viewerIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewerIndex(null);
      else if (e.key === "ArrowLeft") {
        setViewerIndex((i) => (i === null || i <= 0 ? i : i - 1));
      } else if (e.key === "ArrowRight") {
        setViewerIndex((i) =>
          i === null || i >= photos.length - 1 ? i : i + 1,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerIndex, photos.length]);

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: loadData });

  async function logWeight() {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: weight,
    });

    if (error) {
      alert(`Failed to log weight: ${error.message}`);
      return;
    }

    const { awardXPAndNotify } = await import("@/lib/award-and-notify");
    await awardXPAndNotify(10, "weight_logged");

    setNewWeight("");
    setShowInput(false);
    loadData();
  }

  // Upload a progress photo via camera or file picker
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    try {
      // Upload to the private Supabase Storage bucket. Path shape
      // "{user_id}/{timestamp}.jpg" matches the storage RLS policy
      // that checks (storage.foldername(name))[1] = auth.uid().
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        alert(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Persist the STORAGE PATH (not a URL) so we can mint signed
      // URLs on demand. Signed URLs expire, paths don't.
      const { error: dbError } = await supabase.from("progress_photos").insert({
        user_id: user.id,
        photo_url: filePath,
      });

      if (dbError) {
        alert(`Failed to save photo: ${dbError.message}`);
        return;
      }

      await loadData();
    } finally {
      setUploading(false);
      // Reset the input so the same file can be selected again
      e.target.value = "";
    }
  }

  // Delete a progress photo from storage and database. `path` is the
  // stored photo_url column value -- we normalise it through
  // extractStoragePath in case it's a legacy full-URL row.
  async function deletePhoto(id: string, path: string) {
    const storagePath = extractStoragePath(path);
    if (storagePath) {
      await supabase.storage.from("progress-photos").remove([storagePath]);
    }
    const { error } = await supabase.from("progress_photos").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete photo: ${error.message}`);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPhotoUrls((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Close the viewer if the deleted photo was the one being shown.
    // If other photos remain, move the cursor to a sensible neighbour.
    setViewerIndex((prevIndex) => {
      if (prevIndex === null) return null;
      const remaining = photos.length - 1;
      if (remaining <= 0) return null;
      return Math.min(prevIndex, remaining - 1);
    });
  }

  const latestWeight = weightLogs[0]?.weight_kg;
  const previousWeight = weightLogs[1]?.weight_kg;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  const comparePhotoA = selectedForCompare.length === 2 ? photos.find(p => p.id === selectedForCompare[0]) : undefined;
  const comparePhotoB = selectedForCompare.length === 2 ? photos.find(p => p.id === selectedForCompare[1]) : undefined;

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <button onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Body Tracking</h2>
        <Button onClick={() => setShowInput(!showInput)} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1"><Plus size={14} /> LOG</span>
        </Button>
      </div>

      {/* Weight input */}
      {showInput && (
        <Card tag="LOG WEIGHT" tagVariant="active">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Weight in kg"
              className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
            />
            <Button onClick={logWeight} className="px-4">SAVE</Button>
          </div>
        </Card>
      )}

      {/* Current weight */}
      <div className="bg-bg-panel border border-green-dark p-4 text-center">
        <Scale size={24} className="text-green-primary mx-auto mb-2" />
        <p className="text-3xl font-bold font-mono text-text-primary">
          {latestWeight ? `${latestWeight} kg` : "-- kg"}
        </p>
        {weightChange !== null && (
          <p className={`text-sm font-mono mt-1 ${weightChange < 0 ? "text-green-light" : weightChange > 0 ? "text-danger" : "text-text-secondary"}`}>
            {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
          </p>
        )}
        <p className="text-[0.6rem] font-mono text-text-secondary mt-1">CURRENT WEIGHT</p>
      </div>

      {/* Weight trend chart */}
      {weightLogs.length >= 2 && (
        <div className="bg-bg-panel border border-green-dark p-4">
          <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-3">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={[...weightLogs].reverse().map((log) => ({
              date: new Date(log.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              weight: log.weight_kg,
            }))}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7A7A6E" }} axisLine={{ stroke: "#2D4220" }} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#7A7A6E" }} axisLine={{ stroke: "#2D4220" }} tickLine={false} width={35} />
              <Tooltip contentStyle={{ backgroundColor: "#141A14", border: "1px solid #2D4220", fontSize: 12 }} labelStyle={{ color: "#C4B090" }} />
              <Line type="monotone" dataKey="weight" stroke="#4A6B3A" strokeWidth={2} dot={{ fill: "#4A6B3A", r: 3 }} activeDot={{ fill: "#6B8F5A", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Progress photos */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">Progress Photos</h3>
        <div className="flex items-center gap-2">
          {photos.length >= 2 && (
            <button onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
              className={`flex items-center gap-1 text-[0.6rem] font-mono uppercase px-2 py-1 border transition-colors min-h-[32px]
                ${compareMode ? "border-green-primary text-green-light" : "border-green-dark text-text-secondary"}`}>
              <ArrowLeftRight size={12} /> {compareMode ? "DONE" : "COMPARE"}
            </button>
          )}
          <label className={`flex items-center gap-1 text-[0.6rem] font-mono uppercase px-2 py-1 border border-green-dark text-text-secondary cursor-pointer hover:text-green-light min-h-[32px] ${uploading ? "opacity-50" : ""}`}>
            <Camera size={12} /> {uploading ? "UPLOADING..." : "ADD PHOTO"}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Compare mode: select two photos */}
      {compareMode && (
        <>
          {selectedForCompare.length < 2 ? (
            <p className="text-[0.6rem] font-mono text-green-light uppercase text-center">
              Select {2 - selectedForCompare.length} photo{selectedForCompare.length === 0 ? "s" : ""} to compare
            </p>
          ) : comparePhotoA && comparePhotoB ? (
            <div className="bg-bg-panel border border-green-dark p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[0.55rem] font-mono text-text-secondary uppercase flex-1 text-center">
                  {new Date(comparePhotoA.taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                </span>
                <span className="text-[0.55rem] font-mono text-text-secondary uppercase flex-1 text-center">
                  {new Date(comparePhotoB.taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrls[comparePhotoA.id] ?? ""} alt="Photo A" className="w-full aspect-[3/4] object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrls[comparePhotoB.id] ?? ""} alt="Photo B" className="w-full aspect-[3/4] object-cover" />
              </div>
              <button
                onClick={() => setSelectedForCompare([])}
                className="w-full mt-2 text-[0.55rem] font-mono text-text-secondary uppercase py-1 border border-green-dark hover:text-green-light transition-colors"
              >
                Change Selection
              </button>
            </div>
          ) : null}

          {/* Selectable photo grid */}
          <div className="grid grid-cols-3 gap-1">
            {photos.map((photo) => {
              const selIndex = selectedForCompare.indexOf(photo.id);
              const isSelected = selIndex !== -1;
              const isDisabled = !isSelected && selectedForCompare.length >= 2;
              return (
                <button
                  key={photo.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedForCompare(prev => prev.filter(id => id !== photo.id));
                    } else if (!isDisabled) {
                      setSelectedForCompare(prev => [...prev, photo.id]);
                    }
                  }}
                  className={`relative text-left ${isDisabled ? "opacity-40" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrls[photo.id] ?? ""} alt="Progress" className={`w-full aspect-square object-cover border ${isSelected ? "border-green-primary" : "border-green-dark/30"}`} />
                  {isSelected && (
                    <div className="absolute top-1 left-1 w-5 h-5 bg-green-primary flex items-center justify-center">
                      <span className="text-[0.6rem] font-mono font-bold text-black">{selIndex + 1}</span>
                    </div>
                  )}
                  <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-[0.45rem] font-mono text-text-secondary text-center py-0.5">
                    {new Date(photo.taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Photo grid (normal mode) -- tap a thumbnail to open the
          fullscreen viewer where delete + prev/next live. */}
      {photos.length === 0 ? (
        <Card><p className="text-xs text-text-secondary text-center py-4">No photos yet. Tap ADD PHOTO to capture your first progress shot.</p></Card>
      ) : !compareMode && (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewerIndex(index)}
              className="relative group text-left"
              aria-label={`View progress photo from ${new Date(photo.taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrls[photo.id] ?? ""} alt="Progress" className="w-full aspect-square object-cover border border-green-dark/30" />
              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-[0.45rem] font-mono text-text-secondary text-center py-0.5">
                {new Date(photo.taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen photo viewer -- z-[200] puts it above the
          fixed bottom nav (z-50) so the delete button is tappable. */}
      {viewerIndex !== null && photos[viewerIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={() => setViewerIndex(null)}
        >
          {/* Top bar: date + close -- add the safe-area inset ON TOP
              of the baseline padding so the notch/dynamic island
              can't overlap the close button on iPhone. */}
          <div
            className="flex items-center justify-between px-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "16px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              {new Date(photos[viewerIndex].taken_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {` · ${viewerIndex + 1} / ${photos.length}`}
            </p>
            <button
              type="button"
              onClick={() => setViewerIndex(null)}
              aria-label="Close viewer"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sand hover:text-green-light"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image area with prev/next arrows on either side */}
          <div
            className="flex-1 flex items-center justify-center px-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {viewerIndex > 0 && (
              <button
                type="button"
                onClick={() => setViewerIndex(viewerIndex - 1)}
                aria-label="Previous photo"
                className="absolute left-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/50 text-sand hover:text-green-light z-10"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrls[photos[viewerIndex].id] ?? ""}
              alt="Progress"
              className="max-w-full max-h-full object-contain"
            />

            {viewerIndex < photos.length - 1 && (
              <button
                type="button"
                onClick={() => setViewerIndex(viewerIndex + 1)}
                aria-label="Next photo"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/50 text-sand hover:text-green-light z-10"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Bottom bar: delete -- add the safe-area inset ON TOP of
              the baseline padding so the home indicator can't sit
              underneath the delete button on iPhone. */}
          <div
            className="flex items-center justify-center px-4"
            style={{ paddingTop: "16px", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const photo = photos[viewerIndex];
                setDeletePhotoTarget({ id: photo.id, path: photo.photo_url });
              }}
              className="flex items-center gap-2 px-4 py-3 border border-danger text-danger hover:bg-danger/10 font-mono text-xs uppercase tracking-wider min-h-[44px]"
            >
              <Trash2 size={14} /> Delete Photo
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletePhotoTarget !== null}
        title="DELETE PHOTO"
        message="Remove this progress photo?"
        confirmLabel="DELETE"
        onConfirm={() => {
          if (deletePhotoTarget) deletePhoto(deletePhotoTarget.id, deletePhotoTarget.path);
          setDeletePhotoTarget(null);
        }}
        onCancel={() => setDeletePhotoTarget(null)}
      />

      {/* Weight history */}
      <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">History</h3>
      {weightLogs.length === 0 ? (
        <Card><p className="text-xs text-text-secondary text-center py-4">No weight entries yet. Log your first weight above.</p></Card>
      ) : (
        <div className="space-y-1">
          {weightLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-bg-panel border border-green-dark/50">
              <span className="text-xs font-mono text-text-secondary">
                {new Date(log.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <span className="text-sm font-mono font-bold text-text-primary">{log.weight_kg} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
