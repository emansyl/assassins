import { createClient } from "@/lib/supabase/server";
import { LeaderboardTabs } from "@/components/leaderboard/leaderboard-tabs";
import { getNotorietyMap } from "@/lib/leaderboard-data";

type LeaderboardEntry = {
  player_id: string;
  full_name: string;
  nickname: string | null;
  kill_count: number;
  status: string;
  eliminated_at: string | null;
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [leaderboardRes, notorietyMap] = await Promise.all([
    supabase.rpc("get_leaderboard"),
    getNotorietyMap(),
  ]);

  const killsEntries = (leaderboardRes.data ?? []) as LeaderboardEntry[];
  const notorietyEntries = killsEntries.map((p) => ({
    ...p,
    cumulative_kills: notorietyMap[p.player_id] ?? 0,
  }));

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          OPERATIVE RANKINGS
        </div>
        <div className="text-terminal-dim text-[10px]">— CLASSIFIED —</div>
      </div>

      <LeaderboardTabs
        killsEntries={killsEntries}
        notorietyEntries={notorietyEntries}
        currentPlayerId={user?.id}
      />
    </div>
  );
}
