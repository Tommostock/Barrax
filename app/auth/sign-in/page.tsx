/* ============================================
   Sign In Page
   Email + password login. Redirects to dashboard
   on success, or to onboarding if profile incomplete.
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if the user has completed onboarding by looking for a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .single();

    if (profile?.name) {
      router.push("/");
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg-primary">
      {/* Logo / Title */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-sand font-heading">
          BARRAX
        </h1>
        <p className="text-text-secondary text-sm mt-2 font-mono tracking-wide">
          REPORT FOR DUTY
        </p>
      </div>

      {/* Sign In Form */}
      <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
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
            placeholder="Enter password"
          />
        </div>

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-text-secondary hover:text-green-light transition-colors font-mono"
          >
            Forgot password?
          </Link>
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
          {loading ? "AUTHENTICATING..." : "SIGN IN"}
        </button>
      </form>

      {/* Link to sign up */}
      <p className="mt-6 text-text-secondary text-sm">
        No account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-green-light hover:text-green-primary transition-colors"
        >
          Enlist here
        </Link>
      </p>
    </div>
  );
}
