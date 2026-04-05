/* ============================================
   Sign Up Page
   Email + password registration. After sign-up,
   the user is redirected to onboarding.
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Check passwords match before hitting the API
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Redirect to onboarding to complete profile setup
    router.push("/onboarding");
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg-primary">
      {/* Logo / Title */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-sand font-heading">
          BARRAX
        </h1>
        <p className="text-text-secondary text-sm mt-2 font-mono tracking-wide">
          ENLISTMENT FORM
        </p>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
        {/* Email */}
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
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                       focus:border-green-primary focus:outline-none transition-colors
                       font-body text-sm"
            placeholder="Minimum 6 characters"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                       focus:border-green-primary focus:outline-none transition-colors
                       font-body text-sm"
            placeholder="Repeat password"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-danger text-sm font-mono">{error}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-primary text-text-primary font-heading text-sm
                     uppercase tracking-widest font-bold
                     hover:bg-green-light active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-h-[44px]"
        >
          {loading ? "PROCESSING..." : "ENLIST"}
        </button>
      </form>

      {/* Link to sign in */}
      <p className="mt-6 text-text-secondary text-sm">
        Already enlisted?{" "}
        <Link
          href="/auth/sign-in"
          className="text-green-light hover:text-green-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
