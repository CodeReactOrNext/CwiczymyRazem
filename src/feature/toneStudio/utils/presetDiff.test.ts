import { BUILT_IN_PRESETS } from "feature/toneStudio/data/builtInPresets";
import { describe, expect, it } from "vitest";

import { isPresetModified } from "./presetDiff";

const base = BUILT_IN_PRESETS[0].params;

describe("isPresetModified", () => {
  it("is false right after loading a preset", () => {
    expect(isPresetModified({ ...base }, base)).toBe(false);
  });

  it("ignores master level — that's room volume, not tone", () => {
    expect(isPresetModified({ ...base, level: base.level + 0.2 }, base)).toBe(
      false,
    );
  });

  it("flags a tone knob change", () => {
    expect(isPresetModified({ ...base, drive: base.drive + 0.1 }, base)).toBe(
      true,
    );
  });

  it("flags a chain block toggle", () => {
    expect(
      isPresetModified({ ...base, delayEnabled: !base.delayEnabled }, base),
    ).toBe(true);
  });

  it("only compares keys the preset itself carries", () => {
    // A preset saved before `namModelId` existed: the live value is whatever
    // was there before the load, which is not a user edit.
    const { namModelId: _dropped, ...older } = base;
    void _dropped;
    expect(
      isPresetModified({ ...base, namModelId: "some-model" }, older as never),
    ).toBe(false);
  });
});
