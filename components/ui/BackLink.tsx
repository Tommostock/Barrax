/* ============================================
   BackLink
   Shared back-navigation button used on every
   sub-screen. Renders a left arrow + label in the
   tactical military style.

   Behaviour:
   - If the browser has history to go back to, use it
     (router.back()) so the user returns to the exact
     page they came from — even if that's not the
     "parent" route of the current page.
   - Otherwise (direct landing, fresh tab) fall back
     to the optional `href` so the user still ends up
     somewhere sensible.
   ============================================ */

"use client";

import { ArrowLeft } from "lucide-react";
import useBackNav from "@/hooks/useBackNav";

interface BackLinkProps {
  /** Fallback href used ONLY when there's no browser history to pop. */
  href?: string;
  /** The label text shown next to the arrow (rendered in uppercase). */
  label: string;
  className?: string;
}

export default function BackLink({ href, label, className = "" }: BackLinkProps) {
  const handleClick = useBackNav(href);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] ${className}`}
      aria-label={`Back to ${label}`}
    >
      <ArrowLeft size={18} />
      <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
    </button>
  );
}
