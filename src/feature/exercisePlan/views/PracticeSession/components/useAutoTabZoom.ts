import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { computeAutoTabZoom } from "./autoTabZoom";
import { PILL_PRESETS } from "./tablaturePillPresets";
import { DEFAULT_SETTINGS, useTablatureSettings } from "./tablatureSettings";

/** Oldest exercises are forgotten past this, so the stored map can't grow forever. */
export const MAX_REMEMBERED_ZOOMS = 300;

interface TabZoomMemory {
  /**
   * [exercise key, the note spacing it was last shown at], most recent last.
   * A list rather than an object, whose key order isn't insertion order for
   * numeric-looking keys.
   */
  entries: [string, number][];
  remember: (key: string, zoom: number) => void;
}

/**
 * The note spacing each exercise was last left at — fitted automatically on the
 * first visit, then whatever the player stepped it to.
 */
export const useTabZoomMemory = create<TabZoomMemory>()(
  persist(
    (setState) => ({
      entries: [],
      remember: (key, zoom) =>
        setState(({ entries }) => ({
          // Re-inserted at the recent end; the oldest fall off the front.
          entries: [
            ...entries.filter(([k]) => k !== key),
            [key, zoom] as [string, number],
          ].slice(-MAX_REMEMBERED_ZOOMS),
        })),
    }),
    { name: "practice-tab-zoom", version: 1 },
  ),
);

export function rememberedZoom(key: string): number | undefined {
  return useTabZoomMemory.getState().entries.find(([k]) => k === key)?.[1];
}

interface UseAutoTabZoomArgs {
  /** Identifies the exercise. Undefined leaves the spacing alone. */
  storageKey: string | undefined;
  measures: TablatureMeasure[];
  bpm: number;
  /** The element the tab viewer fills — its width is measured. */
  boardRef: RefObject<HTMLElement | null>;
  viewerHeight: number;
  /** See `AutoTabZoomInput.zoomScale`. */
  zoomScale?: number;
  /** False while the flat tab isn't on screen (notation view). */
  enabled?: boolean;
}

/**
 * Fits the tab's note spacing to an exercise the first time it is opened, and
 * brings back whatever spacing the player left it at on every later visit.
 *
 * Returns the fitted spacing for the current tempo and board, so the zoom
 * control's reset can go back to it rather than to a flat 100%.
 */
export function useAutoTabZoom({
  storageKey,
  measures,
  bpm,
  boardRef,
  viewerHeight,
  zoomScale = 1,
  enabled = true,
}: UseAutoTabZoomArgs): number {
  const setSetting = useTablatureSettings((s) => s.set);
  const pillPreset = useTablatureSettings((s) => s.pillPreset);
  const fretFontScale = useTablatureSettings((s) => s.fretFontScale);
  const showTuningGutter = useTablatureSettings((s) => s.showTuningGutter);

  const [width, setWidth] = useState(0);
  useEffect(() => {
    const board = boardRef.current;
    if (!enabled || !board || typeof ResizeObserver === "undefined")
      return undefined;
    // Observing fires once straight away, which takes the first measurement.
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, [boardRef, enabled]);

  const fitZoom = useMemo(
    () =>
      computeAutoTabZoom({
        measures,
        bpm,
        width,
        height: viewerHeight,
        pillHeight: (
          PILL_PRESETS[pillPreset] ?? PILL_PRESETS[DEFAULT_SETTINGS.pillPreset]
        ).height,
        fretFontScale,
        hasGutter: showTuningGutter,
        zoomScale,
      }),
    [
      measures,
      bpm,
      width,
      viewerHeight,
      pillPreset,
      fretFontScale,
      showTuningGutter,
      zoomScale,
    ],
  );

  // The exercise whose spacing is currently on screen. Changes are only saved
  // under it once it has been applied, so the previous exercise's spacing never
  // leaks into the next one in the moment between the two.
  const appliedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !storageKey || appliedKeyRef.current === storageKey) return;
    if (width === 0 || measures.length === 0 || bpm <= 0) return;
    const zoom = rememberedZoom(storageKey) ?? fitZoom;
    appliedKeyRef.current = storageKey;
    useTabZoomMemory.getState().remember(storageKey, zoom);
    setSetting("noteSpacing", zoom);
  }, [enabled, storageKey, width, measures.length, bpm, fitZoom, setSetting]);

  // Any later change — the zoom buttons, the settings slider, a settings reset.
  useEffect(() => {
    if (!storageKey) return undefined;
    return useTablatureSettings.subscribe((s, prev) => {
      if (s.noteSpacing === prev.noteSpacing) return;
      if (appliedKeyRef.current !== storageKey) return;
      useTabZoomMemory.getState().remember(storageKey, s.noteSpacing);
    });
  }, [storageKey]);

  return fitZoom;
}
