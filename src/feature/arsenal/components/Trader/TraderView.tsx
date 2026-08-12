import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { useArsenalData } from "../../hooks/useArsenalData";
import { useBuyTraderOffer } from "../../hooks/useBuyTraderOffer";
import { getRemainingStock, useTraderShop } from "../../hooks/useTraderShop";
import type {
  TraderItemOffer,
  TraderModOffer,
  TraderPartOffer,
} from "../../types/trader.types";
import { ItemOfferCard } from "./ItemOfferCard";
import { ModOfferCard } from "./ModOfferCard";
import { PartOfferCard } from "./PartOfferCard";
import { RestockTimer } from "./RestockTimer";

/**
 * The system's own counter, next door to the player marketplace.
 *
 * Everything on it is derived from the current window, so this renders with no
 * request of its own — the only thing it needs from the server is what the player
 * has already taken today, which rides along with the arsenal data.
 */
export const TraderView = () => {
  const shop = useTraderShop();
  const { data: arsenal } = useArsenalData();
  const fame = useAppSelector(selectCurrentUserStats)?.fame || 0;

  const { mutate: buy, isPending } = useBuyTraderOffer();
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const handleBuy = (offerId: string, qty: number) => {
    setPendingOfferId(offerId);
    buy(
      { offerId, qty, window: shop.window },
      { onSettled: () => setPendingOfferId(null) },
    );
  };

  const ownedDefIds = useMemo(() => {
    const set = new Set<number | string>();
    for (const item of arsenal?.inventory ?? []) set.add(item.guitarId);
    for (const item of arsenal?.effectInventory ?? []) set.add(item.effectId);
    return set;
  }, [arsenal?.inventory, arsenal?.effectInventory]);

  const parts = shop.offers.filter(
    (o): o is TraderPartOffer => o.kind === "part",
  );
  const items = shop.offers.filter(
    (o): o is TraderItemOffer => o.kind === "guitar" || o.kind === "effect",
  );
  const mod = shop.offers.find((o): o is TraderModOffer => o.kind === "mod");

  const remainingOf = (offerId: string) => {
    const offer = shop.offers.find((o) => o.id === offerId)!;
    return getRemainingStock(offer, shop.window, arsenal?.trader);
  };

  return (
    <div className='flex flex-col gap-12'>
      <section className='flex flex-col gap-6 rounded-xl bg-zinc-900/40 p-6'>
        <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
              Today at the counter
            </p>
            <p className='text-base font-black capitalize tracking-wide text-white'>
              Parts &amp; mods
            </p>
          </div>
          <RestockTimer restockAt={shop.restockAt} />
        </div>

        <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'>
          {/* The day's mod is another loose component sold by the piece, so it
              sits on the same shelf as the parts rather than in a feature panel
              of its own. First, because there is one a day and it is gone once
              taken. */}
          {mod && (
            <ModOfferCard
              offer={mod}
              available={remainingOf(mod.id) > 0}
              currentFame={fame}
              onBuy={() => handleBuy(mod.id, 1)}
              isBuying={isPending && pendingOfferId === mod.id}
            />
          )}

          {parts.map((offer) => (
            <PartOfferCard
              key={offer.id}
              offer={offer}
              remaining={remainingOf(offer.id)}
              currentFame={fame}
              onBuy={(qty) => handleBuy(offer.id, qty)}
              isBuying={isPending && pendingOfferId === offer.id}
            />
          ))}
        </div>
      </section>

      {items.length > 0 && (
        <section className='flex flex-col gap-6'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
              Four picks, rolled fresh every day
            </p>
            <p className='text-base font-black capitalize tracking-wide text-white'>
              Featured gear
            </p>
          </div>

          <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {items.map((offer) => (
              <ItemOfferCard
                key={offer.id}
                offer={offer}
                available={remainingOf(offer.id) > 0}
                notInCollection={
                  !ownedDefIds.has(
                    offer.kind === "guitar"
                      ? offer.roll.guitarId
                      : offer.roll.effectId,
                  )
                }
                currentFame={fame}
                onBuy={() => handleBuy(offer.id, 1)}
                isBuying={isPending && pendingOfferId === offer.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
