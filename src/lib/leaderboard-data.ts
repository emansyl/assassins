import { createAdminClient } from "@/lib/supabase/admin";
import { computeNotoriety, type KillRow } from "@/lib/notoriety";

/**
 * Returns a map of player_id → cumulative kill count.
 * Uses the admin client to read all kills (RLS allows public read, but
 * keeps this code path consistent with other server-side aggregations).
 *
 * For ~90 players × ~3 kills, this is ~200 rows + a microsecond BFS.
 * Cheap enough to run on every leaderboard request.
 */
export async function getNotorietyMap(): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("kills")
    .select("assassin_id, target_id, confirmed_by");

  return Object.fromEntries(computeNotoriety((data as KillRow[]) ?? []));
}
