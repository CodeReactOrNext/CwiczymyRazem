import { Skeleton } from "assets/components/ui/skeleton";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { Store } from "lucide-react";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

import { useArsenalData } from "../../hooks/useArsenalData";
import { useBuyItem, useCancelListing, useMarketplace } from "../../hooks/useMarketplace";
import { MarketListingCard } from "./MarketListingCard";

export const MarketplaceView = () => {
  const { data: listings, isLoading } = useMarketplace();
  const { data: arsenal } = useArsenalData();
  const userId = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;

  // Definition ids the player already owns — used to flag listings for items
  // that are still missing from their collection.
  const ownedDefIds = useMemo(() => {
    const set = new Set<number | string>();
    for (const item of arsenal?.inventory ?? []) set.add(item.guitarId);
    for (const item of arsenal?.effectInventory ?? []) set.add(item.effectId);
    return set;
  }, [arsenal?.inventory, arsenal?.effectInventory]);

  const { mutate: buy, isPending: isBuying, variables: buyVars } = useBuyItem();
  const { mutate: cancel, isPending: isCancelling, variables: cancelVars } = useCancelListing();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-zinc-500">
        <Store size={48} className="opacity-30" />
        <p className="text-sm font-medium">
          No items on the market yet. List one from your collection!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {listings.map((listing) => (
        <MarketListingCard
          key={listing.id}
          listing={listing}
          isOwn={listing.sellerId === userId}
          notInCollection={!ownedDefIds.has(listing.defId)}
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
