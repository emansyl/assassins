import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TargetDossier } from "@/components/dashboard/target-dossier";
import { KillConfirmation } from "@/components/dashboard/kill-confirmation";
import { PlayerStatsBar } from "@/components/dashboard/player-stats-bar";
import { EliminatedScreen } from "@/components/dashboard/eliminated-screen";
import { DeadlineCountdown } from "@/components/ui/deadline-countdown";
import { InstallPrompt } from "@/components/ui/install-prompt";
import type { Player, GameState } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/");
  const userId = claims.sub as string;

  // Fetch player, game state, and active assignment in parallel
  const playerPromise = supabase.from("players").select("*").eq("id", userId).single();
  const gameStatePromise = supabase.from("game_state").select("*").eq("id", 1).single();
  const assignmentPromise = supabase
    .from("assignments")
    .select("target_id, wrong_guesses")
    .eq("assassin_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const [playerRes, gameStateRes, assignmentRes] = (await Promise.all([
    playerPromise,
    gameStatePromise,
    assignmentPromise,
  ])) as [
    { data: Player | null },
    { data: GameState | null },
    { data: { target_id: string; wrong_guesses: number } | null },
  ];

  if (!playerRes.data) redirect("/");

  const p = playerRes.data as Player;

  // Gate behind onboarding
  if (!p.onboarding_complete) redirect("/onboarding");
  const gs = gameStateRes.data as GameState | null;
  const assignmentData = assignmentRes.data as { target_id: string; wrong_guesses: number } | null;
  // Fetch target + signed headshot URL in parallel (if alive and assigned)
  let target: Player | null = null;
  if (p.status === "alive" && assignmentData?.target_id) {
    const { data: targetData } = await supabase
      .from("players")
      .select("*")
      .eq("id", assignmentData.target_id)
      .single();
    target = targetData as Player | null;

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

  // Generate kill verification options (multiple choice)
  let verificationOptions: { id: string; full_name: string }[] = [];
  if (p.status === "alive" && assignmentData?.target_id && gs?.status === "active" && target) {
    // Get the target's target (correct answer)
    const { data: targetAssignment } = await supabase
      .from("assignments")
      .select("target_id")
      .eq("assassin_id", assignmentData.target_id)
      .eq("status", "active")
      .maybeSingle();

    if (targetAssignment) {
      const correctId = (targetAssignment as { target_id: string }).target_id;

      // Fetch correct player + decoys in parallel
      const excludeIds = [userId, assignmentData.target_id, correctId].filter(
        (id, i, arr) => arr.indexOf(id) === i // dedupe (correctId may === userId in 2-player endgame)
      );

      const [correctPlayerRes, decoysRes] = await Promise.all([
        supabase.from("players").select("id, full_name").eq("id", correctId).single(),
        supabase
          .from("players")
          .select("id, full_name")
          .eq("status", "alive")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(20),
      ]);

      const correctPlayer = correctPlayerRes.data as { id: string; full_name: string } | null;
      const decoys = (decoysRes.data ?? []) as { id: string; full_name: string }[];

      if (correctPlayer) {
        // Deterministic shuffle seeded by assignment (userId + targetId)
        // Same player sees same options for the same assignment — no refresh exploit
        const seed = (userId + assignmentData.target_id)
          .split("")
          .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
        const seededSort = (a: { id: string }, b: { id: string }) => {
          const ha = (a.id + seed.toString()).split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
          const hb = (b.id + seed.toString()).split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
          return ha - hb;
        };

        const pickedDecoys = decoys.sort(seededSort).slice(0, 4);
        verificationOptions = [correctPlayer, ...pickedDecoys]
          .sort(seededSort)
          .map(({ id, full_name }) => ({ id, full_name }));
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

      {/* Install prompt */}
      <InstallPrompt />

      {/* Stats */}
      {gs && <PlayerStatsBar player={p} gameState={gs} />}

      {/* Deadline countdown */}
      {gs?.deadline && <DeadlineCountdown deadline={gs.deadline} />}

      {/* Eliminated overlay */}
      {p.status === "eliminated" && (
        <EliminatedScreen player={p} eliminatedBy={eliminatedByName} />
      )}

      {/* Game not started banner */}
      {gs?.status === "pending" && (
        <div className="text-center border border-terminal-amber/50 p-6 space-y-2">
          <div className="text-terminal-amber text-sm font-bold glow-amber">
            OPERATIONS HAVE NOT YET COMMENCED
          </div>
          <div className="text-terminal-red text-xs">
            DO NOT ENGAGE — AWAIT ACTIVATION FROM COMMAND
          </div>
          <div className="text-terminal-amber text-xs animate-pulse">
            STAND BY...
          </div>
        </div>
      )}

      {/* Game paused banner */}
      {gs?.status === "paused" && (
        <div className="text-center border border-terminal-amber/50 p-6 space-y-2">
          <div className="text-terminal-amber text-sm font-bold glow-amber">
            OPERATIONS TEMPORARILY SUSPENDED
          </div>
          <div className="text-terminal-dim text-xs">
            ALL MISSIONS ON HOLD — AWAIT FURTHER INSTRUCTIONS
          </div>
        </div>
      )}

      {/* Target dossier (show when assigned, regardless of game status) */}
      {p.status === "alive" && (
        <>
          <TargetDossier target={target} spoonCollected={target?.spoon_collected ?? false} />

          {/* Kill confirmation (only when game is active and target has spoon) */}
          {target && gs?.status === "active" && target.spoon_collected && (
            <KillConfirmation key={target.id} target={target} assassinId={userId} verificationOptions={verificationOptions} wrongGuesses={assignmentData?.wrong_guesses ?? 0} />
          )}

          {/* Target hasn't collected spoon */}
          {target && gs?.status === "active" && !target.spoon_collected && (
            <div className="text-center text-terminal-amber text-xs border border-terminal-amber/30 p-4">
              TARGET HAS NOT COLLECTED THEIR SPOON.
              <br />
              ELIMINATION NOT PERMITTED UNTIL SPOON IS ACQUIRED.
            </div>
          )}
        </>
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
