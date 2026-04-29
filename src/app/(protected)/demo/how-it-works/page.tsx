import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChainVisualization, type ChainPlayer } from "@/components/demo/chain-visualization";
import { DemoStats } from "@/components/demo/demo-stats";

const NUM_NODES = 8;

export default async function HowItWorksPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/");

  // Gate to demo users only — also fetch the demo user's own info so we can
  // include them as a node in the chain visualization
  const { data: me } = await supabase
    .from("players")
    .select("id, full_name, photo_url, is_demo")
    .eq("id", userId)
    .single();
  const meRow = me as {
    id: string;
    full_name: string;
    photo_url: string | null;
    is_demo: boolean;
  } | null;
  if (!meRow?.is_demo) {
    redirect("/dashboard");
  }

  // Fetch top alive non-demo players for the visualization (one slot reserved for the demo user)
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("players")
    .select("id, full_name, photo_url")
    .eq("status", "alive")
    .eq("is_demo", false)
    .order("kill_count", { ascending: false })
    .limit(NUM_NODES - 1);

  const otherPlayers = (rows ?? []) as Array<{
    id: string;
    full_name: string;
    photo_url: string | null;
  }>;

  // Put the demo user in a random position so they don't always sit at the top
  const insertIdx = Math.floor(Math.random() * (otherPlayers.length + 1));
  const raw: Array<{ id: string; full_name: string; photo_url: string | null }> = [
    ...otherPlayers.slice(0, insertIdx),
    { id: meRow.id, full_name: meRow.full_name, photo_url: meRow.photo_url },
    ...otherPlayers.slice(insertIdx),
  ];

  // Sign each photo URL (1-hour expiry)
  const players: ChainPlayer[] = await Promise.all(
    raw.map(async (p) => {
      let signedUrl: string | null = p.photo_url;
      if (p.photo_url) {
        const match = p.photo_url.match(/\/headshots\/(.+)$/);
        if (match) {
          const { data: signed } = await admin.storage
            .from("headshots")
            .createSignedUrl(match[1], 3600);
          if (signed?.signedUrl) signedUrl = signed.signedUrl;
        }
      }
      return { id: p.id, full_name: p.full_name, photo_url: signedUrl };
    })
  );

  if (players.length < 4) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        <div className="text-center space-y-1">
          <div className="text-terminal-green text-sm tracking-widest glow-green">
            THE HUNT CHAIN
          </div>
          <div className="text-terminal-dim text-[10px]">
            — INTERACTIVE WALKTHROUGH —
          </div>
        </div>
        <div className="border border-terminal-amber/50 p-4 text-terminal-amber text-xs text-center">
          The interactive demo needs at least 4 alive operatives in the database.
          The current game only has {players.length}. Visit the leaderboard to see
          the live state of the game.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <ChainVisualization players={players} />
      <DemoStats />
    </div>
  );
}
