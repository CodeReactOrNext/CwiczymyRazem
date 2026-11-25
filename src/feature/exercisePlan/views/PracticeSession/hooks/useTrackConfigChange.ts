import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import { saveGuitarPlaybackPreference } from "../helpers/guitarPlaybackPreference";

export type TrackConfigs = Record<string, { volume: number; isMuted: boolean }>;

interface UseTrackConfigChangeOptions {
  trackConfigs:    TrackConfigs;
  setTrackConfigs: Dispatch<SetStateAction<TrackConfigs>>;
  setIsAudioMuted: (muted: boolean) => void;
  hasBacking:      boolean;
  /** Off where the guitar's mute is not the player's to choose (exams, riddles). */
  syncsGuitar:     boolean;
}

/**
 * The volume menu's way of changing track levels.
 *
 * The main track's mute there is the same choice as the toolbar's guitar toggle.
 * Written to `trackConfigs` alone it left the toggle showing the opposite, and
 * was gone with the next exercise — so it flips the toggle and is remembered
 * the way the toggle is.
 */
export function useTrackConfigChange({
  trackConfigs, setTrackConfigs, setIsAudioMuted, hasBacking, syncsGuitar,
}: UseTrackConfigChangeOptions): Dispatch<SetStateAction<TrackConfigs>> {
  return useCallback((action) => {
    setTrackConfigs(action);
    if (!syncsGuitar) return;
    const next = typeof action === "function" ? action(trackConfigs) : action;
    const muted = next.main?.isMuted;
    if (muted === undefined || muted === trackConfigs.main?.isMuted) return;
    setIsAudioMuted(muted);
    saveGuitarPlaybackPreference(!muted, hasBacking);
  }, [trackConfigs, setTrackConfigs, setIsAudioMuted, hasBacking, syncsGuitar]);
}
