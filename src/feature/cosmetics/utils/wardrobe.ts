import { findCosmetic } from "feature/cosmetics/data/cosmeticsCatalog";
import type {
  CosmeticKind,
  CosmeticsState,
  EquippedCosmetics,
} from "feature/cosmetics/types/cosmetics.types";

/**
 * The rules of the wardrobe, kept free of Firestore so the routes and the tests
 * share one copy: what a stored document means, whether a purchase is allowed,
 * and what wearing or taking off a piece does to the two slots.
 */

export const EMPTY_WARDROBE: CosmeticsState = { owned: [], equipped: {} };

/** A stored document, whatever shape it is in, as a wardrobe that only names catalog items. */
export const readWardrobe = (data: unknown): CosmeticsState => {
  const raw = (data ?? {}) as { owned?: unknown; equipped?: EquippedCosmetics };
  const owned = Array.isArray(raw.owned)
    ? [...new Set(raw.owned.filter((id): id is string => !!findCosmetic(id)))]
    : [];

  const wearing = (slot: CosmeticKind): string | null => {
    const id = raw.equipped?.[slot];
    const item = findCosmetic(id);
    return item && item.kind === slot && owned.includes(item.id) ? item.id : null;
  };

  return {
    owned,
    equipped: { banner: wearing("banner"), avatar: wearing("avatar") },
  };
};

export type PurchaseCheck =
  | { ok: true; price: number }
  | { ok: false; reason: "unknown" | "owned" };

/** Whether the piece can be sold to this wardrobe at all. The wallet is checked by the charge. */
export const checkPurchase = (
  wardrobe: CosmeticsState,
  itemId: string,
): PurchaseCheck => {
  const item = findCosmetic(itemId);
  if (!item) return { ok: false, reason: "unknown" };
  if (wardrobe.owned.includes(item.id)) return { ok: false, reason: "owned" };
  return { ok: true, price: item.price };
};

/** The wardrobe after buying: the piece is owned and goes straight on. */
export const withPurchase = (
  wardrobe: CosmeticsState,
  itemId: string,
): CosmeticsState => {
  const item = findCosmetic(itemId);
  if (!item) return wardrobe;
  return {
    owned: [...wardrobe.owned, item.id],
    equipped: { ...wardrobe.equipped, [item.kind]: item.id },
  };
};

/**
 * Puts a piece on, or clears the slot when `itemId` is null. Returns null when
 * the piece is not the player's to wear or does not belong in that slot.
 */
export const withEquipped = (
  wardrobe: CosmeticsState,
  slot: CosmeticKind,
  itemId: string | null,
): CosmeticsState | null => {
  if (itemId === null) {
    return { ...wardrobe, equipped: { ...wardrobe.equipped, [slot]: null } };
  }
  const item = findCosmetic(itemId);
  if (!item || item.kind !== slot || !wardrobe.owned.includes(item.id)) return null;
  return { ...wardrobe, equipped: { ...wardrobe.equipped, [slot]: item.id } };
};

/** What the public lookup stores for a player: only the slots that are filled. */
export const publicEntry = (equipped: EquippedCosmetics): EquippedCosmetics => ({
  ...(equipped.banner ? { banner: equipped.banner } : {}),
  ...(equipped.avatar ? { avatar: equipped.avatar } : {}),
});
