"use client";

import { useState } from "react";

const RULES_SECTIONS = [
  {
    title: "OBJECTIVE",
    content: `Eliminate your assigned target. Don't get eliminated.

When you eliminate your target, you inherit their target.

Last person standing wins the trophy.`,
  },
  {
    title: "PARTICIPATION",
    content: `• Everyone is in by default.
• If you don't want to play, you must volunteer to be eliminated.`,
  },
  {
    title: "HOW TO ELIMINATE",
    content: `• Touch your target with your spoon.
• It must be clear and undeniable.
• If their spoon is NOT in their hand → they are out.`,
  },
  {
    title: "KILL CONFIRMATION",
    content: `Every elimination must be confirmed:

1. Take a selfie with your target.
2. You must be holding your spoon.
3. Post the photo in the group chat.
4. Feel free to get creative.

If it's not posted, it didn't happen.`,
  },
  {
    title: "AFTER A KILL",
    content: `• Your target tells you who their target was.
• That becomes your new target immediately.
• If there's confusion → ask the game master.`,
  },
  {
    title: "GAMEPLAY",
    content: `• The game is always live.
• You can run, hide, and strategize.
• Yes, even at parties, outside, or while drunk.`,
  },
  {
    title: "SAFE ZONES",
    content: `There are only TWO safe conditions:

SAFE TIME — During official class time only
  • Class ends early → still safe
  • Class runs late → still safe
  • Game resumes when we finish clapping

SAFE PLACE — Inside your bedroom only
  • Outside your door = NOT safe

Everything else is fair game: bathrooms, dorms, restaurants, hallways, etc.`,
  },
  {
    title: "SPOON RULES",
    content: `• You are only safe if your spoon is IN YOUR HAND.
• Pocket, bag, or dropped = vulnerable.`,
  },
  {
    title: "TRACKING",
    content: `• The group chat is used for all kills and updates.
• The game master will track everything.
• Additional rules may be added if needed to speed things up.`,
  },
  {
    title: "WINNING",
    content: `Last person standing wins.

Bonus stats:
• Most kills
• Fastest kill
• Funniest elimination photo`,
  },
  {
    title: "HONOR SYSTEM",
    content: `• Be honest.
• No aggression.
• Don't make it weird — it's just a game.`,
  },
  {
    title: "OTHER NOTES",
    content: `• Sick or traveling → still in the game. No pausing.
• Want to quit? You must let your assassin eliminate you.
• Alliances are allowed… but don't trust anyone.`,
  },
];

function RuleSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-terminal-dim">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-terminal-bg-light transition-colors active:bg-terminal-bg-light"
      >
        <span className="text-terminal-green text-base shrink-0">
          {open ? "▾" : "▸"}
        </span>
        <span className="text-terminal-green text-sm uppercase tracking-wider flex-1 font-bold">
          {title}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-terminal-text text-sm leading-relaxed whitespace-pre-line border-t border-terminal-dim/30 pt-3">
          {content}
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-5 pb-20">
      <div className="text-center space-y-2">
        <div className="text-terminal-green text-base glow-green tracking-widest font-bold">
          FIELD MANUAL
        </div>
        <div className="text-terminal-dim text-xs tracking-wide">
          OFFICIAL RULES &amp; GUIDELINES
        </div>
        <div className="text-terminal-amber text-xs tracking-wide">
          GAME START: FRIDAY, END OF SKYDECK
        </div>
      </div>

      <div className="border border-terminal-red/50 p-4 text-center">
        <div className="text-terminal-red text-sm font-bold glow-red leading-relaxed">
          ELIMINATE YOUR TARGET.
          <br />
          DON&apos;T GET ELIMINATED.
        </div>
      </div>

      <div className="space-y-2">
        {RULES_SECTIONS.map((section) => (
          <RuleSection key={section.title} {...section} />
        ))}
      </div>

      <div className="text-center text-terminal-amber text-sm tracking-wider pt-4 glow-amber">
        GOOD LUCK.
        <br />
        STAY READY.
        <br />
        TRUST NO ONE.
      </div>
    </div>
  );
}
