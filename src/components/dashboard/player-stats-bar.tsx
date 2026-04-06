import { TerminalBadge } from "@/components/ui/terminal-badge";
import type { Player, GameState } from "@/types";

export function PlayerStatsBar({
  player,
  gameState,
}: {
  player: Player;
  gameState: GameState;
}) {
  const isAlive = player.status === "alive";
  const gameDay = gameState.started_at
    ? Math.floor(
        (Date.now() - new Date(gameState.started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 0;

  return (
    <div className="flex items-center justify-between gap-2 text-xs border border-terminal-dim p-3">
      <div className="flex items-center gap-2">
        <TerminalBadge variant={isAlive ? "active" : "eliminated"}>
          {isAlive ? "ACTIVE" : "ELIMINATED"}
        </TerminalBadge>
      </div>

      <div className="flex items-center gap-4 text-terminal-dim">
        <div>
          <span className="text-terminal-green">{player.kill_count}</span> KILLS
        </div>
        <div>
          <span className="text-terminal-amber">{gameState.players_remaining}</span> REMAINING
        </div>
        {gameDay > 0 && (
          <div>
            DAY <span className="text-terminal-text">{gameDay}</span>
          </div>
        )}
      </div>
    </div>
  );
}
