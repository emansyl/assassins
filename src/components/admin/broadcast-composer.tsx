"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

export function BroadcastComposer({ players }: { players: Player[] }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientId, setRecipientId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createUntypedClient();

  async function handleSend() {
    if (!body.trim()) return;
    setLoading(true);

    const message = {
      sender: "COMMAND",
      subject: subject || null,
      body: body.trim(),
      recipient_id: recipientId === "all" ? null : recipientId,
      channel: "app" as const,
    };

    const { error } = await supabase.from("messages").insert(message);

    setLoading(false);

    if (error) {
      alert(`Transmission failed: ${error.message}`);
      return;
    }

    setSuccess(true);
    setSubject("");
    setBody("");
    setTimeout(() => setSuccess(false), 2000);
    router.refresh();
  }

  return (
    <TerminalCard title="Broadcast Transmission">
      <div className="space-y-3">
        {/* Recipient selector */}
        <div className="space-y-1">
          <div className="text-terminal-dim text-[10px] uppercase">Recipient</div>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full bg-terminal-bg border border-terminal-dim px-2 py-1 text-xs text-terminal-text font-mono outline-none focus:border-terminal-green"
          >
            <option value="all">ALL OPERATIVES</option>
            <option value="active">ACTIVE OPERATIVES ONLY</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <div className="text-terminal-dim text-[10px] uppercase">Subject</div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="PRIORITY TRANSMISSION"
            className="w-full bg-terminal-bg border border-terminal-dim px-2 py-1 text-xs text-terminal-text font-mono placeholder:text-terminal-dim/50 outline-none focus:border-terminal-green"
          />
        </div>

        {/* Body */}
        <div className="space-y-1">
          <div className="text-terminal-dim text-[10px] uppercase">Message</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Compose your transmission..."
            rows={4}
            className="w-full bg-terminal-bg border border-terminal-dim p-2 text-xs text-terminal-text font-mono placeholder:text-terminal-dim/50 outline-none focus:border-terminal-green resize-none"
          />
        </div>

        {success && (
          <div className="text-terminal-green text-xs text-center">
            TRANSMISSION SENT SUCCESSFULLY
          </div>
        )}

        <TerminalButton
          variant="warning"
          onClick={handleSend}
          loading={loading}
          disabled={!body.trim()}
          className="w-full"
        >
          Transmit
        </TerminalButton>
      </div>
    </TerminalCard>
  );
}
