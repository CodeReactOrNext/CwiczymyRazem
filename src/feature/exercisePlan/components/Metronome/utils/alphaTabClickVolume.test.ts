import { describe, expect, it } from "vitest";

import { ALPHATAB_CLICK_MAX_GAIN, toAlphaTabClickVolume } from "./alphaTabClickVolume";

describe("toAlphaTabClickVolume", () => {
  it("keeps the default slider position at AlphaTab's normal click loudness", () => {
    expect(toAlphaTabClickVolume(0.5)).toBe(1);
    expect(toAlphaTabClickVolume()).toBe(1);
  });

  it("scales the click with the slider instead of ignoring it", () => {
    expect(toAlphaTabClickVolume(0)).toBe(0);
    expect(toAlphaTabClickVolume(0.25)).toBe(0.5);
    expect(toAlphaTabClickVolume(1)).toBe(ALPHATAB_CLICK_MAX_GAIN);
  });

  it("silences the click when muted, whatever the slider says", () => {
    expect(toAlphaTabClickVolume(1, true)).toBe(0);
    expect(toAlphaTabClickVolume(0.5, true)).toBe(0);
  });

  it("clamps out-of-range and non-finite levels", () => {
    expect(toAlphaTabClickVolume(-1)).toBe(0);
    expect(toAlphaTabClickVolume(5)).toBe(ALPHATAB_CLICK_MAX_GAIN);
    expect(toAlphaTabClickVolume(Number.NaN)).toBe(1);
  });
});
