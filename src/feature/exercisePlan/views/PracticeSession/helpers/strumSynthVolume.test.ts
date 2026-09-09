import { describe, expect, it } from "vitest";

import { strumSynthVolume } from "./strumSynthVolume";

describe("strumSynthVolume", () => {
  it("silences the strum synth when guitar playback is toggled off", () => {
    expect(strumSynthVolume(true, { volume: 1, isMuted: false })).toBe(0);
  });

  it("silences it when the track row itself is muted", () => {
    expect(strumSynthVolume(false, { volume: 0.8, isMuted: true })).toBe(0);
  });

  it("follows the track slider while unmuted", () => {
    expect(strumSynthVolume(false, { volume: 0.4, isMuted: false })).toBe(0.4);
  });

  it("plays at full level before any track config exists", () => {
    expect(strumSynthVolume(false, undefined)).toBe(1);
  });

  it("never returns a negative level", () => {
    expect(strumSynthVolume(false, { volume: -0.2, isMuted: false })).toBe(0);
  });
});
