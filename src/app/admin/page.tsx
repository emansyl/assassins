import { createClient } from "@/lib/supabase/server";
import { GameControls } from "@/components/admin/game-controls";
import { PlayerManagement } from "@/components/admin/player-management";
import { AssignmentChain } from "@/components/admin/assignment-chain";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { KillOverride } from "@/components/admin/kill-override";
import { TerminalCard } from "@/components/ui/terminal-card";
import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoLabel } from "@/components/demo/demo-label";
import type { Player, GameState } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();

  // Determine if current user is in demo mode
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  const userEmail = claimsData?.claims?.email as string | undefined;
  const isGameMaster = userEmail === process.env.GAME_MASTER_EMAIL;

  let isDemo = false;
  if (!isGameMaster && userId) {
    const { data: me } = await supabase
      .from("players")
      .select("is_demo")
      .eq("id", userId)
      .single();
    isDemo = !!(me as { is_demo: boolean } | null)?.is_demo;
  }

  // Fetch all data in parallel
  const [gameStateRes, playersRes, assignmentsRes, killsRes] =
    await Promise.all([
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

  const gameState = (gameStateRes.data ?? {
    id: 1,
    status: "pending",
    started_at: null,
    current_round: 1,
    players_remaining: 0,
    deadline: null,
  }) as GameState;
  const allPlayers = (playersRes.data ?? []) as unknown as Player[];
  const assignments = (assignmentsRes.data ?? []) as Array<{
    id: string;
    assassin_id: string;
    target_id: string;
  }>;

  // Real players (excluding demo users) — used for stats and the chain view
  const players = allPlayers.filter((p) => !p.is_demo);

  // Build assignment chain with names
  const playerMap = new Map(allPlayers.map((p) => [p.id, p.full_name]));
  const assignmentsWithNames = assignments.map((a) => ({
    id: a.id,
    assassin_id: a.assassin_id,
    target_id: a.target_id,
    assassin_name: playerMap.get(a.assassin_id) ?? "Unknown",
    target_name: playerMap.get(a.target_id) ?? "Unknown",
  }));

  // Stats — exclude demo users so the count reflects the real game
  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.status === "alive").length;
  const totalKills = players.reduce((sum, p) => sum + p.kill_count, 0);

  return (
    <div className="space-y-6">
      {isDemo && (
        <DemoBanner
          navLinks={[
            { href: "/dashboard", label: "← PLAYER DASHBOARD" },
            { href: "/demo/how-it-works", label: "🎬 HOW IT WORKS" },
          ]}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: "TOTAL OPERATIVES ",
            value: totalPlayers,
            color: "text-terminal-text",
          },
          {
            label: "ACTIVE",
            value: activePlayers,
            color: "text-terminal-green",
          },
          {
            label: "ELIMINATED",
            value: totalPlayers - activePlayers,
            color: "text-terminal-red",
          },
          {
            label: "TOTAL KILLS",
            value: totalKills,
            color: "text-terminal-amber",
          },
        ].map((stat) => (
          <TerminalCard key={stat.label}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-terminal-dim text-[10px] tracking-widest">
                {stat.label}
              </div>
            </div>
          </TerminalCard>
        ))}
      </div>

      {/*
        Wrap the entire write surface in a fieldset disabled by demo mode.
        This natively disables every <button>, <input>, <select>, <textarea>
        nested inside, so demo users cannot trigger any game-state changes.
      */}
      <fieldset disabled={isDemo} className={isDemo ? "opacity-70" : ""}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <DemoLabel
              active={isDemo}
              title="Game Controls"
              description="The game master starts/pauses/ends the game, sets a kill deadline, and reshuffles all targets at once. Reshuffling builds a fresh random circular chain among only alive players."
            >
              <GameControls
                gameState={gameState}
                hasAssignments={assignments.length > 0}
              />
            </DemoLabel>
            <DemoLabel
              active={isDemo}
              title="Assignment Chain"
              description="Visualizes the current circular hunt chain — who is hunting whom. When someone is eliminated, their hunter inherits the target."
            >
              <AssignmentChain assignments={assignmentsWithNames} />
            </DemoLabel>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <DemoLabel
              active={isDemo}
              title="Player Management"
              description="Manually eliminate or revive any player and toggle their spoon-collected status. Eliminating here triggers chain reassignment."
            >
              <TerminalCard title="Player Management">
                <PlayerManagement players={allPlayers} />
              </TerminalCard>
            </DemoLabel>
            <DemoLabel
              active={isDemo}
              title="Kill Override"
              description="Force-confirm a kill on behalf of a player — useful when the in-app verification can't be used (e.g., player's phone died)."
            >
              <KillOverride players={allPlayers} assignments={assignments} />
            </DemoLabel>
            <DemoLabel
              active={isDemo}
              title="Broadcast Composer"
              description="Send a system-wide announcement to all players, or a direct message to a single player."
            >
              <BroadcastComposer players={allPlayers} />
            </DemoLabel>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
