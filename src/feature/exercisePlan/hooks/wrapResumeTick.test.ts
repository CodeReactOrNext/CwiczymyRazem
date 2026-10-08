import { describe, expect, it, vi } from "vitest";

vi.mock("@coderline/alphatab", () => ({}));

import { wrapResumeTick } from "./useAlphaTabPlayer";

describe("wrapResumeTick", () => {
  it("leaves a position inside the first pass alone", () => {
    expect(wrapResumeTick(4_800, 57_600)).toBe(4_800);
  });

  it("folds a resume after several loops back into the song", () => {
    // 15 bars of 4/4 = 57 600 ticks; two full passes plus one bar in.
    expect(wrapResumeTick(2 * 57_600 + 3_840, 57_600)).toBe(3_840);
  });

  it("lands on the top of the song exactly at a loop boundary", () => {
    expect(wrapResumeTick(57_600, 57_600)).toBe(0);
  });

  it("keeps the raw position while the end tick is still unknown", () => {
    expect(wrapResumeTick(70_000, 0)).toBe(70_000);
  });

  it("never seeks before the start", () => {
    expect(wrapResumeTick(-10, 57_600)).toBe(0);
  });
});
