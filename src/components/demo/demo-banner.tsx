import Link from "next/link";

type NavLink = { href: string; label: string };

export function DemoBanner({
  navLinks,
}: {
  navLinks?: NavLink[];
}) {
  return (
    <div className="border border-terminal-amber/50 bg-terminal-amber/5 p-3 space-y-2">
      <div className="text-terminal-amber text-xs tracking-widest glow-amber font-bold">
        🛡 DEMO MODE — WELCOME, PROFESSOR
      </div>
      <div className="text-terminal-dim text-[10px]">
        You are viewing a read-only demo of the live game. Nothing you click here
        will affect real players or game state. Look for [ DEMO LABEL ] callouts
        explaining what each section does.
      </div>
      {navLinks && navLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 min-w-[40%] text-center border border-terminal-amber px-3 py-2 text-[10px] uppercase tracking-widest font-mono text-terminal-amber hover:bg-terminal-amber/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
