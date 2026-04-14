/* ============================================
   BackLink
   Shared back-navigation button used on every
   sub-screen. Renders a left arrow + label in the
   tactical military style and pushes the given
   href (or calls router.back() if no href).

   Before this component existed, every screen had
   its own ad-hoc back button: some used [BACK], some
   used just an arrow, some used ArrowLeft + label.
   Standardising keeps the app feeling coherent.
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  /** Destination href. If omitted, calls router.back() instead. */
  href?: string;
  /** The label text shown next to the arrow (rendered in uppercase). */
  label: string;
  className?: string;
}

export default function BackLink({ href, label, className = "" }: BackLinkProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

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
