import type { EffectInventoryItem, InventoryItem } from "./arsenal.types";

export type MarketplaceItemType = "guitar" | "effect";

export type MarketplaceListingStatus = "active" | "sold" | "cancelled";

/** A player-to-player marketplace listing. One Firestore doc in `marketplace`. */
export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  sellerFrame: number;
  itemType: MarketplaceItemType;
  /** Full rolled instance held in escrow (removed from the seller's inventory). */
  item: InventoryItem | EffectInventoryItem;
  /** Instance id (== item.id) for quick lookups. */
  itemId: string;
  /** guitarId | effectId — for definition lookups on the client. */
  defId: number | string;
  // Denormalized for cards / logs / notifications:
  itemName: string;
  itemBrand: string;
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
  item: InventoryItem | EffectInventoryItem;
}
