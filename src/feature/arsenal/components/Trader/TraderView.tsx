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
 *
 * One heading for the counter with the restock clock beside it, then two
 * shelves built the same way: a heading, a line on what the shelf is for, and
 * a grid of cards on one shared surface. The day's mod leads the first shelf
 * on a double card; the parts follow it in the same grid.
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

  const partsTaken = parts.filter((p) => remainingOf(p.id) === 0).length;
  const modTaken = mod ? remainingOf(mod.id) === 0 : false;

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-4'>
        <div>
          <h2 className='font-display text-2xl font-black text-zinc-100'>
            Trader
          </h2>
          <p className='mt-1 text-sm text-zinc-500'>
            Parts by the piece, one mod, and a few instruments — a fresh stock
            every day.
          </p>
        </div>
        <RestockTimer restockAt={shop.restockAt} />
      </div>

      <section className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
          <h3 className='text-lg font-bold text-zinc-100'>Parts &amp; mods</h3>
          <p className='text-xs text-zinc-500'>
            {partsTaken + (modTaken ? 1 : 0) === 0
              ? "Nothing taken yet today."
              : `${partsTaken + (modTaken ? 1 : 0)} of ${parts.length + (mod ? 1 : 0)} slots cleared today.`}
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'>
          {/* The day's mod is another loose component sold by the piece, so it
              sits on the same shelf as the parts rather than in a feature panel
              of its own — first, and on a double card, because there is one a
              day and it is gone once taken. */}
          {mod && (
            <ModOfferCard
              offer={mod}
              available={!modTaken}
              currentFame={fame}
              onBuy={() => handleBuy(mod.id, 1)}
              isBuying={isPending && pendingOfferId === mod.id}
              className='xsm:col-span-2'
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
        <section className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
            <h3 className='text-lg font-bold text-zinc-100'>Featured gear</h3>
            <p className='text-xs text-zinc-500'>
              Rolled from today&apos;s seed — the card is the exact instrument
              you get.
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
