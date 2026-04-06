"use client";

import { useState } from "react";

const RULES_SECTIONS = [
  {
    title: "MISSION OVERVIEW",
    content: `Each operative is assigned a single target. Your mission is to eliminate your target before they — or someone else — eliminates you. When you eliminate your target, you inherit their target, creating a continuous chain of assignments until only one operative remains.`,
  },
  {
    title: "RULES OF ENGAGEMENT",
    content: `1. Eliminations must be confirmed with a selfie photo of you and your target together.
2. You may only eliminate your assigned target — no freelance operations.
3. Eliminations must take place in person. No digital or remote eliminations.
4. Safe zones: During class, in Aldrich Hall during section, and during official HBS events. All other locations are fair game.
5. No physical contact is required — a verbal "you're eliminated" with photo evidence is sufficient.
6. You may use deception, disguises, and allies to locate your target. Creative tactics are encouraged.`,
  },
  {
    title: "CONFIRMATION PROTOCOL",
    content: `After eliminating your target:
1. Take a selfie with your target as proof.
2. Open the app and tap "CONFIRM ELIMINATION."
3. Upload the selfie and submit.
4. Your target will be notified and marked as eliminated.
5. You will receive your new assignment immediately.`,
  },
  {
    title: "MISSION DEADLINES",
    content: `Command may set mission deadlines. If a deadline is active, all operatives must complete their current assignment before the deadline expires. Operatives who fail to eliminate their target by the deadline will be automatically deactivated.`,
  },
  {
    title: "VICTORY CONDITIONS",
    content: `The last operative standing is declared the winner. The game may also end if Command decides to conclude operations early, in which case the operative with the most eliminations wins.`,
  },
  {
    title: "CODE OF CONDUCT",
    content: `1. No elimination attempts during exams or official academic activities.
2. Respect "no" — if your target asks you to stop in a genuine (non-game) context, back off.
3. No breaking and entering. No accessing locked spaces you don't have permission to enter.
4. Keep it fun. This is a game. Don't let it interfere with academics or personal boundaries.
5. The Game Master's decisions are final.`,
  },
];

function RuleSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-terminal-dim">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-terminal-bg-light transition-colors"
      >
        <span className="text-terminal-green text-xs">
          {open ? "v" : ">"}
        </span>
        <span className="text-terminal-green text-xs uppercase tracking-widest flex-1">
          {title}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-terminal-text text-xs leading-relaxed whitespace-pre-line border-t border-terminal-dim/30 pt-3">
          {content}
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-terminal-green text-sm glow-green tracking-widest">
          FIELD MANUAL
        </div>
        <div className="text-terminal-dim text-[10px]">
          OPERATIONS GUIDE — READ BEFORE DEPLOYMENT
        </div>
      </div>

      <div className="space-y-2">
        {RULES_SECTIONS.map((section) => (
          <RuleSection key={section.title} {...section} />
        ))}
      </div>
    </div>
  );
}
