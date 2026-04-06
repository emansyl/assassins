"use client";

import { useState, useEffect } from "react";

export function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setUrgent(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${String(hours).padStart(2, "0")}h`);
      parts.push(`${String(minutes).padStart(2, "0")}m`);
      parts.push(`${String(seconds).padStart(2, "0")}s`);

      setTimeLeft(parts.join(" "));
      setUrgent(diff < 24 * 60 * 60 * 1000); // < 24 hours
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  return (
    <div
      className={`
        border px-3 py-2 text-center
        ${urgent
          ? "border-terminal-red/50 text-terminal-red animate-pulse-amber glow-red"
          : "border-terminal-amber/50 text-terminal-amber glow-amber"
        }
      `}
    >
      <div className="text-[10px] uppercase tracking-widest mb-1">
        Mission Deadline
      </div>
      <div className="text-lg font-bold tracking-wider">
        {timeLeft}
      </div>
    </div>
  );
}
