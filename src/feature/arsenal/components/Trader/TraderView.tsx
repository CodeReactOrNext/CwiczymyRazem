import { cn } from "assets/lib/utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import { useArsenalData } from "../../hooks/useArsenalData";
import { useBuyTraderOffer } from "../../hooks/useBuyTraderOffer";
import { getRemainingStock, useTraderShop } from "../../hooks/useTraderShop";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "../../types/arsenal.types";
import type {
  TraderComponentOffer,
  TraderItemOffer,
  TraderModOffer,
  TraderPartOffer,
} from "../../types/trader.types";
import { buildDexLookup } from "../../utils/dex";
import { subjectOfItem } from "../Scene/sceneSubject";
import { ComponentOfferRow } from "./ComponentOfferRow";
import { ItemOfferCard } from "./ItemOfferCard";
import { ModOfferCard } from "./ModOfferCard";
import { PART_ROW_COLS } from "./offerRow";
import { PartOfferRow } from "./PartOfferRow";
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
  const { t } = useTranslation("arsenal");
  const { data: arsenal } = useArsenalData();
  const fame = useAppSelector(selectCurrentUserStats)?.fame || 0;

  const { mutate: buy, isPending } = useBuyTraderOffer();
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  // An instrument off the counter arrives through the delivery scene, which
  // needs to know what to draw while the purchase is out.
  const handleBuy = (offerId: string, qty: number, item?: TraderItemOffer) => {
    setPendingOfferId(offerId);
    buy(
      {
        offerId,
        qty,
        window: shop.window,
        subject: item
          ? (subjectOfItem(item.kind, {
              ...item.roll,
              id: item.id,
              acquiredAt: 0,
              isNew: false,
            } as InventoryItem | EffectInventoryItem) ?? undefined)
          : undefined,
      },
      { onSettled: () => setPendingOfferId(null) },
    );
  };

  // Owned / Dex / new, off the same lookup the case preview, the market and
  // the guild's shelf read. The counter used to check the cabinet alone, so a
  // model the player had found and scrapped was offered back as new.
  const dexStatusOf = useMemo(() => buildDexLookup(arsenal), [arsenal]);

  const parts = shop.offers.filter(
    (o): o is TraderPartOffer => o.kind === "part",
  );
  const items = shop.offers.filter(
    (o): o is TraderItemOffer => o.kind === "guitar" || o.kind === "effect",
  );
  const components = shop.offers.filter(
    (o): o is TraderComponentOffer => o.kind === "component",
  );
  const mod = shop.offers.find((o): o is TraderModOffer => o.kind === "mod");

  const remainingOf = (offerId: string) => {
    const offer = shop.offers.find((o) => o.id === offerId)!;
    return getRemainingStock(offer, shop.window, arsenal?.trader);
  };

  // Parts stack by (partId, tier), so a Premium screw on the counter counts
  // only the Premium screws in the pile.
  const ownedOf = (offer: TraderPartOffer) =>
    arsenal?.parts.find(
      (p) => p.partId === offer.partId && p.tier === offer.tier,
    )?.qty ?? 0;

  // A Builder part is counted by model — two levels of the same neck are
  // still two of that neck.
  const ownedComponentsOf = (offer: TraderComponentOffer) =>
    arsenal?.components?.filter((c) => c.defId === offer.roll.defId).length ??
    0;

  const listed = [...parts, ...components];
  const partsTaken = listed.filter((o) => remainingOf(o.id) === 0).length;
  const modTaken = mod ? remainingOf(mod.id) === 0 : false;

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-4'>
        <div>
          <h2 className='font-display text-2xl font-black text-zinc-100'>
            {t("view.tabs.trader")}
          </h2>
          <p className='mt-1 text-sm text-zinc-500'>
            {t("trader.subtitle")}
          </p>
        </div>
        <RestockTimer restockAt={shop.restockAt} />
      </div>

      <section className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
          <h3 className='text-lg font-bold text-zinc-100'>{t("trader.parts_mods")}</h3>
          <p className='text-xs text-zinc-500'>
            {partsTaken + (modTaken ? 1 : 0) === 0
              ? t("trader.nothing_taken")
              : t("trader.slots_cleared", {
                  taken: partsTaken + (modTaken ? 1 : 0),
                  total: listed.length + (mod ? 1 : 0),
                })}
          </p>
        </div>

        {/* The day's mod is a loose component sold like the parts, so it sits
            on the same shelf — first, and on a wide row of its own, because
            there is one a day and it is gone once taken. */}
        {mod && (
          <ModOfferCard
            offer={mod}
            available={!modTaken}
            currentFame={fame}
            onBuy={() => handleBuy(mod.id, 1)}
            isBuying={isPending && pendingOfferId === mod.id}
          />
        )}

        <div className='flex flex-col gap-1.5'>
          <div
            className={cn(
              "hidden gap-x-6 px-4 pb-1 text-xs text-zinc-500 xl:grid",
              PART_ROW_COLS,
            )}>
            <span>{t("trader.col_part")}</span>
            <span>{t("trader.col_in_stash")}</span>
            <span>{t("trader.col_left_today")}</span>
            <span>{t("trader.col_price_each")}</span>
            <span className='w-[20.5rem]' />
          </div>
          {parts.map((offer) => (
            <PartOfferRow
              key={offer.id}
              offer={offer}
              remaining={remainingOf(offer.id)}
              owned={ownedOf(offer)}
              currentFame={fame}
              onBuy={(qty) => handleBuy(offer.id, qty)}
              isBuying={isPending && pendingOfferId === offer.id}
            />
          ))}
          {components.map((offer) => (
            <ComponentOfferRow
              key={offer.id}
              offer={offer}
              available={remainingOf(offer.id) > 0}
              owned={ownedComponentsOf(offer)}
              currentFame={fame}
              onBuy={() => handleBuy(offer.id, 1)}
              isBuying={isPending && pendingOfferId === offer.id}
            />
          ))}
        </div>
      </section>

      {items.length > 0 && (
        <section className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
            <h3 className='text-lg font-bold text-zinc-100'>{t("trader.featured_gear")}</h3>
            <p className='text-xs text-zinc-500'>
              {t("trader.featured_hint")}
            </p>
          </div>

          <div className='grid grid-cols-1 gap-4 xsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {items.map((offer) => (
              <ItemOfferCard
                key={offer.id}
                offer={offer}
                available={remainingOf(offer.id) > 0}
                dexStatus={dexStatusOf(
                  offer.kind,
                  offer.kind === "guitar"
                    ? offer.roll.guitarId
                    : offer.roll.effectId,
                )}
                currentFame={fame}
                onBuy={() => handleBuy(offer.id, 1, offer)}
                isBuying={isPending && pendingOfferId === offer.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
