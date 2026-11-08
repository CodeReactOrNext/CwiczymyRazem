import { describe, expect, it } from "vitest";

import { heldFillTarget, SUSTAIN_COMPLETE_SHARE } from "./sustainCredit";

describe("heldFillTarget", () => {
  it("follows the hold while less than the share of the note has rung", () => {
    expect(heldFillTarget(10.5, 10, 11)).toEqual({ beat: 10.5, complete: false });
    expect(heldFillTarget(10 + SUSTAIN_COMPLETE_SHARE - 0.01, 10, 11).complete).toBe(false);
  });

  it("fills the whole note once the share has rung", () => {
    expect(heldFillTarget(10 + SUSTAIN_COMPLETE_SHARE, 10, 11)).toEqual({ beat: 11, complete: true });
    expect(heldFillTarget(14.6, 13, 15)).toEqual({ beat: 15, complete: true });
  });

  it("never fills past the note's end", () => {
    expect(heldFillTarget(20, 10, 11).beat).toBe(11);
  });
});
