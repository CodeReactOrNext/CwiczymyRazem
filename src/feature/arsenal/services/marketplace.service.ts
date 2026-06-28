import axios from "axios";
import { auth } from "utils/firebase/client/firebase.utils";

import type {
  BuyItemResult,
  ListItemResult,
  MarketplaceItemType,
  MarketplaceListing,
} from "../types/marketplace.types";

async function getIdToken(): Promise<string> {
  const token = await auth.currentUser!.getIdToken();
  return token;
}

export const fetchListings = async (): Promise<MarketplaceListing[]> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ listings: MarketplaceListing[] }>(
    "/api/arsenal/marketplace/get-listings",
    { idToken }
  );
  return data.listings;
};

export const listItem = async (
  itemType: MarketplaceItemType,
  inventoryItemId: string,
  price: number
): Promise<ListItemResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<ListItemResult>("/api/arsenal/marketplace/list-item", {
    idToken,
    itemType,
    inventoryItemId,
    price,
  });
  return data;
};

export const buyItem = async (listingId: string): Promise<BuyItemResult> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<BuyItemResult>("/api/arsenal/marketplace/buy-item", {
    idToken,
    listingId,
  });
  return data;
};

export const cancelListing = async (listingId: string): Promise<void> => {
  const idToken = await getIdToken();
  await axios.post("/api/arsenal/marketplace/cancel-listing", { idToken, listingId });
};
