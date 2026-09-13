import { Skeleton } from "assets/components/ui/skeleton";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { Store } from "lucide-react";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

import { useArsenalData } from "../../hooks/useArsenalData";
import {
  useBuyItem,
  useCancelListing,
  useMarketplace,
} from "../../hooks/useMarketplace";
import { buildDexLookup } from "../../utils/dex";
import { MarketListingCard } from "./MarketListingCard";

export const MarketplaceView = () => {
  const { data: listings, isLoading } = useMarketplace();
  const { data: arsenal } = useArsenalData();
  const userId = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;

  // Owned / Dex status per listed model — the same marks the case preview
  // wears, plus the "new for your collection" flag on anything not held.
  const dexStatusOf = useMemo(() => buildDexLookup(arsenal), [arsenal]);

  const { mutate: buy, isPending: isBuying, variables: buyVars } = useBuyItem();
  const {
    mutate: cancel,
    isPending: isCancelling,
    variables: cancelVars,
  } = useCancelListing();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className='h-72 rounded-lg bg-zinc-800/50' />
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 py-20 text-zinc-500'>
        <Store size={48} className='opacity-30' />
        <p className='text-sm font-medium'>
          No items on the market yet. List one from your collection!
        </p>
      </div>
    );
  }

  // One column below 500px: at two columns a phone squeezes the card so hard
  // that the badges wrap and the perk rows collide.
  return (
    <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
      {listings.map((listing) => (
        <MarketListingCard
          key={listing.id}
          listing={listing}
          isOwn={listing.sellerId === userId}
          // Mods are not part of the collection — every one of them would
          // otherwise wear a "new for your collection" badge forever.
          dexStatus={
            listing.itemType === "mod"
              ? undefined
              : dexStatusOf(listing.itemType, listing.defId)
          }
          currentFame={fame}
          onBuy={() => buy({ listingId: listing.id, price: listing.price })}
          onCancel={() => cancel({ listingId: listing.id })}
          isBuying={isBuying && buyVars?.listingId === listing.id}
          isCancelling={isCancelling && cancelVars?.listingId === listing.id}
        />
      ))}
    </div>
  );
};
