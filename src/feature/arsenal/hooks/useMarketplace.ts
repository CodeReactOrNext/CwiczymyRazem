import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFame, deductFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import {
  buyItem,
  cancelListing,
  fetchListings,
  listItem,
} from "../services/marketplace.service";
import type { MarketplaceItemType } from "../types/marketplace.types";
import { MARKETPLACE_LISTING_FEE } from "../types/marketplace.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const MARKETPLACE_QUERY_KEY = ["marketplace", "listings"];

export const useMarketplace = () => {
  return useQuery({
    queryKey: MARKETPLACE_QUERY_KEY,
    queryFn: fetchListings,
    staleTime: 15_000,
  });
};

const useInvalidateMarketplace = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
  };
};

export const useListItem = () => {
  const dispatch = useAppDispatch();
  const invalidate = useInvalidateMarketplace();

  return useMutation({
    mutationFn: ({
      itemType,
      inventoryItemId,
      price,
    }: {
      itemType: MarketplaceItemType;
      inventoryItemId: string;
      price: number;
    }) => listItem(itemType, inventoryItemId, price),
    onMutate: () => {
      dispatch(deductFame(MARKETPLACE_LISTING_FEE));
      return { fee: MARKETPLACE_LISTING_FEE };
    },
    onSuccess: () => {
      invalidate();
      toast.success("Item listed on the market");
    },
    onError: (error: any, _vars, context: any) => {
      if (context?.fee) dispatch(addFame(context.fee));
      toast.error(error?.response?.data?.error || "Failed to list item");
    },
  });
};

export const useBuyItem = () => {
  const dispatch = useAppDispatch();
  const invalidate = useInvalidateMarketplace();

  return useMutation({
    mutationFn: ({ listingId }: { listingId: string; price: number }) => buyItem(listingId),
    onMutate: ({ price }) => {
      dispatch(deductFame(price));
      return { price };
    },
    onSuccess: () => {
      invalidate();
      toast.success("Purchase complete!");
    },
    onError: (error: any, _vars, context: any) => {
      if (context?.price) dispatch(addFame(context.price));
      invalidate();
      toast.error(error?.response?.data?.error || "Failed to buy item");
    },
  });
};

export const useCancelListing = () => {
  const invalidate = useInvalidateMarketplace();

  return useMutation({
    mutationFn: ({ listingId }: { listingId: string }) => cancelListing(listingId),
    onSuccess: () => {
      invalidate();
      toast.success("Listing cancelled");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to cancel listing");
    },
  });
};
