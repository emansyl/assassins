"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

// Replace non-space chars with block char for redacted text
function censor(text: string): string {
  return text.replace(/\S/g, "█");
}

export function TargetDossier({ target, spoonCollected }: { target: Player | null; spoonCollected: boolean }) {
  const [revealed, setRevealed] = useState(false);

  if (!target) {
    return (
      <TerminalCard title="Current Assignment">
        <div className="text-center py-8">
          <div className="text-terminal-amber text-sm glow-amber">
            STAND BY FOR ASSIGNMENT
          </div>
          <div className="text-terminal-dim text-xs mt-2">
            Awaiting orders from Command
          </div>
        </div>
      </TerminalCard>
    );
  }

  return (
    <TerminalCard title="Target Dossier" variant="danger">
      <div className="space-y-4">
        {/* Target photo */}
        <div className="flex justify-center">
          {target.photo_url ? (
            <img
              src={target.photo_url}
              alt="Target"
              className={`w-24 h-24 object-cover border border-terminal-red/50 grayscale transition-all duration-300 ${
                revealed ? "" : "blur-2xl"
              }`}
            />
          ) : (
            <div className="w-24 h-24 border border-terminal-dim flex items-center justify-center">
              <span className="text-terminal-dim text-3xl">?</span>
            </div>
          )}
        </div>

        {/* Target info */}
        <div className="text-center space-y-2">
          <div
            className="text-terminal-red text-lg font-bold glow-red font-mono select-none"
            aria-label={revealed ? target.full_name : "Target name redacted"}
          >
            {revealed ? target.full_name : censor(target.full_name)}
          </div>
          {target.nickname && (
            <div className="text-terminal-muted text-xs font-mono select-none">
              AKA &quot;{revealed ? target.nickname : censor(target.nickname)}&quot;
            </div>
          )}
        </div>

        {/* Reveal / Hide button */}
        <button
          onClick={() => setRevealed((r) => !r)}
          className="w-full border border-terminal-red/50 px-4 py-2 text-xs uppercase tracking-widest font-mono text-terminal-red hover:bg-terminal-red/10 transition-colors"
        >
          {revealed ? "[ HIDE TARGET ]" : "[ TAP TO REVEAL TARGET ]"}
        </button>

        {/* Dossier details */}
        <div className="border-t border-terminal-dim pt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">STATUS:</span>
            <span className="text-terminal-green">ACTIVE</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">SPOON:</span>
            <span className={spoonCollected ? "text-terminal-green" : "text-terminal-amber"}>
              {spoonCollected ? "COLLECTED" : "NOT COLLECTED"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">CLASSIFICATION:</span>
            <span className={spoonCollected ? "text-terminal-amber" : "text-terminal-dim"}>
              {spoonCollected ? "ELIMINATE ON SIGHT" : "NOT YET ELIGIBLE"}
            </span>
          </div>
        </div>
      </div>
    </TerminalCard>
  );
}
