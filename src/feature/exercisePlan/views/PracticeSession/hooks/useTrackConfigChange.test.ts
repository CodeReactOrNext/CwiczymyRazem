// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadGuitarPlaybackPreference } from "../helpers/guitarPlaybackPreference";
import type { TrackConfigs } from "./useTrackConfigChange";
import { useTrackConfigChange } from "./useTrackConfigChange";

const setup = (overrides: { mainMuted?: boolean; hasBacking?: boolean; syncsGuitar?: boolean } = {}) => {
  const trackConfigs: TrackConfigs = {
    main: { volume: 1, isMuted: overrides.mainMuted ?? true },
    drums: { volume: 0.8, isMuted: false },
  };
  const setTrackConfigs = vi.fn();
  const setIsAudioMuted = vi.fn();
  const { result } = renderHook(() => useTrackConfigChange({
    trackConfigs, setTrackConfigs, setIsAudioMuted,
    hasBacking: overrides.hasBacking ?? true,
    syncsGuitar: overrides.syncsGuitar ?? true,
  }));
  return { change: result.current, setTrackConfigs, setIsAudioMuted };
};

const setTrack = (id: string, next: Partial<TrackConfigs[string]>) => (prev: TrackConfigs): TrackConfigs =>
  ({ ...prev, [id]: { ...prev[id], ...next } });

describe("useTrackConfigChange", () => {
  beforeEach(() => localStorage.clear());

  it("remembers the guitar unmuted from the volume menu over a backing", () => {
    const { change, setTrackConfigs, setIsAudioMuted } = setup();
    change(setTrack("main", { isMuted: false }));
    expect(setTrackConfigs).toHaveBeenCalledTimes(1);
    expect(setIsAudioMuted).toHaveBeenCalledWith(false);
    expect(loadGuitarPlaybackPreference(true)).toBe(true);
    expect(loadGuitarPlaybackPreference()).toBeNull();
  });

  it("remembers the guitar muted without a backing apart from that", () => {
    const { change, setIsAudioMuted } = setup({ mainMuted: false, hasBacking: false });
    change(setTrack("main", { volume: 0, isMuted: true }));
    expect(setIsAudioMuted).toHaveBeenCalledWith(true);
    expect(loadGuitarPlaybackPreference()).toBe(false);
    expect(loadGuitarPlaybackPreference(true)).toBeNull();
  });

  it("leaves the preference alone for another track or a plain level change", () => {
    const { change, setTrackConfigs, setIsAudioMuted } = setup({ mainMuted: false });
    change(setTrack("drums", { isMuted: true }));
    change(setTrack("main", { volume: 0.4, isMuted: false }));
    expect(setTrackConfigs).toHaveBeenCalledTimes(2);
    expect(setIsAudioMuted).not.toHaveBeenCalled();
    expect(loadGuitarPlaybackPreference(true)).toBeNull();
  });

  it("only changes the level where the guitar is not the player's choice", () => {
    const { change, setTrackConfigs, setIsAudioMuted } = setup({ syncsGuitar: false });
    change(setTrack("main", { isMuted: false }));
    expect(setTrackConfigs).toHaveBeenCalledTimes(1);
    expect(setIsAudioMuted).not.toHaveBeenCalled();
    expect(loadGuitarPlaybackPreference(true)).toBeNull();
  });
});
