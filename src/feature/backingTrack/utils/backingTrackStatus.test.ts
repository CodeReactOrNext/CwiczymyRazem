import { describe, expect, it } from "vitest";

import { getBackingTrackStatus } from "./backingTrackStatus";

const unplaced = { offsetMs: 0, tempoAnchors: [] };

describe("getBackingTrackStatus", () => {
  it("is empty without a recording, however it was aligned before", () => {
    expect(getBackingTrackStatus({ stemCount: 0, alignment: { offsetMs: 250 } })).toBe("empty");
  });

  it("is unaligned until the recording has been moved or pinned", () => {
    expect(getBackingTrackStatus({ stemCount: 1, alignment: unplaced })).toBe("unaligned");
    // Under a millisecond is a rounding leftover, not a placement.
    expect(getBackingTrackStatus({ stemCount: 2, alignment: { offsetMs: 0.3 } })).toBe(
      "unaligned",
    );
  });

  it("is aligned once the start moved or a bar is pinned", () => {
    expect(getBackingTrackStatus({ stemCount: 1, alignment: { offsetMs: -140 } })).toBe(
      "aligned",
    );
    expect(
      getBackingTrackStatus({
        stemCount: 1,
        alignment: { offsetMs: 0, tempoAnchors: [{ beat: 16, sec: 8 }] },
      }),
    ).toBe("aligned");
  });
});
