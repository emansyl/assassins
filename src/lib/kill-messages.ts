// Funny kill feed messages, deterministically picked by kill ID

const KILL_MESSAGES = [
  "{assassin} sent {target} to the shadow realm",
  "{target} got spooned into oblivion by {assassin}",
  "{assassin} removed {target} from the org chart",
  "{target} didn't see {assassin} coming. Nobody ever does.",
  "{assassin} added {target} to their LinkedIn: 'Eliminated'",
  "{target} was last seen running from {assassin}",
  "{assassin} made {target} an offer they couldn't refuse",
  "{target} brought a case study to a spoon fight",
  "RIP {target}. {assassin} sends their regards.",
  "{assassin} just ruined {target}'s Skydeck plans",
  "{target} got caught lacking by {assassin}",
  "{assassin} spooned {target} with extreme prejudice",
  "Another one bites the dust. {assassin} claims {target}.",
  "{target} has been forcibly removed from the game by {assassin}",
  "{assassin} performed a hostile takeover of {target}'s assignment",
  "{target} should have stayed home. {assassin} was waiting.",
  "{assassin} added 'Assassin' to their resume. {target} was the reference.",
  "{target} trusted the wrong person. It was {assassin}.",
  "{assassin} took {target} out faster than a 2+2 case discussion",
  "Breaking: {target} has been delisted by {assassin}",
  "{target} zigged when they should have zagged. {assassin} was ready.",
  "{assassin} just sent {target} to the shadow board",
  "BREAKING NEWS: {target} has been acquired by {assassin} in a hostile spoonover",
  "{target} forgot rule #1: always watch your back. {assassin} didn't.",
  "{assassin} caught {target} without their spoon. Classic rookie mistake.",
  "{target} tried to run. {assassin} was faster.",
  "One less competitor. {assassin} sends {target} packing.",
  "{assassin} just disrupted {target}'s whole operation",
  "{target}'s strategy didn't account for {assassin}'s ambush",
  "{assassin} executed a flawless takedown on {target}. No survivors.",
];

const SELF_ELIMINATE_MESSAGES = [
  "{target} fell off a cliff during a team-building exercise",
  "{target} died of food poisoning at Spangler",
  "{target} committed seppuku with their own spoon",
  "{target} went into witness protection",
  "{target} got lost in Aldrich Hall and was never seen again",
  "{target} challenged the wrong person to a case competition",
  "{target} couldn't handle the cold call pressure",
  "{target} was consumed by the HBS case method",
  "{target} defected to Stanford",
  "{target} caught a fatal case of FOMO",
  "{target} drowned in a sea of Slack notifications",
  "{target} got taken out by a rogue RC chair",
  "{target} spontaneously combusted during a finance exam",
  "{target} quit to pursue a career in professional hide-and-seek",
  "{target} was eliminated by their own paranoia",
];

const AUTO_ELIMINATE_MESSAGE =
  "SYSTEM AUTO-KILL: {target} failed verification protocol — 3 incorrect attempts";

/**
 * Deterministic hash from a string → stable index into an array.
 * Same kill ID always produces the same message.
 */
function hashToIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return ((hash % length) + length) % length;
}

export type KillType = "kill" | "self" | "auto";

export function getKillMessage(
  killId: string,
  type: KillType,
  assassinName: string,
  targetName: string
): string {
  let template: string;

  if (type === "auto") {
    template = AUTO_ELIMINATE_MESSAGE;
  } else if (type === "self") {
    template = SELF_ELIMINATE_MESSAGES[hashToIndex(killId, SELF_ELIMINATE_MESSAGES.length)];
  } else {
    template = KILL_MESSAGES[hashToIndex(killId, KILL_MESSAGES.length)];
  }

  return template
    .replace(/\{assassin\}/g, assassinName)
    .replace(/\{target\}/g, targetName);
}

/**
 * Determine kill type from the confirmed_by field.
 */
export function getKillType(confirmedBy: string): KillType {
  if (confirmedBy === "self") return "self";
  // Auto-eliminations are stored with confirmed_by = "app" but have a specific notes pattern
  // We check notes content in the feed component instead
  return "kill";
}
