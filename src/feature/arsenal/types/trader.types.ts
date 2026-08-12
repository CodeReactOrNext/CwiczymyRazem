import type {
  EffectInventoryItem,
  InventoryItem,
  PartId,
  PartTier,
  SalvagedMod,
  ScrapPart,
  WorkshopKind,
} from "./arsenal.types";

export type TraderOfferKind = "part" | "guitar" | "effect" | "mod";

interface TraderOfferBase {
  /** Stable within a window: `${window}-${slot}`. Also the key in `TraderState.bought`. */
  id: string;
  kind: TraderOfferKind;
  /** Pieces this window stocks. Doubles as the per-player daily limit. */
  stock: number;
  /** Fame per piece, after any deal-of-the-day cut — what the player actually pays. */
  unitPrice: number;
  /** Fame per piece before the cut. Equal to `unitPrice` at full price. */
  basePrice: number;
  /** 0 when the offer is at full price. */
  discountPct: number;
}

export interface TraderPartOffer extends TraderOfferBase {
  kind: "part";
  partId: PartId;
  tier: PartTier;
}

/**
 * The rolled halves of an instance — everything except the ids only the server
 * can hand out (`id`, `serial`, `acquiredAt`). Rolled from the window seed, so
 * the card shows the exact guitar the purchase will mint.
 */
export type TraderGuitarRoll = Pick<
  InventoryItem,
  "guitarId" | "year" | "country" | "condition" | "stats" | "features"
>;

export type TraderEffectRoll = Pick<
  EffectInventoryItem,
  "effectId" | "year" | "country" | "condition" | "stats" | "features"
>;

export interface TraderGuitarOffer extends TraderOfferBase {
  kind: "guitar";
  roll: TraderGuitarRoll;
}

export interface TraderEffectOffer extends TraderOfferBase {
  kind: "effect";
  roll: TraderEffectRoll;
}

/**
 * The day's mod: a loose component, sold the way a teardown hands one over.
 *
 * It is not fitted to anything at the counter — it lands in the stash as a
 * `SalvagedMod` and goes onto whatever instrument the player later drags it
 * onto, which is the one route to a mod that does not require owning the parts
 * for it first.
 */
export interface TraderModOffer extends TraderOfferBase {
  kind: "mod";
  /** Which pool the feature belongs to — a pedal mod never fits a guitar. */
  modKind: WorkshopKind;
  featureId: string;
  label: string;
  /** The rolled value, fixed from the window seed like every other offer. */
  points: number;
  /** The pool's range, so the card can say how good the roll is. */
  minPoints: number;
  maxPoints: number;
}

export type TraderItemOffer = TraderGuitarOffer | TraderEffectOffer;
export type TraderOffer = TraderPartOffer | TraderItemOffer | TraderModOffer;

export interface TraderShop {
  /** The window the offers belong to — sent with every purchase. */
  window: number;
  /** When this stock is replaced. */
  restockAt: number;
  offers: TraderOffer[];
}

/** Persisted at `arsenal.trader`. Reset the moment the window changes. */
export interface TraderState {
  window: number;
  /** Pieces already bought this window, by offer id. */
  bought: Record<string, number>;
}

export interface TraderBuyResult {
  offerId: string;
  kind: TraderOfferKind;
  qty: number;
  /** Fame charged. */
  spent: number;
  newFame: number;
  /** Pieces bought so far this window on this offer, after the purchase. */
  bought: number;
  /** Parts purchases only — the wallet after the purchase. */
  newParts?: ScrapPart[];
  /** Item purchases only — the minted instance. */
  item?: InventoryItem | EffectInventoryItem;
  /** Item purchases only — first copy of this model the player has ever owned. */
  isNewToDex?: boolean;
  /** Mod purchases only — the stash entry the counter handed over. */
  mod?: SalvagedMod;
}
