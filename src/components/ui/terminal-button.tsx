"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "warning" | "ghost";

export function TerminalButton({
  children,
  variant = "primary",
  className = "",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  const styles: Record<Variant, string> = {
    primary:
      "border-terminal-green text-terminal-green hover:bg-terminal-green/10 hover:border-glow-green",
    danger:
      "border-terminal-red text-terminal-red hover:bg-terminal-red/10",
    warning:
      "border-terminal-amber text-terminal-amber hover:bg-terminal-amber/10",
    ghost:
      "border-terminal-dim text-terminal-muted hover:text-terminal-text hover:border-terminal-muted",
  };

  return (
    <button
      className={`
        border px-4 py-2 text-xs uppercase tracking-widest font-mono
        transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        ${styles[variant]}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-cursor-blink">PROCESSING...</span>
      ) : (
        children
      )}
    </button>
  );
}
