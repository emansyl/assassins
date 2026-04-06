import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

export function EliminatedScreen({
  player,
  eliminatedBy,
}: {
  player: Player;
  eliminatedBy: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-terminal-bg/95 flex items-center justify-center p-4">
      <TerminalCard title="System Notice" variant="danger" className="max-w-sm w-full">
        <div className="text-center space-y-6 py-4">
          <div className="space-y-2">
            <div className="text-terminal-red text-2xl font-bold glow-red animate-flicker">
              DEACTIVATED
            </div>
            <div className="text-terminal-dim text-xs">
              YOUR OPERATIVE STATUS HAS BEEN TERMINATED
            </div>
          </div>

          <div className="border-t border-terminal-dim pt-4 space-y-3">
            <div className="text-terminal-dim text-xs uppercase tracking-widest">
              Final Report
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-terminal-dim">OPERATIVE:</span>
                <span className="text-terminal-text">{player.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">TOTAL ELIMINATIONS:</span>
                <span className="text-terminal-green">{player.kill_count}</span>
              </div>
              {eliminatedBy && (
                <div className="flex justify-between">
                  <span className="text-terminal-dim">ELIMINATED BY:</span>
                  <span className="text-terminal-red">{eliminatedBy}</span>
                </div>
              )}
              {player.eliminated_at && (
                <div className="flex justify-between">
                  <span className="text-terminal-dim">TIME OF DEATH:</span>
                  <span className="text-terminal-muted">
                    {new Date(player.eliminated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-terminal-dim text-[10px]">
            YOU MAY STILL VIEW THE LEADERBOARD AND KILL FEED
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
