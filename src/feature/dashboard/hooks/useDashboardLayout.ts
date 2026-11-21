import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  firebaseGetDashboardLayout,
  firebaseSaveDashboardLayout,
} from "feature/dashboard/services/dashboardLayout.service";
import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import { defaultLayoutFor } from "feature/dashboard/utils/dashboardLayout";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

export const dashboardLayoutQueryKey = (uid: string | null) =>
  ["dashboard-layout", uid] as const;

const STALE_TIME = 10 * 60 * 1000;

/**
 * The signed-in player's Home layout, and one way to change it.
 *
 * Every change lands in the query cache first and is written behind it, so
 * dragging a card feels immediate; a failed write rolls the cache back to what
 * it was before that change and says so once.
 *
 * `isNewPlayer` only matters until the first save: an account that has never
 * arranged Home gets the short starter layout in its first practice days and
 * the full default after them.
 */
export const useDashboardLayout = (
  userAuth: string | null,
  isNewPlayer = false,
) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("dashboard");
  const queryKey = dashboardLayoutQueryKey(userAuth);

  const query = useQuery({
    queryKey,
    queryFn: () => firebaseGetDashboardLayout(userAuth as string),
    enabled: !!userAuth,
    staleTime: STALE_TIME,
  });

  const mutation = useMutation({
    mutationFn: (layout: DashboardLayout) =>
      firebaseSaveDashboardLayout(userAuth as string, layout),
    onMutate: async (layout) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DashboardLayout | null>(
        queryKey,
      );
      queryClient.setQueryData(queryKey, layout);
      return { previous };
    },
    onError: (error, _layout, context) => {
      // Null is a real state to go back to: nothing was saved before.
      if (context && context.previous !== undefined)
        queryClient.setQueryData(queryKey, context.previous);
      console.error("[dashboard layout]", error);
      toast.error(t("errors.layout_save"));
    },
  });

  const { mutate } = mutation;
  const updateLayout = useCallback(
    (layout: DashboardLayout) => {
      if (!userAuth) return;
      mutate(layout);
    },
    [mutate, userAuth],
  );

  const saved = query.data;
  const layout = useMemo(
    () => saved ?? defaultLayoutFor(isNewPlayer),
    [saved, isNewPlayer],
  );

  return {
    layout,
    isLoading: !!userAuth && query.isPending,
    updateLayout,
  };
};
