"use client";

import { useState, useEffect } from "react";

const BOOT_LINES = [
  "INITIALIZING SECTION E OPERATIONS NETWORK...",
  "VERIFYING SECURE CONNECTION... OK",
  "LOADING OPERATIVE DATABASE... OK",
  "ESTABLISHING ENCRYPTED CHANNEL... OK",
  "SYSTEM STATUS: ONLINE",
  "",
  "========================================",
  "  SECTION E OPERATIONS — CLASSIFIED",
  "========================================",
  "",
  "IDENTIFY YOURSELF, OPERATIVE.",
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        const line = BOOT_LINES[i];
        i++;
        setLines((prev) => [...prev, line]);
      } else {
        clearInterval(interval);
        setDone(true);
        setTimeout(onComplete, 800);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="space-y-1">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`text-sm ${
              line?.includes("CLASSIFIED") || line?.includes("===")
                ? "text-terminal-green glow-green"
                : line?.includes("IDENTIFY")
                ? "text-terminal-amber glow-amber"
                : "text-terminal-dim"
            }`}
          >
            {line || "\u00A0"}
          </div>
        ))}
      </div>
      {!done && (
        <span className="text-terminal-green animate-cursor-blink">_</span>
      )}
    </div>
  );
}
