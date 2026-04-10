"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import { verifyKillAnswer } from "@/app/(protected)/dashboard/actions";
import type { Player } from "@/types";

type VerificationOption = { id: string; full_name: string };

export function KillConfirmation({
  target,
  assassinId,
  verificationOptions,
  wrongGuesses,
}: {
  target: Player;
  assassinId: string;
  verificationOptions: VerificationOption[];
  wrongGuesses: number;
}) {
  const [phase, setPhase] = useState<"idle" | "challenge" | "loading" | "success" | "error" | "eliminated">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(3 - wrongGuesses);
  const router = useRouter();

  async function handleSubmit(playerId: string) {
    setSelectedId(playerId);
    setPhase("loading");
    setErrorMsg("");

    const result = await verifyKillAnswer(assassinId, target.id, playerId);

    if (result.success) {
      setPhase("success");
      setTimeout(() => router.refresh(), 2000);
    } else if (result.eliminated) {
      setPhase("eliminated");
      setErrorMsg(result.error || "DEACTIVATED");
      setTimeout(() => router.refresh(), 3000);
    } else {
      setPhase("error");
      setErrorMsg(result.error || "VERIFICATION FAILED");
      if (result.attemptsRemaining !== undefined) {
        setAttemptsRemaining(result.attemptsRemaining);
      }
    }
  }

  // Eliminated state
  if (phase === "eliminated") {
    return (
      <TerminalCard title="CRITICAL FAILURE" variant="danger">
        <div className="text-center py-6 space-y-3">
          <div className="text-terminal-red text-lg glow-red">
            YOU HAVE BEEN DEACTIVATED
          </div>
          <div className="text-terminal-red text-xs">
            3 FAILED INTEL CHECKS — AUTO-ELIMINATION TRIGGERED
          </div>
        </div>
      </TerminalCard>
    );
  }

  // Success state
  if (phase === "success") {
    return (
      <TerminalCard title="Confirmation" variant="danger">
        <div className="text-center py-6 space-y-2">
          <div className="text-terminal-red text-lg glow-red">
            TARGET NEUTRALIZED
          </div>
          <div className="text-terminal-dim text-xs">
            NEW ASSIGNMENT INCOMING...
          </div>
        </div>
      </TerminalCard>
    );
  }

  // Idle state
  if (phase === "idle") {
    return (
      <div className="space-y-2">
        <TerminalButton
          variant="danger"
          onClick={() => setPhase("challenge")}
          className="w-full py-3"
        >
          Confirm Elimination
        </TerminalButton>
        {attemptsRemaining < 3 && (
          <div className="text-terminal-red text-[10px] text-center animate-pulse">
            WARNING: {attemptsRemaining} ATTEMPT{attemptsRemaining === 1 ? "" : "S"} REMAINING — NEXT FAILURE MAY BE FATAL
          </div>
        )}
      </div>
    );
  }

  // Challenge / loading / error states
  return (
    <TerminalCard title="Kill Confirmation" variant="danger">
      <div className="space-y-4">
        <div className="text-terminal-red text-xs text-center">
          CONFIRM ELIMINATION OF: {target.full_name.toUpperCase()}
        </div>

        {/* Attempts warning */}
        <div className={`text-[10px] text-center border p-2 ${
          attemptsRemaining <= 1
            ? "text-terminal-red border-terminal-red/50 bg-terminal-red/5"
            : "text-terminal-amber border-terminal-amber/30"
        }`}>
          {attemptsRemaining} OF 3 ATTEMPTS REMAINING
          {attemptsRemaining <= 1 && " — NEXT WRONG ANSWER = AUTO-ELIMINATION"}
        </div>

        {verificationOptions.length < 2 ? (
          // Endgame: too few players for a meaningful quiz
          <div className="space-y-3">
            <div className="text-terminal-amber text-xs text-center border border-terminal-amber/30 p-2">
              FINAL ELIMINATION — CONFIRM TO END OPERATIONS
            </div>
            <TerminalButton
              variant="danger"
              onClick={() => handleSubmit(verificationOptions[0]?.id ?? "")}
              loading={phase === "loading"}
              className="w-full"
            >
              Confirm Final Kill
            </TerminalButton>
          </div>
        ) : (
          <>
            <div className="text-terminal-amber text-xs text-center border border-terminal-amber/30 p-2">
              INTEL CHECK: WHO IS {target.full_name.toUpperCase()}&apos;S CURRENT TARGET?
            </div>

            <div className="space-y-2">
              {verificationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSubmit(option.id)}
                  disabled={phase === "loading"}
                  className={`
                    w-full text-left px-4 py-3 border font-mono text-sm
                    transition-all duration-150
                    ${selectedId === option.id && phase === "loading"
                      ? "border-terminal-amber text-terminal-amber bg-terminal-amber/10"
                      : selectedId === option.id && phase === "error"
                      ? "border-terminal-red text-terminal-red bg-terminal-red/10"
                      : "border-terminal-dim text-terminal-text hover:border-terminal-green hover:bg-terminal-green/5"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {option.full_name}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "loading" && (
          <div className="text-terminal-amber text-xs text-center animate-pulse">
            VERIFYING INTEL...
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3">
            <div className="text-terminal-red text-xs border border-terminal-red/30 p-2 text-center">
              {errorMsg}
            </div>
            <TerminalButton
              variant="ghost"
              onClick={() => { setPhase("challenge"); setSelectedId(null); setErrorMsg(""); }}
              className="w-full"
            >
              Try Again
            </TerminalButton>
          </div>
        )}

        {phase === "challenge" && (
          <TerminalButton
            variant="ghost"
            onClick={() => setPhase("idle")}
            className="w-full"
          >
            Abort
          </TerminalButton>
        )}
      </div>
    </TerminalCard>
  );
}
