import { PRESSABLE } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getSalvageableMod } from "feature/arsenal/data/salvage";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type { DexStatus } from "feature/arsenal/utils/dex";
import {
  getEffectScrapYield,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { ComponentPreviewCard } from "feature/guitarBuilder/components/ComponentPreviewCard";
import { X } from "lucide-react";
import Link from "next/link";

import type {
  EffectInventoryItem,
  InventoryItem,
  SalvagedMod,
  ScrapPart,
} from "../../types/arsenal.types";
import type {
  ListedComponent,
  MarketplaceListing,
} from "../../types/marketplace.types";
import { BuyButton } from "../BuyButton";
import { SalvagedModCard } from "../Collection/SalvagedModCard";
import { DexWord } from "../DexMarks";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { ScrapYieldStrip } from "../Parts/ScrapYieldStrip";
import { ModArt } from "../Workshop/ModArt";

interface MarketListingCardProps {
  listing: MarketplaceListing;
  isOwn: boolean;
  /**
   * Where the listed model stands with the buyer. Absent for a mod — mods are
   * not collected, so there is nothing to say.
   */
  dexStatus?: DexStatus;
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
  // A mod or a Builder part is already the component — nothing to break down.
  if (listing.itemType === "mod" || listing.itemType === "component") return [];

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
  dexStatus,
  currentFame,
  onBuy,
  onCancel,
  isBuying,
  isCancelling,
}: MarketListingCardProps) => {
  const canAfford = currentFame >= listing.price;

  const labels = useArsenalLabels();
  const { t } = labels;
  const scrapParts = getListingScrapYield(listing);
  // The mod a teardown of this instance would hand over. Picked by hashing the
  // item's own id, so the buyer gets exactly the one advertised here — nothing
  // is rolled at purchase.
  const salvaged =
    listing.itemType === "mod" || listing.itemType === "component"
      ? null
      : getSalvageableMod(
          listing.item as InventoryItem | EffectInventoryItem,
          listing.itemType,
        );

  // Seller + price + action, rendered inside the card's own frame so the whole
  // thing reads as one trading card instead of a floating, detached badge.
  //
  // Three things, top to bottom: who sells it and where the model stands with
  // the buyer, what a teardown pays out, and the key. The payout is a small
  // table — picture on the left, figure on the right edge — in text that can be
  // read; it used to be three lines of 10px grey behind three tiny icons.
  const footer = (
    <div className='flex flex-col gap-3 p-3'>
      <div className='flex items-center justify-between gap-3'>
        <Link
          href={`/user/${listing.sellerId}`}
          className='flex min-w-0 items-center gap-1.5 text-zinc-300 transition-colors hover:text-white'>
          <div className='-mr-1.5 origin-left scale-75'>
            <Avatar
              size='sm'
              name={listing.sellerName}
              avatarURL={listing.sellerAvatarUrl || undefined}
            />
          </div>
          <span className='truncate text-xs font-medium'>
            {listing.sellerName}
          </span>
        </Link>
        {/* A buyer reads the price off the button; the seller has no button to
            read it off, so their own listing keeps it up here. */}
        {isOwn && (
          <span className='flex shrink-0 items-center gap-1 font-black text-amber-400'>
            <img
              src='/images/tokens/coin.png'
              alt='coin'
              className='h-4 w-4 object-contain'
            />
            {listing.price.toLocaleString()}
          </span>
        )}
        {/* The same answer the case preview and the shelf give. A seller's own
            listing skips it: it is theirs, which is the whole point of the
            cancel button underneath. */}
        {dexStatus && !isOwn && (
          <DexWord status={dexStatus} className='max-w-[55%] shrink-0' />
        )}
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
              <div className='flex cursor-help items-center gap-2'>
                <ModArt modId={salvaged.featureId} size={24} />
                <span className='min-w-0 flex-1 truncate text-xs text-zinc-300'>
                  {labels.mod(salvaged.featureId, salvaged.label)}
                </span>
                <span className='shrink-0 text-xs font-bold tabular-nums text-purple-300'>
                  +{salvaged.points}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side='top'
              className='max-w-[260px]'>
              <span className='text-xs'>
                {t(
                  listing.itemType === "guitar"
                    ? "market.salvage_hint_guitar"
                    : "market.salvage_hint_effect",
                  {
                    name: labels.mod(salvaged.featureId, salvaged.label),
                    points: salvaged.points,
                    before: salvaged.pointsBefore,
                  },
                )}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isOwn ? (
        <button
          onClick={onCancel}
          disabled={isCancelling}
          className={cn(PRESSABLE, "flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 hover:bg-zinc-700 hover:text-white border-b-black/30")}>
          <X size={13} strokeWidth={2.5} />
          {isCancelling ? t("market.cancelling") : t("market.cancel_listing")}
        </button>
      ) : (
        <BuyButton
          size='sm'
          price={listing.price}
          canAfford={canAfford}
          isBuying={isBuying}
          onClick={onBuy}
        />
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

  if (listing.itemType === "component") {
    return (
      <div className='flex flex-col overflow-hidden rounded-lg bg-zinc-900'>
        <ComponentPreviewCard
          component={listing.item as ListedComponent}
          className='w-full'
        />
        {footer}
      </div>
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
