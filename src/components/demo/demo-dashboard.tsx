import { createAdminClient } from "@/lib/supabase/admin";
import { TargetDossier } from "@/components/dashboard/target-dossier";
import { PlayerStatsBar } from "@/components/dashboard/player-stats-bar";
import { DemoBanner } from "./demo-banner";
import { DemoLabel } from "./demo-label";
import { WelcomeModal } from "./welcome-modal";
import { DemoKillConfirmation } from "./demo-kill-confirmation";
import type { Player, GameState } from "@/types";

/**
 * The dashboard view shown to demo users (e.g., the professor).
 *
 * Renders a realistic-looking sample of what an active player sees, with:
 * - The game master as the fake "target" (real name + photo)
 * - 4 real players from the DB as decoy quiz options (deterministic)
 * - Mock stats and game state
 * - All actions are no-ops (alerts only) — never writes to the DB
 */
export async function DemoDashboard() {
  const admin = createAdminClient();

  // 1. Look up the game master to use as the fake target
  const { data: gmRow } = await admin
    .from("players")
    .select("id, full_name, nickname, photo_url, email")
    .eq("email", process.env.GAME_MASTER_EMAIL ?? "")
    .single();

  const gm = gmRow as { id: string; full_name: string; nickname: string | null; photo_url: string | null; email: string } | null;

  // Sign the game master's photo URL if it's a Supabase Storage path
  let signedPhotoUrl: string | null = gm?.photo_url ?? null;
  if (gm?.photo_url) {
    const match = gm.photo_url.match(/\/headshots\/(.+)$/);
    if (match) {
      const { data: signed } = await admin.storage
        .from("headshots")
        .createSignedUrl(match[1], 3600);
      if (signed?.signedUrl) signedPhotoUrl = signed.signedUrl;
    }
  }

  // 2. Build a synthetic Player object representing the target
  const target: Player = {
    id: gm?.id ?? "demo-target",
    email: "",
    phone: "",
    full_name: gm?.full_name ?? "Casey Morgan",
    nickname: gm?.nickname ?? "Spectre",
    photo_url: signedPhotoUrl,
    status: "alive",
    kill_count: 0,
    eliminated_at: null,
    eliminated_by: null,
    created_at: new Date().toISOString(),
    onboarding_complete: true,
    rules_accepted_at: new Date().toISOString(),
    spoon_collected: true,
    is_demo: false,
  };

  // 3. Fetch 4 stable decoys — same players every visit
  const { data: decoyRows } = await admin
    .from("players")
    .select("id, full_name")
    .eq("status", "alive")
    .eq("is_demo", false)
    .neq("id", gm?.id ?? "00000000-0000-0000-0000-000000000000")
    .order("id", { ascending: true })
    .limit(4);

  const decoys = (decoyRows ?? []) as Array<{ id: string; full_name: string }>;

  // 4. Build verification options: target (correct) + decoys, sorted by id for stability
  const verificationOptions = [
    { id: target.id, full_name: target.full_name, isCorrect: true },
    ...decoys.map((d) => ({ id: d.id, full_name: d.full_name, isCorrect: false })),
  ].sort((a, b) => a.id.localeCompare(b.id));

  // 5. Mock game state and player stats
  const mockGameState: GameState = {
    id: 1,
    status: "active",
    started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    current_round: 3,
    players_remaining: 47,
    deadline: null,
  };

  const mockPlayer: Player = {
    id: "demo-player",
    email: "",
    phone: "",
    full_name: "Demo Operative",
    nickname: null,
    photo_url: null,
    status: "alive",
    kill_count: 2,
    eliminated_at: null,
    eliminated_by: null,
    created_at: new Date().toISOString(),
    onboarding_complete: true,
    rules_accepted_at: new Date().toISOString(),
    spoon_collected: true,
    is_demo: true,
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <WelcomeModal />

      <DemoBanner
        navLinks={[
          { href: "/admin", label: "→ ADMIN CONSOLE" },
          { href: "/demo/how-it-works", label: "🎬 HOW IT WORKS" },
        ]}
      />

      {/* Header */}
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-xs tracking-widest">
          WELCOME BACK, AGENT
        </div>
        <div className="text-terminal-text text-lg font-bold">
          [Demo Operative]
        </div>
      </div>

      <DemoLabel
        active
        title="Player Stats"
        description="Quick glance at your status, kill count, and how many operatives are still alive in the game."
      >
        <PlayerStatsBar player={mockPlayer} gameState={mockGameState} />
      </DemoLabel>

      <DemoLabel
        active
        title="Target Dossier"
        description="Your assigned target is shown here — photo and name are pixelated/blurred until you tap reveal so passersby can't peek over your shoulder. You can only eliminate them once they have collected their spoon."
      >
        <TargetDossier target={target} spoonCollected={target.spoon_collected} />
      </DemoLabel>

      <DemoLabel
        active
        title="Kill Confirmation Quiz"
        description="To confirm a kill, you must answer who YOUR target's target is — proves you've actually seen them. 3 wrong guesses = auto-elimination. Decoys here are real players from the game; clicking any option shows what would happen in live mode."
      >
        <DemoKillConfirmation
          targetName={target.full_name}
          options={verificationOptions}
        />
      </DemoLabel>

      <div className="text-terminal-dim text-[10px] text-center border-t border-terminal-dim pt-3">
        Use the bottom nav to explore: RANKS (leaderboard), FEED (kill log),
        PROFILE (your stats), and visit /admin for the read-only command console.
      </div>
    </div>
  );
}
