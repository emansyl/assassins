import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TargetDossier } from "@/components/dashboard/target-dossier";
import { KillConfirmation } from "@/components/dashboard/kill-confirmation";
import { PlayerStatsBar } from "@/components/dashboard/player-stats-bar";
import { EliminatedScreen } from "@/components/dashboard/eliminated-screen";
import { DeadlineCountdown } from "@/components/ui/deadline-countdown";
import type { Player, GameState } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch player profile
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!player) redirect("/");

  // Fetch game state
  const { data: gameState } = await supabase
    .from("game_state")
    .select("*")
    .eq("id", 1)
    .single();

  const gs = gameState as GameState | null;
  const p = player as Player;

  // Fetch current assignment + target
  let target: Player | null = null;
  if (p.status === "alive") {
    const { data: assignment } = await supabase
      .from("assignments")
      .select("target_id")
      .eq("assassin_id", user.id)
      .eq("status", "active")
      .single() as { data: { target_id: string } | null };

    if (assignment) {
      const { data: targetData } = await supabase
        .from("players")
        .select("*")
        .eq("id", assignment.target_id)
        .single();
      target = targetData as Player | null;

      // Generate signed URL for headshot (bucket is private)
      if (target?.photo_url) {
        const match = target.photo_url.match(/\/headshots\/(.+)$/);
        if (match) {
          const { data: signed } = await supabase.storage
            .from("headshots")
            .createSignedUrl(match[1], 3600);
          if (signed?.signedUrl) {
            target = { ...target, photo_url: signed.signedUrl };
          }
        }
      }
    }
  }

  // If eliminated, fetch who eliminated them
  let eliminatedByName: string | null = null;
  if (p.status === "eliminated" && p.eliminated_by) {
    const { data: killer } = await supabase
      .from("players")
      .select("full_name")
      .eq("id", p.eliminated_by)
      .single() as { data: { full_name: string } | null };
    eliminatedByName = killer?.full_name ?? "UNKNOWN";
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-xs tracking-widest">
          WELCOME BACK, AGENT
        </div>
        <div className="text-terminal-text text-lg font-bold">
          {p.full_name}
        </div>
      </div>

      {/* Stats */}
      {gs && <PlayerStatsBar player={p} gameState={gs} />}

      {/* Deadline countdown */}
      {gs?.deadline && <DeadlineCountdown deadline={gs.deadline} />}

      {/* Eliminated overlay */}
      {p.status === "eliminated" && (
        <EliminatedScreen player={p} eliminatedBy={eliminatedByName} />
      )}

      {/* Target dossier */}
      {p.status === "alive" && (
        <>
          <TargetDossier target={target} />

          {/* Kill confirmation */}
          {target && gs?.status === "active" && (
            <KillConfirmation target={target} assassinId={user.id} />
          )}
        </>
      )}

      {/* Game not started */}
      {gs?.status === "pending" && (
        <div className="text-center text-terminal-amber text-xs border border-terminal-amber/30 p-4">
          OPERATIONS HAVE NOT YET COMMENCED.
          <br />
          STAND BY FOR ACTIVATION.
        </div>
      )}

      {/* Game paused */}
      {gs?.status === "paused" && (
        <div className="text-center text-terminal-amber text-xs border border-terminal-amber/30 p-4">
          OPERATIONS TEMPORARILY SUSPENDED.
          <br />
          AWAIT FURTHER INSTRUCTIONS.
        </div>
      )}

      {/* Game ended */}
      {gs?.status === "ended" && (
        <div className="text-center text-terminal-green text-xs border border-terminal-green/30 p-4 glow-green">
          OPERATIONS COMPLETE.
          <br />
          CHECK LEADERBOARD FOR FINAL STANDINGS.
        </div>
      )}
    </div>
  );
}
