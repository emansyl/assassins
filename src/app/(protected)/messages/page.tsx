import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageList } from "@/components/messages/message-list";
import type { Message } from "@/types";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch broadcasts and direct messages for this player
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`recipient_id.is.null,recipient_id.eq.${user.id}`)
    .order("sent_at", { ascending: false });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          SECURE COMMUNICATIONS
        </div>
        <div className="text-terminal-dim text-[10px]">
          TRANSMISSIONS FROM COMMAND
        </div>
      </div>

      <MessageList messages={(messages as Message[]) ?? []} />
    </div>
  );
}
