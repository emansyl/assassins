"use client";

import { useState } from "react";
import { TerminalBadge } from "@/components/ui/terminal-badge";

type LeaderboardEntry = {
  player_id: string;
  full_name: string;
  nickname: string | null;
  kill_count: number;
  status: string;
  eliminated_at: string | null;
};

type SortKey = "kill_count" | "status" | "full_name";

export function RankingsTable({
  entries,
  currentPlayerId,
}: {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("kill_count");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...entries].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === "kill_count") return (b.kill_count - a.kill_count) * dir;
    if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
    return a.full_name.localeCompare(b.full_name) * dir;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-terminal-dim border-b border-terminal-dim">
            <th className="py-2 px-2 text-left w-8">#</th>
            <th
              className="py-2 px-2 text-left cursor-pointer hover:text-terminal-green"
              onClick={() => handleSort("full_name")}
            >
              OPERATIVE {sortKey === "full_name" ? (sortAsc ? "^" : "v") : ""}
            </th>
            <th
              className="py-2 px-2 text-right cursor-pointer hover:text-terminal-green"
              onClick={() => handleSort("kill_count")}
            >
              KILLS {sortKey === "kill_count" ? (sortAsc ? "^" : "v") : ""}
            </th>
            <th
              className="py-2 px-2 text-right cursor-pointer hover:text-terminal-green"
              onClick={() => handleSort("status")}
            >
              STATUS {sortKey === "status" ? (sortAsc ? "^" : "v") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => {
            const isCurrentPlayer = entry.player_id === currentPlayerId;
            const isAlive = entry.status === "alive";

            return (
              <tr
                key={entry.player_id}
                className={`
                  border-b border-terminal-dim/30
                  ${isCurrentPlayer ? "bg-terminal-green/5" : ""}
                  ${!isAlive ? "opacity-50" : ""}
                `}
              >
                <td className="py-2 px-2 text-terminal-dim">
                  {idx + 1}
                </td>
                <td className="py-2 px-2">
                  <span className={isCurrentPlayer ? "text-terminal-green" : "text-terminal-text"}>
                    {entry.full_name}
                  </span>
                  {entry.nickname && (
                    <span className="text-terminal-dim ml-1">
                      ({entry.nickname})
                    </span>
                  )}
                  {isCurrentPlayer && (
                    <span className="text-terminal-green ml-1">&lt;YOU&gt;</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-terminal-green font-bold">
                  {entry.kill_count}
                </td>
                <td className="py-2 px-2 text-right">
                  <TerminalBadge variant={isAlive ? "active" : "eliminated"}>
                    {isAlive ? "ACTIVE" : "KIA"}
                  </TerminalBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {entries.length === 0 && (
        <div className="text-center text-terminal-dim text-xs py-8">
          NO OPERATIVE DATA AVAILABLE
        </div>
      )}
    </div>
  );
}
