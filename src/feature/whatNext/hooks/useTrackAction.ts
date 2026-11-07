import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import posthog from "posthog-js";
import { useCallback } from "react";

/** The first stop of the road, or any stop after it. */
export type WhatNextPlacement = "hero" | "step";

/**
 * A tap on an action: remembered (so an action tapped and left undone steps
 * back for a day) and counted, so the weights can be tuned on what players use.
 */
export const useTrackAction = (scope: "widget" | "page") => {
  const markClicked = useWhatNextStore((state) => state.markClicked);

  return useCallback(
    (action: NextAction, placement: WhatNextPlacement, rank: number) => {
      markClicked(action.id);
      posthog.capture("what_next_action_clicked", {
        scope,
        source: action.source,
        kind: action.kind,
        placement,
        rank,
      });
    },
    [markClicked, scope],
  );
};
