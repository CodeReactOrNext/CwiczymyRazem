import type {
  EffectType,
  GuitarRarity,
  PartId,
  PartTier,
} from "feature/arsenal/types/arsenal.types";
import type {
  Backer,
  SupporterWallet,
} from "feature/supporterPanel/types/supporterPanel.types";

export type GearKind = "guitar" | "effect";

export const GEAR_KINDS: GearKind[] = ["guitar", "effect"];

/**
 * Rarities a proposal may ask for. Deliberately short of `Custom Shop`: that
 * tier is not something a case can ever drop — it only exists at the top of the
 * workshop's promotion ladder, so a player who owns one built it. Letting a
 * proposal ask for it would promise a piece of gear the game cannot hand out.
 */
export const PROPOSABLE_RARITIES: GuitarRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

export type ProposalStatus = "open" | "accepted" | "in_game" | "declined";

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "open",
  "accepted",
  "in_game",
  "declined",
];

/**
 * What the piece breaks down into on the bench. Built on the Arsenal's
 * `ScrapBom`, including the part everyone forgets: the order is the salvage
 * priority — the first slot comes off first.
 *
 * The tier is the one field the Arsenal's own `ScrapSlot` does not carry: there
 * it is rolled at teardown time from the item's rarity and the slot's place in
 * the queue. A proposal is a wish rather than a mechanic, so it says outright
 * which grade of part the proposer wants that slot to yield.
 */
export interface ProposedScrapSlot {
  partId: PartId;
  qty: number;
  tier: PartTier;
}

/**
 * A proposal while it is still being written, before it is filed.
 *
 * Kept as one object because the page that writes it has two panes: the form
 * edits the draft, the summary beside it draws the same draft as the item it
 * would become. One piece of state, handed to both, is what stops them from
 * disagreeing about what is being proposed.
 */
export interface GearDraft {
  kind: GearKind;
  name: string;
  brand: string;
  rarity: GuitarRarity;
  /** Only meaningful while the kind is a pedal. */
  effectType: EffectType;
  description: string;
  imageUrl: string;
  inscription: string;
  scrapBom: ProposedScrapSlot[];
}

export interface GearProposal {
  id: string;
  kind: GearKind;
  /** What it would be called in the Arsenal. */
  name: string;
  brand: string;
  /** Only meaningful for a pedal — which effect it is. */
  effectType: EffectType | null;
  rarity: GuitarRarity;
  description: string;
  /** https link to a picture of the gear; rendered on the card. */
  imageUrl: string | null;
  /**
   * One line the proposer wants engraved on the item if it ships. See
   * `GEAR_INSCRIPTION_MAX` — short enough to fit on a headstock.
   */
  inscription: string;
  /** Teardown plan, in salvage order. Empty means "whatever the bench decides". */
  scrapBom: ProposedScrapSlot[];
  status: ProposalStatus;
  authorUid: string;
  authorName: string;
  voteCount: number;
  backerCount: number;
  /** Who is behind it, heaviest backing first. */
  backers: Backer[];
  createdAt: string;
}

export interface GearBoard {
  proposals: GearProposal[];
  /** proposalId → how much weight I have already burned onto it. */
  myBacking: Record<string, number>;
  /** Whoever is reading, so the board can point out their own name. */
  myUid: string;
  wallet: SupporterWallet;
  isOwner: boolean;
}
