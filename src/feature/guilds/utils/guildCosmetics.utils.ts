import type {
  CosmeticSlot,
  GuildCosmeticItem,
} from "feature/guilds/data/guildCosmetics";
import {
  DEFAULT_COSMETIC,
  findCosmetic,
} from "feature/guilds/data/guildCosmetics";
import type { GuildCosmetics } from "feature/guilds/types/guild.types";

/**
 * Reading what a guild wears, and deciding whether it may.
 *
 * Every function here answers from the stored ids alone and always has an
 * answer: an id the catalog has never heard of, an id belonging to another
 * slot, a document written before cosmetics existed — all of them resolve to
 * the slot's default item rather than to nothing. A guild card is drawn on
 * every visit to the page, and none of those cases is worth a blank one.
 *
 * The server leans on the same fallbacks. `equip` calling `canEquip` here means
 * the client's "this is wearable" and the server's are one implementation, not
 * two that agree until somebody edits one of them. Who may call it at all is
 * the server's question alone — see `guildCosmetics.ts`.
 */

/** The stored blob, normalised — the shape the rest of the app may assume. */
export const readCosmetics = (raw: unknown): GuildCosmetics => {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    accent:
      typeof data.accent === "string"
        ? data.accent
        : DEFAULT_COSMETIC.accent.id,
    banner:
      typeof data.banner === "string"
        ? data.banner
        : DEFAULT_COSMETIC.banner.id,
    frame:
      typeof data.frame === "string" ? data.frame : DEFAULT_COSMETIC.frame.id,
  };
};

export const EMPTY_COSMETICS: GuildCosmetics = readCosmetics(null);

/**
 * What is actually worn in a slot. Falls back to the slot's default when the
 * stored id is unknown or belongs to a different slot — which is what keeps a
 * hand-edited document from dressing a guild in nothing at all.
 */
export const equippedItem = (
  cosmetics: GuildCosmetics,
  slot: CosmeticSlot,
): GuildCosmeticItem => {
  const item = findCosmetic(cosmetics[slot]);
  return item && item.slot === slot ? item : DEFAULT_COSMETIC[slot];
};

/** The colour everything else in the kit is drawn from. */
export const accentHex = (cosmetics: GuildCosmetics): string =>
  equippedItem(cosmetics, "accent").hex ?? DEFAULT_COSMETIC.accent.hex!;

export type CosmeticProblem = "unknown" | "already-worn";

/** Whether this is a thing the guild can put on right now, and why not. */
export const canEquip = (
  cosmetics: GuildCosmetics,
  id: string,
): CosmeticProblem | null => {
  const item = findCosmetic(id);
  if (!item) return "unknown";
  return cosmetics[item.slot] === id ? "already-worn" : null;
};

export const COSMETIC_PROBLEM_MESSAGES: Record<CosmeticProblem, string> = {
  unknown: "No such thing in the catalogue",
  "already-worn": "Already worn",
};
