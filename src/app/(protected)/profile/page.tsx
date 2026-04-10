import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TerminalCard } from "@/components/ui/terminal-card";
import { SelfEliminateButton } from "@/components/profile/self-eliminate-button";
import type { Player, GameState } from "@/types";

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

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  let userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) redirect("/");

  // Fetch player, game state, and kill history in parallel
  const playerPromise = supabase.from("players").select("*").eq("id", userId).single();
  const gameStatePromise = supabase.from("game_state").select("*").eq("id", 1).single();
  const killsPromise = supabase
    .from("kills")
    .select(`
      id,
      confirmed_at,
      confirmed_by,
      target:players!kills_target_id_fkey(id, full_name)
    `)
    .eq("assassin_id", userId)
    .order("confirmed_at", { ascending: false });

  const [playerRes, gameStateRes, killsRes] = await Promise.all([
    playerPromise,
    gameStatePromise,
    killsPromise,
  ]) as [
    { data: Player | null },
    { data: GameState | null },
    { data: Array<{ id: string; confirmed_at: string; confirmed_by: string; target: { id: string; full_name: string } | null }> | null },
  ];

  if (!playerRes.data) redirect("/");

  const p = playerRes.data;
  const gs = gameStateRes.data;
  const kills = killsRes.data ?? [];

  // Get signed headshot URL
  let headshotUrl: string | null = null;
  if (p.photo_url) {
    const match = p.photo_url.match(/\/headshots\/(.+)$/);
    if (match) {
      const { data: signed } = await supabase.storage
        .from("headshots")
        .createSignedUrl(match[1], 3600);
      if (signed?.signedUrl) {
        headshotUrl = signed.signedUrl;
      }
    }
  }

  const isAlive = p.status === "alive";
  const gameActive = gs?.status === "active";

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Dossier header */}
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          OPERATIVE DOSSIER
        </div>
        <div className="text-terminal-dim text-[10px]">— CLASSIFIED —</div>
      </div>

      {/* Main dossier card */}
      <TerminalCard title={isAlive ? "Active Operative" : "Deactivated Operative"} variant={isAlive ? undefined : "danger"}>
        <div className="space-y-4">
          {/* Photo + core info side by side */}
          <div className="flex gap-4">
            {/* Photo */}
            <div className="flex-shrink-0">
              {headshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headshotUrl}
                  alt="Operative"
                  className={`w-24 h-28 object-cover border grayscale contrast-125 ${
                    isAlive ? "border-terminal-green/50" : "border-terminal-red/50 opacity-60"
                  }`}
                />
              ) : (
                <div className={`w-24 h-28 border flex items-center justify-center ${
                  isAlive ? "border-terminal-green/50" : "border-terminal-red/50 opacity-60"
                }`}>
                  <span className="text-terminal-dim text-4xl font-bold">
                    {p.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-terminal-dim text-[10px] uppercase">Name</div>
                <div className={`text-sm font-bold ${isAlive ? "text-terminal-green glow-green" : "text-terminal-red line-through"}`}>
                  {p.full_name}
                </div>
              </div>
              {p.nickname && (
                <div>
                  <div className="text-terminal-dim text-[10px] uppercase">Alias</div>
                  <div className="text-terminal-text text-xs">{p.nickname}</div>
                </div>
              )}
              <div>
                <div className="text-terminal-dim text-[10px] uppercase">Status</div>
                <div className={`text-xs font-bold ${isAlive ? "text-terminal-green" : "text-terminal-red"}`}>
                  {isAlive ? "ACTIVE" : "DEACTIVATED"}
                </div>
              </div>
            </div>
          </div>

          {/* Dossier fields */}
          <div className="border-t border-terminal-dim/30 pt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-terminal-dim">CONFIRMED KILLS:</span>
              <span className="text-terminal-green font-bold">{p.kill_count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-terminal-dim">SPOON STATUS:</span>
              <span className={p.spoon_collected ? "text-terminal-green" : "text-terminal-amber"}>
                {p.spoon_collected ? "ARMED" : "UNARMED"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-terminal-dim">THREAT LEVEL:</span>
              <span className={
                p.kill_count >= 5 ? "text-terminal-red" :
                p.kill_count >= 3 ? "text-terminal-amber" :
                p.kill_count >= 1 ? "text-terminal-green" :
                "text-terminal-dim"
              }>
                {p.kill_count >= 5 ? "APEX PREDATOR" :
                 p.kill_count >= 3 ? "DANGEROUS" :
                 p.kill_count >= 1 ? "ACTIVE THREAT" :
                 "UNKNOWN"}
              </span>
            </div>
            {p.eliminated_at && (
              <div className="flex justify-between text-xs">
                <span className="text-terminal-dim">DEACTIVATED:</span>
                <span className="text-terminal-red">{timeAgo(p.eliminated_at)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-terminal-dim">OPERATIVE SINCE:</span>
              <span className="text-terminal-text">{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>

      {/* Kill log */}
      <TerminalCard title="Elimination Log">
        {kills.length === 0 ? (
          <div className="text-terminal-dim text-xs text-center py-4">
            NO CONFIRMED ELIMINATIONS ON RECORD
          </div>
        ) : (
          <div className="space-y-1">
            {kills.map((kill, idx) => (
              <div
                key={kill.id}
                className="flex items-center justify-between border-l-2 border-terminal-red/30 pl-2 py-1"
              >
                <div className="text-xs">
                  <span className="text-terminal-dim mr-2">#{kills.length - idx}</span>
                  <span className="text-terminal-red line-through">
                    {kill.target?.full_name ?? "Unknown"}
                  </span>
                </div>
                <div className="text-terminal-dim text-[10px]">
                  {timeAgo(kill.confirmed_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </TerminalCard>

      {/* Self-elimination */}
      {isAlive && gameActive && (
        <TerminalCard title="Voluntary Withdrawal" variant="danger">
          <div className="space-y-3">
            <div className="text-terminal-dim text-[10px]">
              REQUEST DEACTIVATION. NO KILL CREDIT WILL BE AWARDED.
              YOUR TARGET WILL BE REASSIGNED TO YOUR HUNTER.
            </div>
            <SelfEliminateButton />
          </div>
        </TerminalCard>
      )}
    </div>
  );
}
