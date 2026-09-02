import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import Avatar from "components/UI/Avatar";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getSalvageableMod } from "feature/arsenal/data/salvage";
import {
  getEffectScrapYield,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { ShoppingCart, Tag, Unplug, X } from "lucide-react";
import Link from "next/link";

import type {
  EffectInventoryItem,
  InventoryItem,
  SalvagedMod,
  ScrapPart,
} from "../../types/arsenal.types";
import type { MarketplaceListing } from "../../types/marketplace.types";
import { SalvagedModCard } from "../Collection/SalvagedModCard";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { ScrapYieldStrip } from "../Parts/ScrapYieldStrip";
import { ModArt } from "../Workshop/ModArt";

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

/**
 * What the listed instance would pay out if torn down. Same deterministic yield the
 * collection tab shows on the Scrap button — teardown value is half the reason to buy
 * a duplicate, so it belongs next to the price rather than behind a purchase.
 */
const getListingScrapYield = (listing: MarketplaceListing): ScrapPart[] => {
  // A mod is already the component — there is nothing to break it down into.
  if (listing.itemType === "mod") return [];

  if (listing.itemType === "guitar") {
    const item = listing.item as InventoryItem;
    const guitar = GUITARS_BY_ID.get(item.guitarId);
    return guitar ? getGuitarScrapYield(item, guitar) : [];
  }

  const item = listing.item as EffectInventoryItem;
  const effect = EFFECTS_BY_ID.get(item.effectId);
  return effect ? getEffectScrapYield(item, effect) : [];
};

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

  const scrapParts = getListingScrapYield(listing);
  // The mod a teardown of this instance would hand over. Picked by hashing the
  // item's own id, so the buyer gets exactly the one advertised here — nothing
  // is rolled at purchase.
  const salvaged =
    listing.itemType === "mod"
      ? null
      : getSalvageableMod(
          listing.item as InventoryItem | EffectInventoryItem,
          listing.itemType,
        );

  // Seller + price + action, rendered inside the card's own frame so the whole
  // thing reads as one trading card instead of a floating, detached badge.
  const footer = (
    <div className='flex flex-col gap-2 p-2.5'>
      <div className='flex items-center justify-between gap-2'>
        <Link
          href={`/user/${listing.sellerId}`}
          className='flex min-w-0 items-center gap-1.5 text-zinc-300 transition-colors hover:text-white'>
          <div className='-mr-1.5 origin-left scale-75'>
            <Avatar
              size='sm'
              name={listing.sellerName}
              avatarURL={listing.sellerAvatarUrl || undefined}
              lvl={listing.sellerFrame}
            />
          </div>
          <span className='truncate text-xs font-medium'>
            {listing.sellerName}
          </span>
        </Link>
        <span className='flex shrink-0 items-center gap-1 font-black text-amber-400'>
          <img
            src='/images/coin.png'
            alt='coin'
            className='h-4 w-4 object-contain'
          />
          {listing.price.toLocaleString()}
        </span>
      </div>

      <ScrapYieldStrip parts={scrapParts} />

      {/* Sits under the scrap strip because it answers the same question one
          step further on: that strip says what the instance breaks into, this
          says what survives being broken. Purple is the blueprint colour the
          scrap dialog and the bench already use for a rescued mod. */}
      {salvaged && (
        <TooltipProvider>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <div className='flex cursor-help items-center gap-2 text-purple-300/70 transition-colors hover:text-purple-300'>
                <Unplug size={13} strokeWidth={2.5} className='shrink-0' />
                <ModArt modId={salvaged.featureId} size={24} />
                <span className='min-w-0 truncate text-[11px] font-semibold'>
                  {salvaged.label}
                </span>
                <span className='shrink-0 text-[11px] font-bold tabular-nums'>
                  +{salvaged.points}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side='top'
              className='max-w-[260px] border border-zinc-700 bg-zinc-950 text-white'>
              <span className='text-[11px] text-zinc-300'>
                Scrap this and {salvaged.label} comes off whole, worn down to +
                {salvaged.points} from +{salvaged.pointsBefore}. It goes to the
                stash and fits onto another{" "}
                {listing.itemType === "guitar" ? "guitar" : "pedal"} for free.
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {showMissingBadge && (
        <div className='flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300'>
          <Tag size={11} strokeWidth={2.5} className='shrink-0' />
          <span>New for your collection</span>
        </div>
      )}

      {isOwn ? (
        <button
          onClick={onCancel}
          disabled={isCancelling}
          className='flex items-center justify-center gap-1.5 rounded bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50 hover:bg-zinc-700'>
          <X size={13} strokeWidth={2.5} />
          {isCancelling ? "Cancelling..." : "Cancel listing"}
        </button>
      ) : (
        <button
          onClick={onBuy}
          disabled={isBuying || !canAfford}
          className='flex items-center justify-center gap-1.5 rounded bg-amber-600 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-700'
          title={!canAfford ? "Not enough Fame Points" : undefined}>
          <ShoppingCart size={13} strokeWidth={2.5} />
          {isBuying ? "Buying..." : canAfford ? "Buy" : "Not enough Fame"}
        </button>
      )}
    </div>
  );

  // A mod has no card of its own outside the stash, so the listing borrows the
  // stash's — same object, same description, marketplace footer.
  if (listing.itemType === "mod") {
    return (
      <SalvagedModCard mod={listing.item as SalvagedMod} footer={footer} />
    );
  }

  return listing.itemType === "guitar" ? (
    <GuitarCard item={listing.item as InventoryItem} readOnly footer={footer} />
  ) : (
    <EffectCard
      item={listing.item as EffectInventoryItem}
      readOnly
      footer={footer}
    />
  );
};
