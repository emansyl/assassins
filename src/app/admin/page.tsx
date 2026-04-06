import { createClient } from "@/lib/supabase/server";
import { GameControls } from "@/components/admin/game-controls";
import { PlayerManagement } from "@/components/admin/player-management";
import { AssignmentChain } from "@/components/admin/assignment-chain";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { KillOverride } from "@/components/admin/kill-override";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player, GameState } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [gameStateRes, playersRes, assignmentsRes, killsRes] = await Promise.all([
    supabase.from("game_state").select("*").eq("id", 1).single(),
    supabase.from("players").select("*").order("created_at"),
    supabase
      .from("assignments")
      .select("id, assassin_id, target_id")
      .eq("status", "active"),
    supabase
      .from("kills")
      .select("*")
      .order("confirmed_at", { ascending: false })
      .limit(10),
  ]);

  const gameState = (gameStateRes.data ?? { id: 1, status: "pending", started_at: null, current_round: 1, players_remaining: 0, deadline: null }) as GameState;
  const players = ((playersRes.data ?? []) as unknown as Player[]);
  const assignments = (assignmentsRes.data ?? []) as Array<{ id: string; assassin_id: string; target_id: string }>;

  // Build assignment chain with names
  const playerMap = new Map(players.map((p) => [p.id, p.full_name]));
  const assignmentsWithNames = assignments.map((a) => ({
    id: a.id,
    assassin_id: a.assassin_id,
    target_id: a.target_id,
    assassin_name: playerMap.get(a.assassin_id) ?? "Unknown",
    target_name: playerMap.get(a.target_id) ?? "Unknown",
  }));

  // Stats
  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.status === "alive").length;
  const totalKills = players.reduce((sum, p) => sum + p.kill_count, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "TOTAL OPERATIVES", value: totalPlayers, color: "text-terminal-text" },
          { label: "ACTIVE", value: activePlayers, color: "text-terminal-green" },
          { label: "ELIMINATED", value: totalPlayers - activePlayers, color: "text-terminal-red" },
          { label: "TOTAL KILLS", value: totalKills, color: "text-terminal-amber" },
        ].map((stat) => (
          <TerminalCard key={stat.label}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-terminal-dim text-[10px] tracking-widest">{stat.label}</div>
            </div>
          </TerminalCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <GameControls gameState={gameState} />
          <AssignmentChain assignments={assignmentsWithNames} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <TerminalCard title="Player Management">
            <PlayerManagement players={players} />
          </TerminalCard>
          <KillOverride players={players} />
          <BroadcastComposer players={players} />
        </div>
      </div>
    </div>
  );
}
