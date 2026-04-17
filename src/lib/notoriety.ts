export type KillRow = {
  assassin_id: string;
  target_id: string;
  confirmed_by: string;
};

/**
 * Computes cumulative kill count per assassin: their direct kills + all kills
 * made by anyone they killed, recursively down the chain.
 *
 * Only counts "real" assassinations (`confirmed_by` is `app` or `admin`).
 * Self-eliminations and auto-eliminations don't propagate notoriety.
 */
export function computeNotoriety(kills: KillRow[]): Map<string, number> {
  const realKills = kills.filter(
    (k) => k.confirmed_by === "app" || k.confirmed_by === "admin"
  );

  // assassin → list of targets they killed
  const directKills = new Map<string, string[]>();
  for (const k of realKills) {
    const targets = directKills.get(k.assassin_id);
    if (targets) targets.push(k.target_id);
    else directKills.set(k.assassin_id, [k.target_id]);
  }

  const result = new Map<string, number>();
  for (const assassinId of directKills.keys()) {
    const visited = new Set<string>();
    const queue = [...directKills.get(assassinId)!];
    while (queue.length > 0) {
      const target = queue.shift()!;
      if (visited.has(target)) continue;
      visited.add(target);
      const downstream = directKills.get(target);
      if (downstream) queue.push(...downstream);
    }
    result.set(assassinId, visited.size);
  }
  return result;
}
