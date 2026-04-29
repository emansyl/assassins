"use client";

import { useState } from "react";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";

type Option = { id: string; full_name: string; isCorrect: boolean };

/**
 * Mock kill confirmation flow used in the demo dashboard.
 * Mimics the real KillConfirmation UX but never writes to the database.
 */
export function DemoKillConfirmation({
  targetName,
  options,
}: {
  targetName: string;
  options: Option[];
}) {
  const [phase, setPhase] = useState<"idle" | "challenge">("idle");
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(opt: Option) {
    setSelected(opt.id);
    if (opt.isCorrect) {
      alert(
        `DEMO MODE — Correct!\n\n` +
          `In live mode this would mark ${opt.full_name} as eliminated, ` +
          `credit you with a kill, and assign you their target.\n\n` +
          `🥄 The real game is unaffected.`
      );
    } else {
      alert(
        `DEMO MODE — Wrong guess.\n\n` +
          `In live mode this would cost you 1 of 3 attempts. ` +
          `After 3 wrong guesses you would be auto-eliminated.\n\n` +
          `Try clicking ${targetName} (the correct answer).`
      );
    }
  }

  if (phase === "idle") {
    return (
      <TerminalButton
        variant="danger"
        onClick={() => setPhase("challenge")}
        className="w-full py-3"
      >
        Confirm Elimination
      </TerminalButton>
    );
  }

  return (
    <TerminalCard title="Kill Confirmation" variant="danger">
      <div className="space-y-4">
        <div className="text-terminal-red text-xs text-center">
          CONFIRM ELIMINATION OF: {targetName.toUpperCase()}
        </div>

        <div className="text-[10px] text-center border border-terminal-amber/30 text-terminal-amber p-2">
          3 OF 3 ATTEMPTS REMAINING
        </div>

        <div className="text-terminal-amber text-xs text-center border border-terminal-amber/30 p-2">
          INTEL CHECK: WHO IS {targetName.toUpperCase()}&apos;S CURRENT TARGET?
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleClick(opt)}
              className={`
                w-full text-left px-4 py-3 border font-mono text-sm
                transition-all duration-150
                ${selected === opt.id
                  ? "border-terminal-amber text-terminal-amber bg-terminal-amber/10"
                  : "border-terminal-dim text-terminal-text hover:border-terminal-green hover:bg-terminal-green/5"
                }
              `}
            >
              {opt.full_name}
            </button>
          ))}
        </div>

        <TerminalButton
          variant="ghost"
          onClick={() => { setPhase("idle"); setSelected(null); }}
          className="w-full"
        >
          Abort
        </TerminalButton>
      </div>
    </TerminalCard>
  );
}
