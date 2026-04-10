"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptRules(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { success: false };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("players") as any)
    .update({ rules_accepted_at: new Date().toISOString() })
    .eq("id", userId);

  return { success: true };
}

export async function completeOnboarding(
  hasSpoon: boolean
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { success: false };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("players") as any)
    .update({
      onboarding_complete: true,
      spoon_collected: hasSpoon,
    })
    .eq("id", userId);

  return { success: true };
}
