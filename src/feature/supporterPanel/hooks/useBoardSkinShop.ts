import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RigSkin, SkinKind } from "feature/arsenal/data/boardSkins";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { SUPPORTER_ROADMAP_KEY } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type { SkinShopState } from "feature/supporterPanel/services/supporterPanel.service";
import {
  buyBoardSkin,
  fetchSkinShop,
  wearBoardSkin,
} from "feature/supporterPanel/services/supporterPanel.service";
import type { RoadmapBoard } from "feature/supporterPanel/types/supporterPanel.types";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

export const SKIN_SHOP_KEY = ["supporter-skin-shop"] as const;

const errorMessage = (error: unknown, fallback: string): string =>
  (error as { response?: { data?: { error?: string } } })?.response?.data
    ?.error || fallback;

/**
 * What the account owns and wears, and the two things it can do about it.
 *
 * Every answer from the server is the whole state, and it is written into
 * three caches at once: this one, the wallet in the page header, and the
 * Arsenal's own data — so the board is already wearing the skin when the
 * player walks over to look at it.
 */
export const useBoardSkinShop = (enabled: boolean) => {
  const { t } = useTranslation("supporter");
  const queryClient = useQueryClient();

  const shop = useQuery({
    queryKey: SKIN_SHOP_KEY,
    queryFn: fetchSkinShop,
    enabled,
    staleTime: 30_000,
  });

  const apply = (state: SkinShopState) => {
    queryClient.setQueryData<SkinShopState>(SKIN_SHOP_KEY, state);
    queryClient.setQueryData<RoadmapBoard>(SUPPORTER_ROADMAP_KEY, (board) =>
      board ? { ...board, wallet: state.wallet } : board,
    );
    queryClient.setQueryData<ArsenalUserData>(ARSENAL_QUERY_KEY, (arsenal) =>
      arsenal ? { ...arsenal, boardSkins: state.boardSkins } : arsenal,
    );
  };

  const buy = useMutation({
    mutationFn: ({ skin, bays }: { skin: RigSkin; bays?: number[] }) =>
      buyBoardSkin(skin.id, bays),
    onSuccess: (state, { skin }) => {
      apply(state);
      toast.success(
        t(skin.kind === "rack" ? "shop.toast_bought_rack" : "shop.toast_bought", {
          name: skin.name,
        }),
      );
    },
    onError: (error) =>
      toast.error(errorMessage(error, t("shop.toast_buy_failed"))),
  });

  const wear = useMutation({
    mutationFn: ({
      kind,
      skinId,
      bays,
    }: {
      kind: SkinKind;
      skinId: string | null;
      bays?: number[];
    }) => wearBoardSkin(kind, skinId, bays),
    onSuccess: apply,
    onError: (error) =>
      toast.error(errorMessage(error, t("shop.toast_wear_failed"))),
  });

  return { shop, buy, wear };
};
