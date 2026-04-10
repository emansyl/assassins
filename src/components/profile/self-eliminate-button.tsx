"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalButton } from "@/components/ui/terminal-button";
import { selfEliminate } from "@/app/(protected)/profile/actions";

export function SelfEliminateButton() {
  const [phase, setPhase] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleEliminate() {
    if (phase === "idle") {
      setPhase("confirm");
      return;
    }

    setPhase("loading");
    setError("");

    try {
      const result = await selfEliminate();

      if (result.success) {
        setPhase("done");
        setTimeout(() => router.refresh(), 2000);
      } else {
        setError(result.error || "Failed to self-eliminate");
        setPhase("idle");
      }
    } catch {
      setError("Network error — try again");
      setPhase("idle");
    }
  }

  if (phase === "done") {
    return (
      <div className="border border-terminal-amber/50 p-4 text-center space-y-2">
        <div className="text-terminal-amber text-sm font-bold">
          YOU HAVE BEEN DEACTIVATED
        </div>
        <div className="text-terminal-dim text-[10px]">
          Your sacrifice will be remembered.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {phase === "confirm" && (
        <div className="border border-terminal-red/50 bg-terminal-red/5 p-3 text-center space-y-1">
          <div className="text-terminal-red text-xs font-bold">
            THIS IS PERMANENT
          </div>
          <div className="text-terminal-dim text-[10px]">
            You will be removed from the game. No kill credit will be awarded to anyone.
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {phase === "confirm" && (
          <TerminalButton
            variant="ghost"
            onClick={() => setPhase("idle")}
            className="flex-1"
          >
            Cancel
          </TerminalButton>
        )}
        <TerminalButton
          variant="danger"
          onClick={handleEliminate}
          loading={phase === "loading"}
          className={phase === "confirm" ? "flex-1" : "w-full"}
        >
          {phase === "confirm" ? "CONFIRM — ELIMINATE MYSELF" : "DROP OUT OF GAME"}
        </TerminalButton>
      </div>

      {error && (
        <div className="text-terminal-red text-[10px] text-center">{error}</div>
      )}
    </div>
  );
}
