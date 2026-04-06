"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/terminal-card";
import { TerminalButton } from "@/components/ui/terminal-button";

type AssignmentWithNames = {
  id: string;
  assassin_name: string;
  target_name: string;
  assassin_id: string;
  target_id: string;
};

export function AssignmentChain({
  assignments,
}: {
  assignments: AssignmentWithNames[];
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <TerminalCard title="Assignment Chain">
      {!revealed ? (
        <div className="text-center space-y-3 py-4">
          <div className="text-terminal-amber text-xs">
            CLASSIFIED — CHAIN DATA HIDDEN
          </div>
          <TerminalButton
            variant="warning"
            onClick={() => setRevealed(true)}
          >
            Reveal Chain
          </TerminalButton>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-terminal-dim text-[10px]">
              {assignments.length} ACTIVE ASSIGNMENTS
            </div>
            <TerminalButton
              variant="ghost"
              onClick={() => setRevealed(false)}
              className="text-[10px] px-2 py-0.5"
            >
              Hide
            </TerminalButton>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {assignments.map((a, idx) => (
              <div
                key={a.id}
                className="flex items-center gap-2 text-xs border-b border-terminal-dim/20 py-1"
              >
                <span className="text-terminal-dim w-6">{idx + 1}.</span>
                <span className="text-terminal-text flex-1 truncate">
                  {a.assassin_name}
                </span>
                <span className="text-terminal-red">→</span>
                <span className="text-terminal-red flex-1 truncate">
                  {a.target_name}
                </span>
              </div>
            ))}
          </div>

          {assignments.length === 0 && (
            <div className="text-terminal-dim text-xs text-center py-4">
              NO ACTIVE ASSIGNMENTS
            </div>
          )}
        </div>
      )}
    </TerminalCard>
  );
}
