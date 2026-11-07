import type { WhatNextScope } from "feature/whatNext/hooks/useWhatNextSnapshot";
import { useWhatNextSnapshot } from "feature/whatNext/hooks/useWhatNextSnapshot";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type {
  WhatNextResult,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";
import { buildWhatNext } from "feature/whatNext/utils/buildWhatNext";
import { useMemo } from "react";

/** The road for the signed-in player, re-ranked whenever a source answers. */
export const useWhatNext = (
  scope: WhatNextScope,
): {
  result: WhatNextResult | null;
  snapshot: WhatNextSnapshot | null;
  isLoading: boolean;
} => {
  const { snapshot, isLoading } = useWhatNextSnapshot(scope);
  const snoozed = useWhatNextStore((state) => state.snoozed);
  const clicked = useWhatNextStore((state) => state.clicked);

  const result = useMemo(
    () => (snapshot ? buildWhatNext(snapshot, { snoozed, clicked }) : null),
    [snapshot, snoozed, clicked],
  );

  return { result, snapshot, isLoading };
};
