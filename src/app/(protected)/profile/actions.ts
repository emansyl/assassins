"use server";

import { createClient } from "@/lib/supabase/server";

export async function selfEliminate(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Auth check with fallback
  const { data: claimsData } = await supabase.auth.getClaims();
  let userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return { success: false, error: "Not authenticated" };

  // Verify player is alive
  const { data: player } = await supabase
    .from("players")
    .select("status")
    .eq("id", userId)
    .single();

  if (!player || (player as { status: string }).status !== "alive") {
    return { success: false, error: "Player is not alive" };
  }

  // Call self_eliminate RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("self_eliminate", {
    p_player_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string } | null;
  if (!result?.success) {
    return { success: false, error: result?.error || "Self-elimination failed" };
  }

  return { success: true };
}
