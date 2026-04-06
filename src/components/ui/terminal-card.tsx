import { type ReactNode } from "react";

export function TerminalCard({
  children,
  title,
  className = "",
  variant = "default",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  variant?: "default" | "danger" | "warning";
}) {
  const borderColor = {
    default: "border-terminal-dim",
    danger: "border-terminal-red/50",
    warning: "border-terminal-amber/50",
  }[variant];

  return (
    <div className={`border ${borderColor} bg-terminal-bg-light p-4 ${className}`}>
      {title && (
        <div className="text-terminal-green text-xs mb-3 uppercase tracking-widest">
          [{title}]
        </div>
      )}
      {children}
    </div>
  );
}
