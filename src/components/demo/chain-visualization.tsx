"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/terminal-card";
import { TerminalButton } from "@/components/ui/terminal-button";
import { DemoBanner } from "./demo-banner";

export type ChainPlayer = {
  id: string;
  full_name: string;
  photo_url: string | null;
};

type Node = {
  id: string;
  full_name: string;
  photo_url: string | null;
  alive: boolean;
};

const NODE_RADIUS_PCT = 8;       // node circle radius as % of container
const RING_RADIUS_PCT = 38;      // distance from center to node centers, as %

function nodePosition(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + RING_RADIUS_PCT * Math.cos(angle),
    y: 50 + RING_RADIUS_PCT * Math.sin(angle),
    angle,
  };
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function ChainVisualization({ players }: { players: ChainPlayer[] }) {
  const initial: Node[] = players.map((p) => ({ ...p, alive: true }));

  const [nodes, setNodes] = useState<Node[]>(initial);
  const [chain, setChain] = useState<number[]>(initial.map((_, i) => i));
  const [caption, setCaption] = useState<string>(
    "Each operative hunts the next one in the chain. The last loops back to the first — a closed circle. Tap SIMULATE KILL to see what happens when an operative is eliminated."
  );

  const aliveCount = nodes.filter((n) => n.alive).length;
  const aliveChain = chain.filter((i) => nodes[i].alive);

  function reset() {
    setNodes(initial);
    setChain(initial.map((_, i) => i));
    setCaption(
      "Reset. Each operative hunts the next one in the chain. Try simulating a kill."
    );
  }

  function simulateKill() {
    if (aliveChain.length <= 1) return;

    // Pick a random alive node from the chain
    const aliveChainIndices = chain
      .map((nodeIdx, chainPos) => ({ nodeIdx, chainPos }))
      .filter(({ nodeIdx }) => nodes[nodeIdx].alive);

    const pick = aliveChainIndices[Math.floor(Math.random() * aliveChainIndices.length)];
    const victimIdx = pick.nodeIdx;

    // Hunter is the previous alive in the chain (wraps around)
    const victimChainPos = aliveChainIndices.findIndex((x) => x.nodeIdx === victimIdx);
    const hunterIdx =
      aliveChainIndices[
        (victimChainPos - 1 + aliveChainIndices.length) % aliveChainIndices.length
      ].nodeIdx;

    const newNodes = nodes.map((n, i) =>
      i === victimIdx ? { ...n, alive: false } : n
    );
    setNodes(newNodes);

    const remainingAlive = newNodes.filter((n) => n.alive);

    if (remainingAlive.length === 1) {
      // Final state — sole survivor wins
      setCaption(
        `🏆 ${remainingAlive[0].full_name} is the last operative standing — they win the game! ` +
          `In the live game, this triggers a final broadcast and the leaderboard shows the winner.`
      );
    } else if (remainingAlive.length === 2) {
      // Penultimate state — 1v1 showdown
      setCaption(
        `${nodes[victimIdx].full_name} was eliminated by ${nodes[hunterIdx].full_name}. ` +
          `Only 2 operatives remain — they're now hunting each other in a final standoff.`
      );
    } else {
      const inheritedTargetIdx =
        aliveChainIndices[(victimChainPos + 1) % aliveChainIndices.length].nodeIdx;
      setCaption(
        `${nodes[victimIdx].full_name} was eliminated by ${nodes[hunterIdx].full_name}. ` +
          `${shortName(nodes[hunterIdx].full_name)}'s new target is ${shortName(
            nodes[inheritedTargetIdx].full_name
          )} — the chain stays a single closed loop.`
      );
    }
  }

  // Build the arrow segments using the live chain (skip dead nodes)
  const positions = nodes.map((_, i) => nodePosition(i, nodes.length));
  const aliveOrder = chain.filter((i) => nodes[i].alive);
  const arrows = aliveOrder.map((nodeIdx, i) => {
    const fromIdx = nodeIdx;
    const toIdx = aliveOrder[(i + 1) % aliveOrder.length];
    return { fromIdx, toIdx };
  });

  return (
    <div className="space-y-4">
      <DemoBanner
        navLinks={[
          { href: "/dashboard", label: "← BACK TO DASHBOARD" },
          { href: "/admin", label: "→ ADMIN CONSOLE" },
        ]}
      />

      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm tracking-widest glow-green">
          THE HUNT CHAIN
        </div>
        <div className="text-terminal-dim text-[10px]">
          — INTERACTIVE WALKTHROUGH —
        </div>
      </div>

      <TerminalCard>
        <div className="text-terminal-dim text-[10px] mb-3">
          Each circle is a real operative pulled from the live game database
          (alive players only). Arrows show who is hunting whom.
        </div>

        {/* Visualization container */}
        <div className="relative w-full aspect-square max-w-md mx-auto">
          {/* SVG arrows */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 z" fill="#ff0040" />
              </marker>
            </defs>
            {arrows.map(({ fromIdx, toIdx }) => {
              const from = positions[fromIdx];
              const to = positions[toIdx];
              // shorten endpoints to land on node edge, not center
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const sx = from.x + ux * NODE_RADIUS_PCT;
              const sy = from.y + uy * NODE_RADIUS_PCT;
              const ex = to.x - ux * (NODE_RADIUS_PCT + 1);
              const ey = to.y - uy * (NODE_RADIUS_PCT + 1);
              return (
                <line
                  key={`${fromIdx}-${toIdx}`}
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="#ff0040"
                  strokeWidth="0.5"
                  strokeOpacity="0.6"
                  markerEnd="url(#arrowhead)"
                  style={{ transition: "all 600ms ease" }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const pos = positions[i];
            const isWinner = aliveCount === 1 && node.alive;
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`relative w-12 h-12 border-2 overflow-hidden transition-all duration-500 ${
                      isWinner
                        ? "border-terminal-amber border-glow-amber animate-pulse-amber scale-125"
                        : node.alive
                        ? "border-terminal-green/60"
                        : "border-terminal-red/60 grayscale opacity-40"
                    }`}
                  >
                    {node.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={node.photo_url}
                        alt={node.full_name}
                        className={`w-full h-full object-cover ${isWinner ? "" : "grayscale"}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-terminal-bg-light flex items-center justify-center text-terminal-dim text-lg">
                        ?
                      </div>
                    )}
                    {!node.alive && (
                      <div className="absolute inset-0 flex items-center justify-center text-terminal-red text-2xl glow-red font-bold">
                        ✕
                      </div>
                    )}
                  </div>
                  {isWinner && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">
                      👑
                    </div>
                  )}
                  <div
                    className={`text-[9px] font-mono text-center max-w-[64px] truncate ${
                      isWinner
                        ? "text-terminal-amber glow-amber font-bold"
                        : node.alive
                        ? "text-terminal-text"
                        : "text-terminal-dim line-through"
                    }`}
                  >
                    {shortName(node.full_name)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TerminalCard>

      {/* Controls */}
      <TerminalCard title="Controls">
        <div className="space-y-2">
          <TerminalButton
            variant="danger"
            onClick={simulateKill}
            disabled={aliveCount <= 1}
            className="w-full text-[10px]"
          >
            {aliveCount === 1 ? "GAME OVER" : "SIMULATE KILL"}
          </TerminalButton>
          <TerminalButton variant="ghost" onClick={reset} className="w-full text-[10px]">
            RESET
          </TerminalButton>
          {aliveCount === 1 && (
            <div className="text-terminal-amber text-[10px] text-center glow-amber">
              🏆 SOLE SURVIVOR — CLICK RESET TO PLAY AGAIN
            </div>
          )}
        </div>
      </TerminalCard>

      {/* Narrative */}
      <TerminalCard title="What just happened?" variant="warning">
        <div className="text-terminal-text text-xs leading-relaxed">{caption}</div>
      </TerminalCard>

      {/* Architecture notes */}
      <TerminalCard title="Under the Hood">
        <ul className="space-y-2 text-[11px] text-terminal-dim">
          <li>
            <span className="text-terminal-green">▸</span> Chain reassignment is
            atomic — handled in a single Postgres transaction inside the{" "}
            <code className="text-terminal-amber">confirm_kill()</code> RPC. No
            partial states are possible.
          </li>
          <li>
            <span className="text-terminal-green">▸</span> Row-Level Security
            ensures every player can only read their own active assignment.
            Other targets are invisible at the database layer.
          </li>
          <li>
            <span className="text-terminal-green">▸</span> Verification is a
            5-option multiple-choice quiz. Players must know who their own
            target&apos;s target is — proving they actually saw them. 3 wrong
            guesses = auto-elimination.
          </li>
          <li>
            <span className="text-terminal-green">▸</span> Built with Next.js 16
            React Server Components, Supabase (Postgres + Auth + Storage), Tailwind v4,
            and deployed as a PWA.
          </li>
        </ul>
      </TerminalCard>
    </div>
  );
}
