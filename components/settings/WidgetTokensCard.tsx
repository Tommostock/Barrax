/* ============================================
   WidgetTokensCard
   ----------------------------------------------
   Drop-in Settings section that lets the user mint,
   view, and revoke long-lived tokens used by the
   home-screen Scriptable widget (/api/widget/summary).

   The raw token is shown to the user ONCE, right
   after minting -- we only ever store its SHA-256
   hash in widget_tokens.token_hash. Losing the raw
   value means revoking and minting a new one.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Copy, Plus, Trash2, Check } from "lucide-react";

// Row shape we select from widget_tokens.
interface WidgetTokenRow {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// Shape returned from mintToken() -- the raw token is only
// ever held in memory, never re-read from the database.
interface MintedToken {
  id: string;
  raw: string;
  label: string;
}

// Generate a 32-byte (64-hex-char) random token using Web
// Crypto. Plenty of entropy, and the character set is safe
// to paste into a Scriptable constant.
function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// SHA-256 hex of a string, via Web Crypto. Matches the
// server-side hashToken() helper in the widget API route.
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Short "3d ago" / "2h ago" formatter for the last-used
// timestamp. Keeps the list tight on narrow screens.
function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function WidgetTokensCard() {
  const supabase = createClient();

  const [tokens, setTokens] = useState<WidgetTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [newLabel, setNewLabel] = useState("iPhone widget");
  const [justMinted, setJustMinted] = useState<MintedToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the user's existing tokens on mount.
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("widget_tokens")
        .select("id, label, created_at, last_used_at, revoked_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTokens((data as WidgetTokenRow[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Mint a new token. The raw value is shown to the user
  // exactly once; we persist only the SHA-256 hash.
  async function mintToken() {
    setMinting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const raw = generateRawToken();
      const tokenHash = await sha256Hex(raw);
      const label = newLabel.trim() || "Widget";

      const { data, error: insertErr } = await supabase
        .from("widget_tokens")
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          label,
        })
        .select("id, label, created_at, last_used_at, revoked_at")
        .single();

      if (insertErr || !data) {
        throw new Error(insertErr?.message ?? "Insert failed");
      }

      setTokens((prev) => [data as WidgetTokenRow, ...prev]);
      setJustMinted({ id: data.id, raw, label });
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mint token");
    } finally {
      setMinting(false);
    }
  }

  // Copy the freshly-minted raw token to the clipboard.
  async function copyToken() {
    if (!justMinted) return;
    try {
      await navigator.clipboard.writeText(justMinted.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard blocked. Long-press the token to copy manually.");
    }
  }

  // Soft-delete the token by stamping revoked_at. The row
  // stays so the list can still show it as revoked.
  async function revokeToken(id: string) {
    const confirmed = window.confirm(
      "Revoke this token? Any widget using it will stop refreshing.",
    );
    if (!confirmed) return;
    const { error: err } = await supabase
      .from("widget_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    setTokens((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, revoked_at: new Date().toISOString() } : t,
      ),
    );
    if (justMinted?.id === id) setJustMinted(null);
  }

  return (
    <Card tag="WIDGET TOKENS" tagVariant="active">
      <p className="text-[0.6rem] font-mono text-text-secondary mb-3 leading-snug">
        Mint a token to paste into the BARRAX home-screen widget
        (Scriptable on iOS). Each token gives read-only access to
        your daily summary. Revoke anytime.
      </p>

      {/* Mint controls */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. iPhone widget)"
          className="flex-1 px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
        />
        <Button onClick={mintToken} disabled={minting} className="px-4">
          <span className="flex items-center gap-1">
            <Plus size={14} />
            {minting ? "…" : "MINT"}
          </span>
        </Button>
      </div>

      {/* One-time reveal box for the raw token */}
      {justMinted && (
        <div className="mb-3 border border-xp-gold bg-bg-panel-alt p-3 space-y-2">
          <p className="text-[0.6rem] font-mono uppercase tracking-wider text-xp-gold">
            Copy now -- shown only once
          </p>
          <code className="block break-all text-[0.7rem] font-mono text-text-primary bg-bg-input p-2 border border-green-dark">
            {justMinted.raw}
          </code>
          <button
            onClick={copyToken}
            className="w-full flex items-center justify-center gap-2 py-2 bg-green-primary text-text-primary text-xs font-mono uppercase tracking-wider hover:bg-green-light transition-colors min-h-[44px]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED" : "COPY TOKEN"}
          </button>
        </div>
      )}

      {/* Existing tokens list */}
      {loading ? (
        <div className="skeleton h-16 w-full" />
      ) : tokens.length === 0 ? (
        <p className="text-[0.6rem] font-mono text-text-secondary text-center py-4">
          No tokens yet.
        </p>
      ) : (
        <div className="space-y-1">
          {tokens.map((t) => {
            const revoked = !!t.revoked_at;
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between px-3 py-2 border ${
                  revoked
                    ? "border-green-dark/40 bg-bg-panel/50 opacity-60"
                    : "border-green-dark bg-bg-panel"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {t.label}
                  </p>
                  <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
                    {revoked
                      ? `revoked ${timeAgo(t.revoked_at)}`
                      : `last used ${timeAgo(t.last_used_at)}`}
                  </p>
                </div>
                {!revoked && (
                  <button
                    onClick={() => revokeToken(t.id)}
                    aria-label="Revoke token"
                    className="text-danger min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs font-mono text-danger text-center">
          {error}
        </p>
      )}
    </Card>
  );
}
