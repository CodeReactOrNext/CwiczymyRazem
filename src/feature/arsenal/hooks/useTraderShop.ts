import { useEffect, useState } from "react";

import { getTraderShop } from "../data/traderShop";
import type { TraderOffer, TraderState } from "../types/trader.types";

/**
 * Today's stock, derived on the client — the shop front costs nothing to render.
 * It re-derives itself the moment the window turns over, so a tab left open
 * overnight swaps to the new stock instead of offering yesterday's (which the
 * server would refuse anyway).
 */
export const useTraderShop = () => {
  const [shop, setShop] = useState(getTraderShop);

  useEffect(() => {
    const msLeft = shop.restockAt - Date.now();
    const timer = setTimeout(
      () => setShop(getTraderShop()),
      Math.max(1000, msLeft + 1000),
    );
    return () => clearTimeout(timer);
  }, [shop.restockAt]);

  return shop;
};

/** Pieces of an offer still available to this player in the current window. */
export const getRemainingStock = (
  offer: TraderOffer,
  window: number,
  trader?: TraderState,
): number => {
  const bought = trader?.window === window ? (trader.bought[offer.id] ?? 0) : 0;
  return Math.max(0, offer.stock - bought);
};
