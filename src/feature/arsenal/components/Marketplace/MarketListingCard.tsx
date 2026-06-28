import Avatar from "components/UI/Avatar";
import { ShoppingCart, X } from "lucide-react";
import Link from "next/link";

import type { EffectInventoryItem, InventoryItem } from "../../types/arsenal.types";
import type { MarketplaceListing } from "../../types/marketplace.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";

interface MarketListingCardProps {
  listing: MarketplaceListing;
  isOwn: boolean;
  currentFame: number;
  onBuy: () => void;
  onCancel: () => void;
  isBuying: boolean;
  isCancelling: boolean;
}

export const MarketListingCard = ({
  listing,
  isOwn,
  currentFame,
  onBuy,
  onCancel,
  isBuying,
  isCancelling,
}: MarketListingCardProps) => {
  const canAfford = currentFame >= listing.price;

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-[10px] overflow-hidden">
        {listing.itemType === "guitar" ? (
          <GuitarCard item={listing.item as InventoryItem} readOnly />
        ) : (
          <EffectCard item={listing.item as EffectInventoryItem} readOnly />
        )}
      </div>

      {/* Seller + price + action */}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
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
    </div>
  );
};
