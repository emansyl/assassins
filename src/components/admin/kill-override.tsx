"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

export function KillOverride({ players }: { players: Player[] }) {
  const [assassinId, setAssassinId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const supabase = createUntypedClient();

  const alivePlayers = players.filter((p) => p.status === "alive");

  async function handleOverride() {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    if (!assassinId || !targetId) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("confirm_kill", {
      p_assassin_id: assassinId,
      p_target_id: targetId,
      p_confirmed_by: "admin",
      p_notes: "Manual kill override by Game Master",
    });

    setLoading(false);
    setConfirm(false);

    if (error) {
      alert(`Override failed: ${error.message}`);
    } else {
      const result = data as { success: boolean; error?: string } | null;
      if (result?.success) {
        alert("Kill confirmed.");
        setAssassinId("");
        setTargetId("");
      } else {
        alert(`Failed: ${result?.error}`);
      }
    }

    router.refresh();
  }

  return (
    <TerminalCard title="Kill Override" variant="danger">
      <div className="space-y-3">
        <div className="text-terminal-red text-[10px]">
          MANUAL KILL CONFIRMATION — USE WITH CAUTION
        </div>

        <div className="space-y-1">
          <div className="text-terminal-dim text-[10px] uppercase">Assassin</div>
          <select
            value={assassinId}
            onChange={(e) => { setAssassinId(e.target.value); setConfirm(false); }}
            className="w-full bg-terminal-bg border border-terminal-dim px-2 py-1 text-xs text-terminal-text font-mono outline-none focus:border-terminal-green"
          >
            <option value="">Select operative...</option>
            {alivePlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-terminal-dim text-[10px] uppercase">Target (Eliminated)</div>
          <select
            value={targetId}
            onChange={(e) => { setTargetId(e.target.value); setConfirm(false); }}
            className="w-full bg-terminal-bg border border-terminal-dim px-2 py-1 text-xs text-terminal-text font-mono outline-none focus:border-terminal-green"
          >
            <option value="">Select target...</option>
            {alivePlayers
              .filter((p) => p.id !== assassinId)
              .map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
          </select>
        </div>

        <TerminalButton
          variant="danger"
          onClick={handleOverride}
          loading={loading}
          disabled={!assassinId || !targetId}
          className="w-full"
        >
          {confirm ? "CONFIRM OVERRIDE" : "EXECUTE KILL OVERRIDE"}
        </TerminalButton>
      </div>
    </TerminalCard>
  );
}
