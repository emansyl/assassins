"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { GameState } from "@/types";

export function GameControls({ gameState, hasAssignments }: { gameState: GameState; hasAssignments: boolean }) {
  const [loading, setLoading] = useState("");
  const [deadline, setDeadline] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createUntypedClient();

  async function updateGameStatus(status: string) {
    setLoading(status);
    const updates: Record<string, unknown> = { status };
    if (status === "active" && !gameState.started_at) {
      updates.started_at = new Date().toISOString();
    }
    await supabase.from("game_state").update(updates).eq("id", 1);
    setLoading("");
    setConfirmAction(null);
    router.refresh();
  }

  async function setGameDeadline() {
    if (!deadline) return;
    setLoading("deadline");
    await supabase
      .from("game_state")
      .update({ deadline: new Date(deadline).toISOString() })
      .eq("id", 1);
    setLoading("");
    setDeadline("");
    router.refresh();
  }

  async function clearDeadline() {
    setLoading("clear_deadline");
    await supabase
      .from("game_state")
      .update({ deadline: null })
      .eq("id", 1);
    setLoading("");
    router.refresh();
  }

  async function enforceDeadline() {
    setLoading("enforce");
    const { data } = await supabase.rpc("enforce_deadline");
    setLoading("");
    setConfirmAction(null);
    router.refresh();
    const result = data as { eliminated_count?: number } | null;
    if (result?.eliminated_count) {
      alert(`${result.eliminated_count} operatives deactivated.`);
    }
  }

  async function resetGame() {
    setLoading("reset");
    const { data, error } = await supabase.rpc("reset_game");
    setLoading("");
    setConfirmAction(null);
    router.refresh();
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      const result = data as { success: boolean; players_reset?: number; error?: string } | null;
      if (result?.success) {
        alert(`Game reset. ${result.players_reset} players restored to initial state.`);
      } else {
        alert(`Failed: ${result?.error}`);
      }
    }
  }

  async function generateAssignments() {
    setLoading("generate");
    const { data, error } = await supabase.rpc("generate_assignments");
    setLoading("");
    setConfirmAction(null);
    router.refresh();
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      const result = data as { success: boolean; assignments_created?: number; error?: string } | null;
      if (result?.success) {
        alert(`${result.assignments_created} assignments created.`);
      } else {
        alert(`Failed: ${result?.error}`);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Game Status */}
      <TerminalCard title="Game Status">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-terminal-dim">CURRENT STATUS:</span>
            <span className={
              gameState.status === "active" ? "text-terminal-green glow-green" :
              gameState.status === "paused" ? "text-terminal-amber" :
              gameState.status === "ended" ? "text-terminal-red" :
              "text-terminal-dim"
            }>
              {gameState.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-terminal-dim">PLAYERS REMAINING:</span>
            <span className="text-terminal-green">{gameState.players_remaining}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-terminal-dim">ROUND:</span>
            <span className="text-terminal-text">{gameState.current_round}</span>
          </div>

          <div className="flex gap-2 pt-2">
            {gameState.status !== "active" && (
              <TerminalButton
                onClick={() => {
                  if (!hasAssignments) {
                    alert("Generate assignments first before starting the game.");
                    return;
                  }
                  confirmAction === "start" ? updateGameStatus("active") : setConfirmAction("start");
                }}
                loading={loading === "active"}
                className="flex-1"
                disabled={!hasAssignments && gameState.status === "pending"}
              >
                {confirmAction === "start" ? "CONFIRM START" : "START GAME"}
              </TerminalButton>
            )}
            {gameState.status === "active" && (
              <TerminalButton
                variant="warning"
                onClick={() => confirmAction === "pause" ? updateGameStatus("paused") : setConfirmAction("pause")}
                loading={loading === "paused"}
                className="flex-1"
              >
                {confirmAction === "pause" ? "CONFIRM PAUSE" : "PAUSE GAME"}
              </TerminalButton>
            )}
            {gameState.status !== "ended" && (
              <TerminalButton
                variant="danger"
                onClick={() => confirmAction === "end" ? updateGameStatus("ended") : setConfirmAction("end")}
                loading={loading === "ended"}
                className="flex-1"
              >
                {confirmAction === "end" ? "CONFIRM END" : "END GAME"}
              </TerminalButton>
            )}
          </div>
        </div>
      </TerminalCard>

      {/* Target Assignments */}
      <TerminalCard title="Target Assignments">
        <div className="space-y-2">
          <div className="text-terminal-dim text-[10px]">
            REASSIGNS ALL ALIVE PLAYERS INTO A NEW RANDOM CIRCULAR CHAIN.
            USE AT GAME START OR ANY TIME TO SHUFFLE.
          </div>
          <TerminalButton
            onClick={() => confirmAction === "generate" ? generateAssignments() : setConfirmAction("generate")}
            loading={loading === "generate"}
            className="w-full"
            variant={confirmAction === "generate" ? "danger" : "primary"}
          >
            {confirmAction === "generate" ? "CONFIRM — THIS WILL RESHUFFLE ALL TARGETS" : "SHUFFLE TARGETS"}
          </TerminalButton>
        </div>
      </TerminalCard>


      {/* Reset Game */}
      <TerminalCard title="Reset Game" variant="danger">
        <div className="space-y-3">
          <div className="text-terminal-dim text-[10px]">
            WIPES ALL KILLS, ASSIGNMENTS, AND RESETS ALL PLAYERS TO INITIAL STATE.
            ONBOARDING WILL BE REQUIRED AGAIN. THIS CANNOT BE UNDONE.
          </div>
          <TerminalButton
            variant="danger"
            onClick={() => confirmAction === "reset" ? resetGame() : setConfirmAction("reset")}
            loading={loading === "reset"}
            className="w-full"
          >
            {confirmAction === "reset" ? "⚠ CONFIRM FULL RESET ⚠" : "RESET GAME"}
          </TerminalButton>
          {confirmAction === "reset" && (
            <TerminalButton
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              className="w-full"
            >
              CANCEL
            </TerminalButton>
          )}
        </div>
      </TerminalCard>

      {/* Deadline */}
      <TerminalCard title="Mission Deadline" variant="warning">
        <div className="space-y-3">
          {gameState.deadline && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-terminal-dim">CURRENT DEADLINE:</span>
                <span className="text-terminal-amber">
                  {new Date(gameState.deadline).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <TerminalButton
                  variant="ghost"
                  onClick={clearDeadline}
                  loading={loading === "clear_deadline"}
                  className="flex-1"
                >
                  Clear Deadline
                </TerminalButton>
                <TerminalButton
                  variant="danger"
                  onClick={() => confirmAction === "enforce" ? enforceDeadline() : setConfirmAction("enforce")}
                  loading={loading === "enforce"}
                  className="flex-1"
                >
                  {confirmAction === "enforce" ? "CONFIRM ENFORCE" : "ENFORCE DEADLINE"}
                </TerminalButton>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1 bg-terminal-bg border border-terminal-dim px-2 py-1 text-xs text-terminal-text font-mono outline-none focus:border-terminal-amber"
            />
            <TerminalButton
              variant="warning"
              onClick={setGameDeadline}
              loading={loading === "deadline"}
              disabled={!deadline}
            >
              Set
            </TerminalButton>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
