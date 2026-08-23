import { describe, expect, it } from "vitest";

import { getEffectImageSrc } from "./effectImage";

describe("getEffectImageSrc", () => {
  it("appends the size suffix for the downscaled variants", () => {
    expect(getEffectImageSrc(26, "small")).toBe("/static/images/effects/26-small.webp");
    expect(getEffectImageSrc(26, "medium")).toBe("/static/images/effects/26-medium.webp");
  });

  it("uses the original file for the full size the pedalboard lays out against", () => {
    expect(getEffectImageSrc(26, "full")).toBe("/static/images/effects/26.webp");
  });

  it("defaults to the medium variant", () => {
    expect(getEffectImageSrc(26)).toBe("/static/images/effects/26-medium.webp");
  });
});
