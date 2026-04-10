"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_WRONG_GUESSES = 3;

type VerifyResult = {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  eliminated?: boolean;
};

export async function verifyKillAnswer(
  assassinId: string,
  targetId: string,
  selectedPlayerId: string
): Promise<VerifyResult> {
  const supabase = await createClient();

  // Auth check
  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims?.sub !== assassinId) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  // Get assassin's active assignment (includes wrong_guesses count)
  const { data: assassinAssignment } = await supabase
    .from("assignments")
    .select("id, wrong_guesses")
    .eq("assassin_id", assassinId)
    .eq("target_id", targetId)
    .eq("status", "active")
    .maybeSingle();

  if (!assassinAssignment) {
    return { success: false, error: "NO ACTIVE ASSIGNMENT" };
  }

  const assignment = assassinAssignment as { id: string; wrong_guesses: number };

  // Verify target has collected their spoon
  const { data: targetPlayer } = await supabase
    .from("players")
    .select("spoon_collected")
    .eq("id", targetId)
    .single();

  if (!(targetPlayer as { spoon_collected: boolean } | null)?.spoon_collected) {
    return { success: false, error: "TARGET HAS NOT COLLECTED SPOON — CANNOT ELIMINATE" };
  }

  // Look up the target's active assignment (target's target = correct answer)
  const { data: targetAssignment } = await supabase
    .from("assignments")
    .select("target_id")
    .eq("assassin_id", targetId)
    .eq("status", "active")
    .maybeSingle();

  if (!targetAssignment) {
    return { success: false, error: "TARGET ASSIGNMENT NOT FOUND" };
  }

  const correctAnswerId = (targetAssignment as { target_id: string }).target_id;

  // Wrong answer
  if (selectedPlayerId !== correctAnswerId) {
    // Increment via RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCount } = await (supabase.rpc as any)("increment_wrong_guesses", {
      p_assignment_id: assignment.id,
    });

    const newWrongGuesses = (newCount as number) ?? assignment.wrong_guesses + 1;
    const remaining = MAX_WRONG_GUESSES - newWrongGuesses;

    // Auto-eliminate on 3rd wrong guess
    if (newWrongGuesses >= MAX_WRONG_GUESSES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)("auto_eliminate_failed_assassin", {
        p_player_id: assassinId,
      });

      return {
        success: false,
        eliminated: true,
        attemptsRemaining: 0,
        error: "CRITICAL FAILURE — 3 INCORRECT ATTEMPTS. YOU HAVE BEEN DEACTIVATED.",
      };
    }

    return {
      success: false,
      attemptsRemaining: remaining,
      error: `INCORRECT — ${remaining} ATTEMPT${remaining === 1 ? "" : "S"} REMAINING BEFORE AUTO-ELIMINATION`,
    };
  }

  // Correct — confirm the kill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("confirm_kill", {
    p_assassin_id: assassinId,
    p_target_id: targetId,
    p_confirmed_by: "app",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string } | null;
  if (!result?.success) {
    return { success: false, error: result?.error || "KILL CONFIRMATION FAILED" };
  }

  return { success: true };
}
