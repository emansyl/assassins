import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import type { Player } from "@/types";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", claims.sub)
    .single();

  if (!player) redirect("/");

  const p = player as Player;

  // Already onboarded — go to dashboard
  if (p.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <OnboardingFlow playerName={p.full_name} />
    </div>
  );
}
