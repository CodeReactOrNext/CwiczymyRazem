import { describe, expect, it } from "vitest";

import { STAGE_TAB_MAX_PX, STAGE_TAB_MIN_PX, stageTabHeight } from "./stageModeStore";

describe("stageTabHeight", () => {
  it("is a fifth of the screen's width", () => {
    expect(stageTabHeight(1440)).toBe(288);
    expect(stageTabHeight(1920)).toBe(384);
  });

  it("stays readable on a narrow window and stops growing on a wide one", () => {
    expect(stageTabHeight(800)).toBe(STAGE_TAB_MIN_PX);
    expect(stageTabHeight(3840)).toBe(STAGE_TAB_MAX_PX);
  });
});
