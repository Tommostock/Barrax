/* ============================================
   Reset Password Page
   The user lands here after clicking the reset
   link in their email. They already have a valid
   session (set by the callback route), so we just
   need to collect the new password and call
   supabase.auth.updateUser().
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate minimum length
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Update the password — the user already has a valid session
    // from clicking the email link (handled by the callback route)
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg-primary">
      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-sand font-heading">
          BARRAX
        </h1>
        <p className="text-text-secondary text-sm mt-2 font-mono tracking-wide">
          SET NEW PASSWORD
        </p>
      </div>

      {success ? (
        /* Success message */
        <div className="w-full max-w-sm text-center">
          <div className="border border-green-primary bg-bg-panel p-6">
            <p className="text-sm text-green-light mb-2">
              Password locked in, soldier.
            </p>
            <p className="text-xs text-text-secondary">
              Return to duty, NOW.
            </p>
          </div>
        </div>
      ) : (
        /* New password form */
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                         focus:border-green-primary focus:outline-none transition-colors
                         font-body text-sm"
              placeholder="Minimum 6 characters"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono"
            >
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                         focus:border-green-primary focus:outline-none transition-colors
                         font-body text-sm"
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <p className="text-danger text-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-primary text-text-primary font-heading text-sm
                       uppercase tracking-widest font-bold
                       hover:bg-green-light active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       min-h-[44px]"
          >
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
      )}
    </div>
  );
}
