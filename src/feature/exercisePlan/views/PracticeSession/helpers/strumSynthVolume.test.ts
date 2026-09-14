import { describe, expect, it } from "vitest";

import { strumSynthVolume } from "./strumSynthVolume";

describe("strumSynthVolume", () => {
  it("silences the strum synth when guitar playback is toggled off", () => {
    // useSessionAudio mirrors the toolbar toggle onto the main track.
    expect(strumSynthVolume(true, { volume: 1, isMuted: true })).toBe(0);
  });

  it("silences it when the track row itself is muted", () => {
    expect(strumSynthVolume(false, { volume: 0.8, isMuted: true })).toBe(0);
  });

  it("follows the track slider while unmuted", () => {
    expect(strumSynthVolume(false, { volume: 0.4, isMuted: false })).toBe(0.4);
  });

  it("lets the volume panel unmute a guitar the toolbar toggled off", () => {
    // The panel writes the track config only; the toolbar flag stays stale until
    // the player touches the toggle again, and must not veto the panel.
    expect(strumSynthVolume(true, { volume: 0.7, isMuted: false })).toBe(0.7);
  });

  it("falls back to the toolbar toggle before any track config exists", () => {
    expect(strumSynthVolume(false, undefined)).toBe(1);
    expect(strumSynthVolume(true, undefined)).toBe(0);
  });

  it("never returns a negative level", () => {
    expect(strumSynthVolume(false, { volume: -0.2, isMuted: false })).toBe(0);
  });
});
