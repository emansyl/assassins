import { createClient } from "@/lib/supabase/server";
import { TerminalCard } from "@/components/ui/terminal-card";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "JUST NOW";
  if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}D AGO`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function FeedPage() {
  const supabase = await createClient();

  type KillWithNames = {
    id: string;
    confirmed_at: string;
    confirmed_by: string;
    notes: string | null;
    assassin: { full_name: string; nickname: string | null } | null;
    target: { full_name: string; nickname: string | null } | null;
  };

  const [killsRes, gameStateRes, statsRes] = await Promise.all([
    supabase
      .from("kills")
      .select(`
        id,
        confirmed_at,
        confirmed_by,
        notes,
        assassin:players!kills_assassin_id_fkey(full_name, nickname),
        target:players!kills_target_id_fkey(full_name, nickname)
      `)
      .order("confirmed_at", { ascending: false })
      .limit(50),
    supabase.from("game_state").select("players_remaining, status").eq("id", 1).single(),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("status", "alive"),
  ]);

  const kills = killsRes.data as KillWithNames[] | null;
  const gameState = gameStateRes.data as { players_remaining: number; status: string } | null;
  const aliveCount = statsRes.count ?? 0;
  const totalKills = kills?.length ?? 0;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-terminal-red text-sm glow-red tracking-widest">
          KILL FEED
        </div>
        <div className="text-terminal-dim text-[10px]">
          CONFIRMED ELIMINATIONS — LIVE
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex justify-around text-center border border-terminal-dim/30 py-2">
        <div>
          <div className="text-terminal-red text-lg font-bold">{totalKills}</div>
          <div className="text-terminal-dim text-[10px]">KILLS</div>
        </div>
        <div className="border-l border-terminal-dim/30" />
        <div>
          <div className="text-terminal-green text-lg font-bold">{aliveCount}</div>
          <div className="text-terminal-dim text-[10px]">ALIVE</div>
        </div>
        <div className="border-l border-terminal-dim/30" />
        <div>
          <div className="text-terminal-amber text-lg font-bold">
            {gameState?.status === "active" ? "ACTIVE" : gameState?.status?.toUpperCase() ?? "—"}
          </div>
          <div className="text-terminal-dim text-[10px]">STATUS</div>
        </div>
      </div>

      {/* Kill feed */}
      {(!kills || kills.length === 0) ? (
        <div className="text-center py-12 space-y-2">
          <div className="text-terminal-dim text-2xl">...</div>
          <div className="text-terminal-dim text-xs">
            NO CONFIRMED ELIMINATIONS YET
          </div>
          <div className="text-terminal-dim text-[10px] animate-pulse">
            AWAITING FIRST BLOOD
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {kills.map((kill, idx) => {
            const { assassin, target } = kill;
            const isLatest = idx === 0;

            return (
              <div
                key={kill.id}
                className={`
                  border-l-2 pl-3 py-2
                  ${isLatest
                    ? "border-terminal-red bg-terminal-red/5"
                    : "border-terminal-dim/30"
                  }
                `}
              >
                {/* Kill number + timestamp */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold ${isLatest ? "text-terminal-red" : "text-terminal-dim"}`}>
                    KILL #{totalKills - idx}
                  </span>
                  <span className="text-terminal-dim text-[10px]">
                    {timeAgo(kill.confirmed_at)}
                  </span>
                </div>

                {/* Kill event */}
                <div className="text-xs">
                  <span className="text-terminal-green font-bold">
                    {assassin?.full_name ?? "Unknown"}
                  </span>
                  <span className="text-terminal-red mx-2">✕</span>
                  <span className="text-terminal-red line-through opacity-75">
                    {target?.full_name ?? "Unknown"}
                  </span>
                </div>

                {/* Notes */}
                {kill.notes && (
                  <div className="text-terminal-muted text-[10px] italic mt-1">
                    &quot;{kill.notes}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
