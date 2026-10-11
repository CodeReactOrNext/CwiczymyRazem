import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRotation,
  saveRotationItems,
  stampCustomDone,
} from "../services/rotation.service";
import type { RotationDoc, RotationItem } from "../types/rotation.types";
import {
  emptyLastPracticed,
  MAX_ROTATION_ITEMS,
  rotationKey,
} from "../utils/rotation.utils";

export const rotationQueryKey = (uid: string | null) =>
  ["rotation", uid] as const;

/**
 * The player's rotation and the "last played" stamps beside it. Refetched on
 * every visit, so the list re-sorts after a session the report just stamped.
 * Edits are optimistic and roll back if the write fails.
 */
export const useRotation = (uid: string | null) => {
  const queryClient = useQueryClient();
  const key = rotationQueryKey(uid);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getRotation(uid!),
    enabled: !!uid,
  });

  const saveMutation = useMutation({
    mutationFn: (items: RotationItem[]) => saveRotationItems(uid!, items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<RotationDoc>(key);
      queryClient.setQueryData<RotationDoc>(key, {
        lastPracticed: previous?.lastPracticed ?? emptyLastPracticed(),
        items,
      });
      return { previous };
    },
    onError: (_error, _items, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });

  const doneMutation = useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) =>
      stampCustomDone(uid!, id, at),
    onMutate: async ({ id, at }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<RotationDoc>(key);
      if (previous) {
        queryClient.setQueryData<RotationDoc>(key, {
          ...previous,
          lastPracticed: {
            ...previous.lastPracticed,
            custom: { ...previous.lastPracticed.custom, [id]: at },
          },
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });

  const items = query.data?.items ?? [];
  // Read from the cache, not the render: two quick taps in the picker must
  // build on each other's optimistic list.
  const currentItems = () =>
    queryClient.getQueryData<RotationDoc>(key)?.items ?? [];

  const addItem = (item: Omit<RotationItem, "addedAt">) => {
    const current = currentItems();
    if (current.some((existing) => rotationKey(existing) === rotationKey(item)))
      return Promise.resolve(true);
    if (current.length >= MAX_ROTATION_ITEMS) return Promise.resolve(false);
    return saveMutation
      .mutateAsync([...current, { ...item, addedAt: Date.now() }])
      .then(() => true);
  };

  const removeItem = (item: Pick<RotationItem, "type" | "id">) =>
    saveMutation.mutateAsync(
      currentItems().filter(
        (existing) => rotationKey(existing) !== rotationKey(item),
      ),
    );

  return {
    items,
    lastPracticed: query.data?.lastPracticed ?? emptyLastPracticed(),
    isLoading: !uid || query.isLoading,
    isFull: items.length >= MAX_ROTATION_ITEMS,
    addItem,
    removeItem,
    /** Ticks off an untimed custom item. */
    markDone: (id: string) => doneMutation.mutateAsync({ id, at: Date.now() }),
  };
};
