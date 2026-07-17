import { DB } from "@/features/scoring";

/**
 * Playing XI validation utilities (server + client shareable).
 *
 * All functions operate on the existing `playing_xi` table schema.
 */

export interface XiPlayer {
  player_id: string;
  team_id: string;
}

export function validateTeamSize(
  players: string[],
  label: string,
  expectedSize: number,
): string | null {
  if (players.length !== expectedSize) {
    return `${label} must have exactly ${expectedSize} players (selected: ${players.length}).`;
  }
  return null;
}

export function validateOpenerInXi(
  playerId: string | undefined | null,
  xiPlayerIds: string[],
  label: string,
): string | null {
  if (!playerId) return `${label} must be selected.`;
  if (!xiPlayerIds.includes(playerId)) {
    return `${label} is not in the Playing XI.`;
  }
  return null;
}

export function filterBattingOptions(
  allXiIds: string[],
  dismissedIds: Set<string>,
  strikerId: string | null,
  nonStrikerId: string | null,
): string[] {
  return allXiIds.filter((id) => {
    if (id === strikerId) return false;
    if (id === nonStrikerId) return false;
    if (dismissedIds.has(id)) return false;
    return true;
  });
}

export function filterBowlingOptions(
  allXiIds: string[],
  currentBowlerId: string | null,
): string[] {
  return allXiIds.filter((id) => {
    if (id === currentBowlerId) return false;
    return true;
  });
}

export function buildXiMap(rows: XiPlayer[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = map.get(row.team_id) ?? new Set<string>();
    set.add(row.player_id);
    map.set(row.team_id, set);
  }
  return map;
}

export function assertPlayersInXi(
  playerIds: string[],
  xiIds: Set<string>,
  label: string,
): string | null {
  const invalid = playerIds.filter((id) => !xiIds.has(id));
  if (invalid.length > 0) {
    return `${label} contains players not in the Playing XI: ${invalid.join(", ")}.`;
  }
  return null;
}
