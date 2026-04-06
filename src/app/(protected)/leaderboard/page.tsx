import { createClient } from "@/lib/supabase/server";
import { RankingsTable } from "@/components/leaderboard/rankings-table";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entries } = await supabase.rpc("get_leaderboard");

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          OPERATIVE RANKINGS
        </div>
        <div className="text-terminal-dim text-[10px]">— CLASSIFIED —</div>
      </div>

      <RankingsTable
        entries={(entries ?? []) as Array<{
          player_id: string;
          full_name: string;
          nickname: string | null;
          kill_count: number;
          status: string;
          eliminated_at: string | null;
        }>}
        currentPlayerId={user?.id}
      />
    </div>
  );
}
