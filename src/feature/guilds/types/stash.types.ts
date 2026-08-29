import type {
  EffectInventoryItem,
  InventoryItem,
  PartId,
  PartTier,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";

export type StashItemKind = "guitar" | "effect" | "part" | "mod";

interface StashEntryBase {
  id: string;
  name: string;
  /** A gear rarity, a part's tier, or a mod's bonus — whatever ranks the thing. */
  rarity: string;
  depositedByUid: string;
  depositedByName: string;
  depositedAt: string;
}

/**
 * One thing sitting in the guild's stash, free for any member to take.
 *
 * `item` is the instance, wallet stack or mod exactly as it sat in its owner's
 * arsenal. It is carried to the client whole so the shelf can be drawn with the
 * Arsenal's own sockets rather than a second, thinner idea of what an item
 * looks like — the shelf and the player's own cabinet are the same board.
 */
export type StashEntry =
  | (StashEntryBase & { kind: "guitar"; item: InventoryItem })
  | (StashEntryBase & { kind: "effect"; item: EffectInventoryItem })
  | (StashEntryBase & { kind: "part"; item: ScrapPart })
  | (StashEntryBase & { kind: "mod"; item: SalvagedMod });

/**
 * What a member is putting on the shelf.
 *
 * Gear moves as an instance, a mod moves as itself, and parts move as an
 * amount — they are a currency and stack, so "which stack, how many" is the
 * only way to say it.
 */
export type StashDeposit =
  | { kind: "guitar" | "effect"; inventoryItemId: string }
  | { kind: "part"; partId: PartId; tier: PartTier; qty: number }
  | { kind: "mod"; modId: string };

export interface StashLogEntry {
  id: string;
  action: "deposit" | "take";
  uid: string;
  displayName: string;
  itemName: string;
  rarity: string;
  at: string;
}

/**
 * Give-and-take per member, counted off the log.
 *
 * This is the half that makes the stash self-policing: a shelf anyone can empty
 * needs the emptying to be visible, so somebody who only ever takes reads as
 * exactly that next to the people stocking it.
 */
export interface StashTally {
  uid: string;
  displayName: string;
  deposited: number;
  taken: number;
}

export interface GuildStash {
  entries: StashEntry[];
  log: StashLogEntry[];
  tallies: StashTally[];
}
