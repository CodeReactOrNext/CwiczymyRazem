import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buyCosmetic,
  equipCosmetic,
  fetchCosmeticsState,
  fetchEquippedLookup,
} from "feature/cosmetics/services/cosmetics.service";
import type {
  CosmeticKind,
  CosmeticsState,
  EquippedCosmetics,
  EquippedLookup,
} from "feature/cosmetics/types/cosmetics.types";
import { publicEntry } from "feature/cosmetics/utils/wardrobe";
import { SKIN_SHOP_KEY } from "feature/supporterPanel/hooks/useBoardSkinShop";
import { SUPPORTER_ROADMAP_KEY } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type { SkinShopState } from "feature/supporterPanel/services/supporterPanel.service";
import type {
  RoadmapBoard,
  SupporterWallet,
} from "feature/supporterPanel/types/supporterPanel.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

const STATE_KEY = ["cosmetics", "state"] as const;
const EQUIPPED_KEY = ["cosmetics", "equipped"] as const;

const NOTHING: EquippedCosmetics = {};

/**
 * What every player is wearing — one request for the whole feed, cached for a
 * while: a banner somebody bought a minute ago showing up a few minutes late
 * costs nothing, a request per row would.
 */
export const useEquippedCosmetics = () => {
  const { data } = useQuery({
    queryKey: EQUIPPED_KEY,
    queryFn: fetchEquippedLookup,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return (uid?: string | null): EquippedCosmetics =>
    (uid && data?.[uid]) || NOTHING;
};

/** The signed-in player's own wardrobe. */
export const useCosmeticsState = (enabled = true) => {
  const uid = useAppSelector(selectUserAuth);

  return useQuery({
    queryKey: [...STATE_KEY, uid],
    queryFn: fetchCosmeticsState,
    enabled: enabled && !!uid,
    staleTime: 5 * 60 * 1000,
  });
};

/** Writes the server's answer into both caches, so the shop and the feed change at once. */
const useApplyWardrobe = () => {
  const queryClient = useQueryClient();
  const uid = useAppSelector(selectUserAuth);

  return (wardrobe: CosmeticsState) => {
    if (!uid) return;
    queryClient.setQueryData<CosmeticsState>([...STATE_KEY, uid], {
      owned: wardrobe.owned,
      equipped: wardrobe.equipped,
    });
    queryClient.setQueryData<EquippedLookup>(EQUIPPED_KEY, (lookup) => ({
      ...(lookup ?? {}),
      [uid]: publicEntry(wardrobe.equipped),
    }));
  };
};

export const useBuyCosmetic = () => {
  const { t } = useTranslation("supporter");
  const queryClient = useQueryClient();
  const apply = useApplyWardrobe();

  /** The panel shows the wallet in its header and on the skin shop: both get the stored one. */
  const applyWallet = (wallet: SupporterWallet) => {
    queryClient.setQueryData<RoadmapBoard>(SUPPORTER_ROADMAP_KEY, (board) =>
      board ? { ...board, wallet } : board,
    );
    queryClient.setQueryData<SkinShopState>(SKIN_SHOP_KEY, (shop) =>
      shop ? { ...shop, wallet } : shop,
    );
  };

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; name: string }) =>
      buyCosmetic(itemId),
    onSuccess: (result, { name }) => {
      apply(result);
      applyWallet(result.wallet);
      toast.success(t("shop.cosmetics.bought", { name }));
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || t("shop.cosmetics.toast_buy_failed"),
      );
    },
  });
};

export const useEquipCosmetic = () => {
  const { t } = useTranslation("supporter");
  const apply = useApplyWardrobe();

  return useMutation({
    mutationFn: ({ slot, itemId }: { slot: CosmeticKind; itemId: string | null }) =>
      equipCosmetic(slot, itemId),
    onSuccess: apply,
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || t("shop.cosmetics.err_equip"));
    },
  });
};
