"use client";

import { useState } from "react";
import { RankingsTable } from "./rankings-table";
import { NotorietyTable, type NotorietyEntry } from "./notoriety-table";

type Tab = "kills" | "notoriety";

type KillsEntry = {
  player_id: string;
  full_name: string;
  nickname: string | null;
  kill_count: number;
  status: string;
  eliminated_at: string | null;
};

export function LeaderboardTabs({
  killsEntries,
  notorietyEntries,
  currentPlayerId,
}: {
  killsEntries: KillsEntry[];
  notorietyEntries: NotorietyEntry[];
  currentPlayerId?: string;
}) {
  const [tab, setTab] = useState<Tab>("kills");

  return (
    <div className="space-y-3">
      <div className="flex border border-terminal-dim">
        <button
          onClick={() => setTab("kills")}
          className={`flex-1 py-2 text-xs uppercase tracking-widest font-mono transition-colors ${
            tab === "kills"
              ? "bg-terminal-green/10 text-terminal-green glow-green"
              : "text-terminal-muted hover:text-terminal-text"
          }`}
        >
          [KILLS]
        </button>
        <button
          onClick={() => setTab("notoriety")}
          className={`flex-1 py-2 text-xs uppercase tracking-widest font-mono transition-colors border-l border-terminal-dim ${
            tab === "notoriety"
              ? "bg-terminal-green/10 text-terminal-green glow-green"
              : "text-terminal-muted hover:text-terminal-text"
          }`}
        >
          [NOTORIETY]
        </button>
      </div>

      <div className="text-center text-terminal-dim text-[10px]">
        {tab === "kills" ? "— DIRECT ELIMINATIONS —" : "— CUMULATIVE INFLUENCE —"}
      </div>

      {tab === "kills" ? (
        <RankingsTable entries={killsEntries} currentPlayerId={currentPlayerId} />
      ) : (
        <NotorietyTable entries={notorietyEntries} currentPlayerId={currentPlayerId} />
      )}
    </div>
  );
}
