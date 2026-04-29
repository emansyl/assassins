import { createAdminClient } from "@/lib/supabase/admin";
import { TerminalCard } from "@/components/ui/terminal-card";

/**
 * Live game stats pulled from the database, rendered for the demo "How It Works" page.
 * Server component — fetches all stats in parallel via the admin client (bypasses RLS).
 */
export async function DemoStats() {
  const admin = createAdminClient();

  const [
    playersRes,
    killsRes,
    gameStateRes,
  ] = await Promise.all([
    admin.from("players").select("status, kill_count, spoon_collected, full_name, is_demo"),
    admin.from("kills").select("confirmed_by, confirmed_at"),
    admin.from("game_state").select("status, started_at, current_round").eq("id", 1).single(),
  ]);

  const players = (playersRes.data ?? []) as Array<{
    status: string;
    kill_count: number;
    spoon_collected: boolean;
    full_name: string;
    is_demo: boolean;
  }>;
  const kills = (killsRes.data ?? []) as Array<{
    confirmed_by: string;
    confirmed_at: string;
  }>;
  const gameState = gameStateRes.data as {
    status: string;
    started_at: string | null;
    current_round: number;
  } | null;

  // Filter out demo users from all counts (real game state only)
  const realPlayers = players.filter((p) => !p.is_demo);
  const totalPlayers = realPlayers.length;
  const alivePlayers = realPlayers.filter((p) => p.status === "alive").length;
  const eliminatedPlayers = realPlayers.filter((p) => p.status === "eliminated").length;
  const spoonCollected = realPlayers.filter((p) => p.spoon_collected).length;
  const spoonRate = totalPlayers > 0 ? Math.round((spoonCollected / totalPlayers) * 100) : 0;

  const totalKills = kills.length;
  const realKills = kills.filter((k) => k.confirmed_by === "app" || k.confirmed_by === "admin").length;
  const selfKills = kills.filter((k) => k.confirmed_by === "self").length;
  const autoKills = kills.filter((k) => k.confirmed_by === "auto").length;

  // Top assassin
  const topKiller = [...realPlayers].sort((a, b) => b.kill_count - a.kill_count)[0];

  // Days since game started
  const gameDay =
    gameState?.started_at != null
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(gameState.started_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  const killsPerDay =
    gameDay > 0 && totalKills > 0 ? (totalKills / gameDay).toFixed(1) : "0";

  // Last kill timestamp (relative)
  const lastKill = kills
    .map((k) => new Date(k.confirmed_at).getTime())
    .sort((a, b) => b - a)[0];
  const lastKillRelative = lastKill ? formatRelative(lastKill) : "never";

  const gameStatusColor =
    gameState?.status === "active"
      ? "text-terminal-green glow-green"
      : gameState?.status === "paused"
      ? "text-terminal-amber"
      : gameState?.status === "ended"
      ? "text-terminal-red"
      : "text-terminal-dim";

  const stats: Array<{ label: string; value: string | number; color?: string }> = [
    { label: "TOTAL OPERATIVES", value: totalPlayers, color: "text-terminal-text" },
    { label: "STILL ACTIVE", value: alivePlayers, color: "text-terminal-green" },
    { label: "ELIMINATED", value: eliminatedPlayers, color: "text-terminal-red" },
    { label: "TOTAL KILLS", value: totalKills, color: "text-terminal-amber" },
    { label: "REAL KILLS", value: realKills, color: "text-terminal-text" },
    { label: "SELF-ELIMS", value: selfKills, color: "text-terminal-dim" },
    { label: "AUTO-ELIMS", value: autoKills, color: "text-terminal-dim" },
    { label: "SPOONS COLLECTED", value: `${spoonRate}%`, color: "text-terminal-amber" },
  ];

  return (
    <TerminalCard title="Live Game Stats" variant="warning">
      <div className="space-y-4">
        <div className="text-terminal-dim text-[10px]">
          Pulled live from the database. Demo accounts excluded — these are the real
          numbers for the active game.
        </div>

        {/* Game header */}
        <div className="grid grid-cols-2 gap-2 text-center border border-terminal-dim/40 p-3">
          <div>
            <div className={`text-sm font-bold uppercase tracking-widest ${gameStatusColor}`}>
              {gameState?.status ?? "UNKNOWN"}
            </div>
            <div className="text-terminal-dim text-[9px] mt-1">GAME STATUS</div>
          </div>
          <div>
            <div className="text-sm font-bold text-terminal-text">
              {gameDay > 0 ? `DAY ${gameDay}` : "—"}
            </div>
            <div className="text-terminal-dim text-[9px] mt-1">DURATION</div>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-terminal-dim/30 p-3 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color ?? "text-terminal-text"}`}>
                {stat.value}
              </div>
              <div className="text-terminal-dim text-[9px] tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Highlight: top killer + last kill */}
        <div className="space-y-2 border-t border-terminal-dim/40 pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">TOP ASSASSIN:</span>
            <span className="text-terminal-green">
              {topKiller && topKiller.kill_count > 0
                ? `${topKiller.full_name} (${topKiller.kill_count} kills)`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">LAST ELIMINATION:</span>
            <span className="text-terminal-amber">{lastKillRelative}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">KILLS PER DAY:</span>
            <span className="text-terminal-text">{killsPerDay}</span>
          </div>
        </div>
      </div>
    </TerminalCard>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
