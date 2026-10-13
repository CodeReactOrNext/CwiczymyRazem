import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFame, deductFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("arsenal");
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
      toast.success(t("toasts.listed"));
    },
    onError: (error: any, _vars, context: any) => {
      if (context?.fee) dispatch(addFame(context.fee));
      toast.error(error?.response?.data?.error || t("toasts.err.list"));
    },
  });
};

export const useBuyItem = () => {
  const { t } = useTranslation("arsenal");
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
      toast.success(t("toasts.purchase_complete"));
    },
    onError: (error: any, _vars, context: any) => {
      if (context?.price) dispatch(addFame(context.price));
      invalidate();
      toast.error(error?.response?.data?.error || t("toasts.err.buy"));
    },
  });
};

export const useCancelListing = () => {
  const { t } = useTranslation("arsenal");
  const invalidate = useInvalidateMarketplace();

  return useMutation({
    mutationFn: ({ listingId }: { listingId: string }) => cancelListing(listingId),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.listing_cancelled"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || t("toasts.err.cancel_listing"));
    },
  });
};
