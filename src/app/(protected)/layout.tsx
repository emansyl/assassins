import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    // If there's an expired/corrupt session, sign out to clear stale cookies
    // and break the redirect loop (middleware thinks we're auth'd, but we're not)
    if (error) {
      await supabase.auth.signOut();
    }
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScanlineOverlay />
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
