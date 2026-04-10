"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "MISSION", icon: ">" },
  { href: "/leaderboard", label: "RANKS", icon: "#" },
  { href: "/profile", label: "PROFILE", icon: "@" },
  { href: "/feed", label: "FEED", icon: "!" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-terminal-dim bg-terminal-bg/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] uppercase tracking-wider
                transition-colors
                ${isActive
                  ? "text-terminal-green glow-green"
                  : "text-terminal-muted hover:text-terminal-text"
                }
              `}
            >
              <span className="text-base font-bold">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
