"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { isValidHBSEmail } from "@/lib/constants";
import { toE164 } from "@/lib/utils/phone-format";

type LookupResult =
  | { status: "returning" }
  | { status: "new_player"; fullName: string; photoUrl: string | null }
  | { status: "not_found" };

export async function lookupEmail(email: string): Promise<LookupResult> {
  if (!isValidHBSEmail(email)) {
    return { status: "not_found" };
  }

  const supabase = createAdminClient();
  const untypedSupabase = createUntypedAdminClient();
  const normalizedEmail = email.toLowerCase();

  // Check if already a registered player (returning user)
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .ilike("email", normalizedEmail)
    .single();

  if (player) {
    return { status: "returning" };
  }

  // Check player_seeds for new user (untyped client to avoid RLS `never` types)
  const { data: seed } = await untypedSupabase
    .from("player_seeds")
    .select("full_name, photo_url")
    .ilike("email", normalizedEmail)
    .eq("claimed", false)
    .single();

  if (seed) {
    return {
      status: "new_player",
      fullName: seed.full_name as string,
      photoUrl: seed.photo_url as string | null,
    };
  }

  return { status: "not_found" };
}

export async function linkPhoneToSeed(
  email: string,
  phone: string
): Promise<{ success: boolean }> {
  const supabase = createUntypedAdminClient();
  const formattedPhone = toE164(phone);

  const { error } = await supabase
    .from("player_seeds")
    .update({ phone: formattedPhone })
    .ilike("email", email.toLowerCase())
    .eq("claimed", false);

  return { success: !error };
}
