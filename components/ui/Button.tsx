/* ============================================
   Button Component
   Three variants: primary (green), secondary (outline),
   danger (red). Sharp corners, 44px min touch target.
   ============================================ */

"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Base styles shared by all variants
  const base = `
    font-heading text-sm uppercase tracking-widest font-bold
    min-h-[44px] px-6 py-3
    transition-all active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
  `;

  // Variant-specific styles
  const variants = {
    primary: "bg-green-primary text-text-primary hover:bg-green-light",
    secondary:
      "bg-transparent text-green-light border border-green-dark hover:bg-bg-panel-alt",
    danger: "bg-danger text-text-primary hover:opacity-80",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
