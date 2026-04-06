"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

export const TerminalInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function TerminalInput({ label, error, className = "", ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-terminal-dim text-sm uppercase tracking-widest block">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 border border-terminal-dim bg-terminal-bg px-3 py-2 focus-within:border-terminal-green transition-colors">
        <span className="text-terminal-green text-sm">&gt;</span>
        <input
          ref={ref}
          className={`
            flex-1 bg-transparent text-terminal-text text-sm font-mono
            placeholder:text-terminal-dim/50
            outline-none
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-terminal-red text-xs">{error}</p>
      )}
    </div>
  );
});
