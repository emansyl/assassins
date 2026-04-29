"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidHBSEmail } from "@/lib/constants";

/**
 * Returns true if the given email is allowed to attempt login.
 *
 * Allowed if:
 *  - Email is a valid HBS domain (regular players), OR
 *  - Email exists in the `players` table with `is_demo = true` (e.g., professor demo accounts)
 */
export async function canEmailLogin(email: string): Promise<boolean> {
  const lower = email.toLowerCase().trim();
  if (!lower) return false;

  if (isValidHBSEmail(lower)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from("players")
    .select("id")
    .eq("email", lower)
    .eq("is_demo", true)
    .maybeSingle();

  return !!data;
}
