"use client";

import { useState } from "react";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import type { Message } from "@/types";

export function MessageList({ messages }: { messages: Message[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createUntypedClient();

  async function handleExpand(msg: Message) {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(msg.id);

    // Mark as read if unread
    if (!msg.read_at && msg.recipient_id) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", msg.id);
    }
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-terminal-dim text-xs py-8">
        NO TRANSMISSIONS RECEIVED
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => {
        const isUnread = !msg.read_at && msg.recipient_id;
        const isExpanded = expandedId === msg.id;

        return (
          <button
            key={msg.id}
            onClick={() => handleExpand(msg)}
            className={`
              w-full text-left border p-3 transition-colors
              ${isUnread
                ? "border-terminal-green/50 bg-terminal-green/5"
                : "border-terminal-dim bg-terminal-bg-light"
              }
              ${isExpanded ? "border-terminal-green" : "hover:border-terminal-dim"}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-terminal-green flex-shrink-0" />
                  )}
                  <span className="text-terminal-amber text-[10px] uppercase">
                    {msg.sender}
                  </span>
                </div>
                {msg.subject && (
                  <div className="text-terminal-text text-xs mt-1 truncate">
                    {msg.subject}
                  </div>
                )}
              </div>
              <div className="text-terminal-dim text-[10px] flex-shrink-0">
                {new Date(msg.sent_at).toLocaleDateString()}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-terminal-dim/30 text-terminal-text text-xs leading-relaxed whitespace-pre-line">
                {msg.body}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
