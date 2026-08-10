import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

import type { TraderBuyResult } from "../types/trader.types";

export interface BuyTraderOfferInput {
  offerId: string;
  qty: number;
  /** The window the shop front was showing — the server refuses a stale one. */
  window: number;
}

export const buyTraderOffer = async ({
  offerId,
  qty,
  window,
}: BuyTraderOfferInput): Promise<TraderBuyResult> => {
  const idToken = await auth.currentUser!.getIdToken();
  const { data } = await axios.post<TraderBuyResult>("/api/arsenal/trader-buy", {
    idToken,
    offerId,
    qty,
    window,
  });
  return data;
};
