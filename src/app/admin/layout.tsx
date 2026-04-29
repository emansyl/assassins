import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) redirect("/");

  const userEmail = claims.email as string | undefined;
  const isGameMaster = userEmail === process.env.GAME_MASTER_EMAIL;

  // Allow access if user is the game master OR a demo user (read-only).
  let isDemo = false;
  if (!isGameMaster) {
    const { data: player } = await supabase
      .from("players")
      .select("is_demo")
      .eq("id", claims.sub as string)
      .single();
    isDemo = !!(player as { is_demo: boolean } | null)?.is_demo;

    if (!isDemo) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-terminal-dim p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-terminal-amber text-xs tracking-widest glow-amber">
            COMMAND CONSOLE
            {isDemo && (
              <span className="ml-2 text-terminal-red border border-terminal-red/50 px-2 py-0.5 text-[10px]">
                DEMO MODE — READ-ONLY
              </span>
            )}
          </div>
          <div className="text-terminal-dim text-[10px]">
            {isDemo ? "DEMO USER" : "GAME MASTER"}: {userEmail}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">{children}</main>
    </div>
  );
}
