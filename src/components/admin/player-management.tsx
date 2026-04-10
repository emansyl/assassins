"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalBadge } from "@/components/ui/terminal-badge";
import { TerminalButton } from "@/components/ui/terminal-button";
import type { Player } from "@/types";

export function PlayerManagement({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [spoonLoading, setSpoonLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createUntypedClient();

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  async function eliminatePlayer(playerId: string) {
    setLoading(playerId);
    await supabase
      .from("players")
      .update({ status: "eliminated", eliminated_at: new Date().toISOString() })
      .eq("id", playerId);

    // Reassign their target to whoever was hunting them
    const { data: assignment } = await supabase
      .from("assignments")
      .select("target_id")
      .eq("assassin_id", playerId)
      .eq("status", "active")
      .single();

    if (assignment) {
      // Find who was hunting this player
      const { data: hunterAssignment } = await supabase
        .from("assignments")
        .select("id")
        .eq("target_id", playerId)
        .eq("status", "active")
        .single();

      if (hunterAssignment) {
        await supabase
          .from("assignments")
          .update({ target_id: assignment.target_id })
          .eq("id", hunterAssignment.id);
      }

      // Deactivate the eliminated player's assignment
      await supabase
        .from("assignments")
        .update({ status: "reassigned" })
        .eq("assassin_id", playerId)
        .eq("status", "active");
    }

    // Update players remaining
    const { count } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("status", "alive");

    await supabase
      .from("game_state")
      .update({ players_remaining: count ?? 0 })
      .eq("id", 1);

    setLoading(null);
    router.refresh();
  }

  async function reactivatePlayer(playerId: string) {
    setLoading(playerId);
    await supabase
      .from("players")
      .update({ status: "alive", eliminated_at: null, eliminated_by: null })
      .eq("id", playerId);
    setLoading(null);
    router.refresh();
  }

  async function toggleSpoon(playerId: string, currentValue: boolean) {
    setSpoonLoading(playerId);
    await supabase
      .from("players")
      .update({ spoon_collected: !currentValue })
      .eq("id", playerId);
    setSpoonLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border border-terminal-dim bg-terminal-bg px-3 py-2">
        <span className="text-terminal-green text-sm">&gt;</span>
        <input
          type="text"
          placeholder="Search operatives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-terminal-text text-xs font-mono placeholder:text-terminal-dim/50 outline-none"
        />
      </div>

      <div className="text-terminal-dim text-[10px]">
        {filtered.length} OPERATIVES ({players.filter(p => p.status === "alive").length} ACTIVE)
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map((player) => (
          <div
            key={player.id}
            className={`
              border border-terminal-dim/30 p-2 flex items-center justify-between gap-2
              ${player.status !== "alive" ? "opacity-50" : ""}
            `}
          >
            <div className="flex-1 min-w-0">
              <div className="text-terminal-text text-xs truncate">
                {player.full_name}
              </div>
              <div className="text-terminal-dim text-[10px] truncate">
                {player.email}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-terminal-green text-[10px]">{player.kill_count}K</span>
              <button
                onClick={() => toggleSpoon(player.id, player.spoon_collected)}
                disabled={spoonLoading === player.id}
                title={player.spoon_collected ? "Spoon collected — click to revoke" : "No spoon — click to mark collected"}
                className={`text-[10px] px-1 cursor-pointer ${
                  spoonLoading === player.id ? "opacity-50" : ""
                } ${player.spoon_collected ? "text-terminal-green" : "text-terminal-dim"}`}
              >
                {player.spoon_collected ? "🥄" : "✗"}
              </button>
              <TerminalBadge variant={player.status === "alive" ? "active" : "eliminated"}>
                {player.status === "alive" ? "ACTIVE" : "KIA"}
              </TerminalBadge>
              {player.status === "alive" ? (
                <TerminalButton
                  variant="danger"
                  onClick={() => eliminatePlayer(player.id)}
                  loading={loading === player.id}
                  className="text-[10px] px-2 py-1"
                >
                  ELIM
                </TerminalButton>
              ) : (
                <TerminalButton
                  variant="ghost"
                  onClick={() => reactivatePlayer(player.id)}
                  loading={loading === player.id}
                  className="text-[10px] px-2 py-1"
                >
                  REVIVE
                </TerminalButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
