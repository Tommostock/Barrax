/* ============================================
   Forgot Password Page
   Collects the user's email and sends a password
   reset link via Supabase Auth.
   ============================================ */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Send the reset email — Supabase handles the token and link.
    // The redirectTo URL is where the user lands after clicking the
    // link in the email. The callback route exchanges the code for
    // a session and then redirects to /auth/reset-password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg-primary">
      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-sand font-heading">
          BARRAX
        </h1>
        <p className="text-text-secondary text-sm mt-2 font-mono tracking-wide">
          PASSWORD RECOVERY
        </p>
      </div>

      {sent ? (
        /* Confirmation message after email is sent */
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="border border-green-dark bg-bg-panel p-6">
            <p className="text-sm text-text-primary mb-2">
              Reset link sent.
            </p>
            <p className="text-xs text-text-secondary">
              Check your email for a password reset link. It may take a minute to arrive.
            </p>
          </div>
          <Link
            href="/auth/sign-in"
            className="text-green-light hover:text-green-primary transition-colors text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        /* Email form */
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <p className="text-xs text-text-secondary font-mono text-center mb-2">
            Enter your email and we will send a reset link.
          </p>

          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                         focus:border-green-primary focus:outline-none transition-colors
                         font-body text-sm"
              placeholder="operative@example.com"
              autoFocus
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
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>

          <p className="text-text-secondary text-sm text-center">
            <Link
              href="/auth/sign-in"
              className="text-green-light hover:text-green-primary transition-colors"
            >
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
