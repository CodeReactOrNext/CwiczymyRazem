import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  firebaseGetDashboardLayout,
  firebaseSaveDashboardLayout,
} from "feature/dashboard/services/dashboardLayout.service";
import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import { normalizeLayout } from "feature/dashboard/utils/dashboardLayout";
import { useCallback } from "react";
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
 */
export const useDashboardLayout = (userAuth: string | null) => {
  const queryClient = useQueryClient();
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
      const previous = queryClient.getQueryData<DashboardLayout>(queryKey);
      queryClient.setQueryData(queryKey, layout);
      return { previous };
    },
    onError: (error, _layout, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      console.error("[dashboard layout]", error);
      toast.error("Couldn't save your Home layout");
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

  return {
    layout: query.data ?? normalizeLayout(undefined),
    isLoading: !!userAuth && query.isPending,
    updateLayout,
  };
};
