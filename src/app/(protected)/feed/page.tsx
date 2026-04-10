import { createClient } from "@/lib/supabase/server";
import { TerminalCard } from "@/components/ui/terminal-card";

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

  const { data } = await supabase
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
    .limit(50);

  const kills = data as KillWithNames[] | null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          INCIDENT LOG
        </div>
        <div className="text-terminal-dim text-[10px]">
          CONFIRMED ELIMINATIONS — CHRONOLOGICAL
        </div>
      </div>

      {(!kills || kills.length === 0) ? (
        <div className="text-center text-terminal-dim text-xs py-8">
          NO CONFIRMED ELIMINATIONS YET
        </div>
      ) : (
        <div className="space-y-3">
          {kills.map((kill) => {
            const { assassin, target } = kill;

            return (
              <TerminalCard key={kill.id} variant="danger">
                <div className="space-y-2">
                  {/* Timestamp */}
                  <div className="text-terminal-dim text-[10px]">
                    {new Date(kill.confirmed_at).toLocaleString()} — VIA {kill.confirmed_by.toUpperCase()}
                  </div>

                  {/* Kill details */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-green">
                        {assassin?.full_name ?? "Unknown"}
                      </span>
                      <span className="text-terminal-red">ELIMINATED</span>
                      <span className="text-terminal-red line-through">
                        {target?.full_name ?? "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {kill.notes && (
                    <div className="text-terminal-muted text-[10px] italic border-l-2 border-terminal-dim pl-2">
                      {kill.notes}
                    </div>
                  )}
                </div>
              </TerminalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
