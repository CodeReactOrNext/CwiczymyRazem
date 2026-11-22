import { chipVariants } from "assets/components/ui/chip";
import { describe, expect, it } from "vitest";

import { CATEGORY_CHIP_COLOR, getCategoryChipColor } from "./categoryChip";

const VALID_COLORS = ["cyan", "emerald", "purple", "amber", "yellow", "blue", "gray", "custom"];

describe("CATEGORY_CHIP_COLOR", () => {
  it("maps every category to a valid Chip colour", () => {
    for (const color of Object.values(CATEGORY_CHIP_COLOR)) {
      expect(VALID_COLORS).toContain(color);
      expect(chipVariants({ color })).toBeTruthy();
    }
  });

  it("uses the canonical hues", () => {
    expect(CATEGORY_CHIP_COLOR).toMatchObject({
      technique: "emerald",
      theory: "blue",
      hearing: "amber",
      creativity: "purple",
    });
  });

  it("falls back to gray for unknown or missing categories", () => {
    expect(getCategoryChipColor("mixed")).toBe("gray");
    expect(getCategoryChipColor("nope")).toBe("gray");
    expect(getCategoryChipColor(undefined)).toBe("gray");
  });
});
