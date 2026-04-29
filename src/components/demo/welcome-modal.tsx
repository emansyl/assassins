"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TerminalButton } from "@/components/ui/terminal-button";

const STORAGE_KEY = "demo_welcomed";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-terminal-bg/95 flex items-center justify-center p-4">
      <div className="border border-terminal-amber bg-terminal-bg-light max-w-md w-full p-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-terminal-amber text-sm tracking-widest glow-amber font-bold">
            🛡 WELCOME TO THE DEMO
          </div>
          <div className="text-terminal-dim text-[10px]">
            HBS SECTION E ASSASSINS — READ-ONLY TOUR
          </div>
        </div>

        <div className="border-t border-terminal-dim pt-4 space-y-4 text-xs">
          <div className="space-y-1">
            <div className="text-terminal-green tracking-widest text-[10px]">
              1. PLAYER DASHBOARD
            </div>
            <div className="text-terminal-text">
              You&apos;re looking at a sample dashboard right now. Active players see their
              target&apos;s photo and name (blurred until they tap reveal), and confirm
              kills via a multiple-choice quiz to prevent fake kills.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-terminal-green tracking-widest text-[10px]">
              2. LEADERBOARD &amp; FEED
            </div>
            <div className="text-terminal-text">
              The bottom nav lets you jump to live rankings (KILLS &amp; NOTORIETY tabs)
              and a real-time feed of recent eliminations with funny messages.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-terminal-green tracking-widest text-[10px]">
              3. ADMIN CONSOLE
            </div>
            <div className="text-terminal-text">
              Visit <span className="text-terminal-amber">/admin</span> to see the game
              master&apos;s control panel — game state, player management, and assignment
              shuffling. All controls are disabled for you, so you can browse safely.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-terminal-amber tracking-widest text-[10px]">
              🎬 RECOMMENDED START: HOW IT WORKS
            </div>
            <div className="text-terminal-text">
              For an interactive walkthrough of the core game mechanic — the circular
              hunt chain — visit{" "}
              <Link
                href="/demo/how-it-works"
                onClick={dismiss}
                className="text-terminal-amber underline"
              >
                /demo/how-it-works
              </Link>
              . Real player photos, animated kill simulation, and architecture notes.
            </div>
          </div>
        </div>

        <div className="text-terminal-dim text-[10px] border-t border-terminal-dim pt-3 italic">
          Look for [ DEMO LABEL ] callouts explaining each piece of the UI.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/demo/how-it-works"
            onClick={dismiss}
            className="block text-center border border-terminal-amber px-4 py-2 text-xs uppercase tracking-widest font-mono text-terminal-amber hover:bg-terminal-amber/10 transition-colors"
          >
            🎬 HOW IT WORKS
          </Link>
          <TerminalButton onClick={dismiss} className="w-full">
            GOT IT
          </TerminalButton>
        </div>
      </div>
    </div>
  );
}
