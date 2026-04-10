"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

type Assignment = { assassin_id: string; target_id: string };

export function KillOverride({
  players,
  assignments,
}: {
  players: Player[];
  assignments: Assignment[];
}) {
  const [search, setSearch] = useState("");
  const [selectedAssassinId, setSelectedAssassinId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const supabase = createUntypedClient();

  const alivePlayers = players.filter((p) => p.status === "alive");
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Find target for selected assassin
  const assignmentForSelected = selectedAssassinId
    ? assignments.find((a) => a.assassin_id === selectedAssassinId)
    : null;
  const targetPlayer = assignmentForSelected
    ? playerMap.get(assignmentForSelected.target_id) ?? null
    : null;
  const selectedAssassin = selectedAssassinId
    ? playerMap.get(selectedAssassinId) ?? null
    : null;

  // Filter alive players by search
  const filtered = search.length > 0
    ? alivePlayers.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  function selectAssassin(id: string) {
    setSelectedAssassinId(id);
    setSearch("");
    setConfirm(false);
  }

  function clearSelection() {
    setSelectedAssassinId(null);
    setSearch("");
    setConfirm(false);
  }

  async function handleOverride() {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    if (!selectedAssassinId || !targetPlayer) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("confirm_kill", {
      p_assassin_id: selectedAssassinId,
      p_target_id: targetPlayer.id,
      p_confirmed_by: "admin",
    });

    setLoading(false);
    setConfirm(false);

    if (error) {
      alert(`Override failed: ${error.message}`);
    } else {
      const result = data as { success: boolean; error?: string } | null;
      if (result?.success) {
        alert(`Kill confirmed: ${selectedAssassin?.full_name} eliminated ${targetPlayer.full_name}`);
        clearSelection();
      } else {
        alert(`Failed: ${result?.error}`);
      }
    }

    router.refresh();
  }

  return (
    <TerminalCard title="Quick Kill Confirm" variant="danger">
      <div className="space-y-3">
        <div className="text-terminal-red text-[10px]">
          SELECT ASSASSIN — TARGET AUTO-FILLED FROM CHAIN
        </div>

        {!selectedAssassinId ? (
          // Search + select assassin
          <div className="space-y-2">
            <div className="flex items-center gap-2 border border-terminal-dim bg-terminal-bg px-3 py-2">
              <span className="text-terminal-green text-sm">&gt;</span>
              <input
                type="text"
                placeholder="Search assassin name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-terminal-text text-xs font-mono placeholder:text-terminal-dim/50 outline-none"
                autoComplete="off"
              />
            </div>

            {filtered.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectAssassin(p.id)}
                    className="w-full text-left px-3 py-2 border border-terminal-dim/30 text-xs text-terminal-text font-mono hover:border-terminal-green hover:bg-terminal-green/5 transition-colors"
                  >
                    {p.full_name}
                    <span className="text-terminal-dim ml-2">{p.kill_count}K</span>
                  </button>
                ))}
              </div>
            )}

            {search.length > 0 && filtered.length === 0 && (
              <div className="text-terminal-dim text-xs text-center py-2">
                NO MATCHING OPERATIVES
              </div>
            )}
          </div>
        ) : (
          // Selected assassin + auto-filled target
          <div className="space-y-3">
            <div className="border border-terminal-green/30 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-terminal-dim text-[10px] uppercase">Assassin</div>
                <button
                  onClick={clearSelection}
                  className="text-terminal-dim text-[10px] hover:text-terminal-text"
                >
                  [CHANGE]
                </button>
              </div>
              <div className="text-terminal-green text-sm font-mono">
                {selectedAssassin?.full_name}
              </div>
            </div>

            {targetPlayer ? (
              <>
                <div className="border border-terminal-red/30 p-3 space-y-1">
                  <div className="text-terminal-dim text-[10px] uppercase">Target (Auto-filled)</div>
                  <div className="text-terminal-red text-sm font-mono">
                    {targetPlayer.full_name}
                  </div>
                </div>

                <TerminalButton
                  variant="danger"
                  onClick={handleOverride}
                  loading={loading}
                  className="w-full"
                >
                  {confirm ? "CONFIRM — THIS WILL ELIMINATE TARGET" : "CONFIRM KILL"}
                </TerminalButton>
              </>
            ) : (
              <div className="text-terminal-amber text-xs border border-terminal-amber/30 p-3 text-center">
                NO ACTIVE ASSIGNMENT FOR THIS OPERATIVE
              </div>
            )}
          </div>
        )}
      </div>
    </TerminalCard>
  );
}
