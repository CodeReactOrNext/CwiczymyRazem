import type {
  EffectInventoryItem,
  InventoryItem,
  SalvagedMod,
} from "./arsenal.types";

/**
 * What can change hands between players.
 *
 * `mod` is the odd one out and the reason it is here: a mod is the one thing in
 * the arsenal nobody can make. The bench stopped selling them (`data/workshop.ts`),
 * so the only sources are a case roll, the one that survives a teardown, and the
 * trader's single daily offer — which leaves a player who needs one specific mod
 * waiting on a roughly 2%-a-day counter. The market is the answer: mods a player
 * cannot use are exactly the mods somebody else has been hunting.
 */
export type MarketplaceItemType = "guitar" | "effect" | "mod";

export type MarketplaceListingStatus = "active" | "sold" | "cancelled";

/** A player-to-player marketplace listing. One Firestore doc in `marketplace`. */
export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  sellerFrame: number;
  itemType: MarketplaceItemType;
  /**
   * The escrowed thing itself, held here while the listing is up and removed
   * from the seller's stash. A `SalvagedMod` for a mod listing — it carries its
   * own rolled value, so a listing is a specific `+5 Hand-wound pickups` and not
   * a generic one.
   */
  item: InventoryItem | EffectInventoryItem | SalvagedMod;
  /** Instance id (== item.id) for quick lookups. */
  itemId: string;
  /** guitarId | effectId | featureId — for definition lookups on the client. */
  defId: number | string;
  // Denormalized for cards / logs / notifications:
  itemName: string;
  itemBrand: string;
  /** Empty on a mod: a component has no rarity of its own, only a roll. */
  itemRarity: string;
  itemImageId: number | string;
  /** Normal system sell value at list time — the price floor. */
  minPrice: number;
  /** Listed price (>= minPrice). */
  price: number;
  status: MarketplaceListingStatus;
  listedAt: number;
  soldAt?: number;
  buyerId?: string;
}

/** The 5-Fame fee charged up-front when listing an item (non-refundable). */
export const MARKETPLACE_LISTING_FEE = 5;

export interface ListItemResult {
  listingId: string;
  newFame: number;
}

export interface BuyItemResult {
  newFame: number;
  itemType: MarketplaceItemType;
  item: InventoryItem | EffectInventoryItem | SalvagedMod;
}
