import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const userEmail = user.email || user.user_metadata?.email;
  if (userEmail !== process.env.GAME_MASTER_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-terminal-dim p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-terminal-amber text-xs tracking-widest glow-amber">
            COMMAND CONSOLE
          </div>
          <div className="text-terminal-dim text-[10px]">
            GAME MASTER: {userEmail}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
