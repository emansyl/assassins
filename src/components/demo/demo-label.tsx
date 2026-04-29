import type { ReactNode } from "react";

/**
 * Inline annotation shown above a section in demo mode.
 * Renders only its children when not in demo mode (no-op for real users).
 */
export function DemoLabel({
  active,
  title,
  description,
  children,
}: {
  active: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  if (!active) return <>{children}</>;

  return (
    <div className="space-y-2">
      <div className="border border-terminal-amber/30 bg-terminal-amber/5 p-2">
        <div className="text-terminal-amber text-[10px] tracking-widest font-bold">
          [ DEMO LABEL: {title.toUpperCase()} ]
        </div>
        <div className="text-terminal-dim text-[10px] mt-1">{description}</div>
      </div>
      {children}
    </div>
  );
}
