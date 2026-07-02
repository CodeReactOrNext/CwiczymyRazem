import Avatar from "components/UI/Avatar";
import { ShoppingCart, Tag, X } from "lucide-react";
import Link from "next/link";

import type { EffectInventoryItem, InventoryItem } from "../../types/arsenal.types";
import type { MarketplaceListing } from "../../types/marketplace.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";

interface MarketListingCardProps {
  listing: MarketplaceListing;
  isOwn: boolean;
  /** True when the player doesn't own this guitar/effect model yet. */
  notInCollection?: boolean;
  currentFame: number;
  onBuy: () => void;
  onCancel: () => void;
  isBuying: boolean;
  isCancelling: boolean;
}

export const MarketListingCard = ({
  listing,
  isOwn,
  notInCollection = false,
  currentFame,
  onBuy,
  onCancel,
  isBuying,
  isCancelling,
}: MarketListingCardProps) => {
  const canAfford = currentFame >= listing.price;
  const showMissingBadge = notInCollection && !isOwn;

  // Seller + price + action, rendered inside the card's own frame so the whole
  // thing reads as one trading card instead of a floating, detached badge.
  const footer = (
    <div className="flex flex-col gap-2 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/user/${listing.sellerId}`}
          className="flex items-center gap-1.5 min-w-0 text-zinc-300 hover:text-white transition-colors"
        >
          <div className="scale-75 origin-left -mr-1.5">
            <Avatar
              size="sm"
              name={listing.sellerName}
              avatarURL={listing.sellerAvatarUrl || undefined}
              lvl={listing.sellerFrame}
            />
          </div>
          <span className="truncate text-xs font-medium">{listing.sellerName}</span>
        </Link>
        <span className="flex items-center gap-1 shrink-0 font-black text-amber-400">
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          {listing.price.toLocaleString()}
        </span>
      </div>

      {showMissingBadge && (
        <div className="flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
          <Tag size={11} strokeWidth={2.5} className="shrink-0" />
          <span>New for your collection</span>
        </div>
      )}

      {isOwn ? (
        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="flex items-center justify-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
        >
          <X size={13} strokeWidth={2.5} />
          {isCancelling ? "Cancelling..." : "Cancel listing"}
        </button>
      ) : (
        <button
          onClick={onBuy}
          disabled={isBuying || !canAfford}
          className="flex items-center justify-center gap-1.5 rounded bg-amber-600 hover:bg-amber-700 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={!canAfford ? "Not enough Fame Points" : undefined}
        >
          <ShoppingCart size={13} strokeWidth={2.5} />
          {isBuying ? "Buying..." : canAfford ? "Buy" : "Not enough Fame"}
        </button>
      )}
    </div>
  );

  return listing.itemType === "guitar" ? (
    <GuitarCard item={listing.item as InventoryItem} readOnly footer={footer} />
  ) : (
    <EffectCard item={listing.item as EffectInventoryItem} readOnly footer={footer} />
  );
};
