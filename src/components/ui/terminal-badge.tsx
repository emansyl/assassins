type Variant = "active" | "eliminated" | "warning" | "info";

export function TerminalBadge({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  const styles: Record<Variant, string> = {
    active: "text-terminal-green border-terminal-green/50 glow-green",
    eliminated: "text-terminal-red border-terminal-red/50 glow-red",
    warning: "text-terminal-amber border-terminal-amber/50 glow-amber",
    info: "text-terminal-muted border-terminal-dim",
  };

  return (
    <span
      className={`
        inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}
