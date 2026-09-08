import { describe, expect, it } from "vitest";

import { DEFAULT_FRAME_SIZE, pickRequestedFrameSize } from "./streamShape";

describe("pickRequestedFrameSize", () => {
  it("uses capture's request when capture runs alone", () => {
    expect(pickRequestedFrameSize({ frameSize: 256 }, null)).toBe(256);
    expect(pickRequestedFrameSize({ frameSize: 512 }, undefined)).toBe(512);
  });

  it("uses the amp's request when the amp runs alone", () => {
    expect(pickRequestedFrameSize(null, { frameSize: 128 })).toBe(128);
    expect(pickRequestedFrameSize(undefined, { frameSize: 64 })).toBe(64);
  });

  it("lets the amp win when both are attached, so attaching capture never reshapes a live amp stream", () => {
    // The field case: amp running at 128 (or 64), Pitch Detect toggled on with
    // its fixed 256 request. The stream must keep the amp's size.
    expect(pickRequestedFrameSize({ frameSize: 256 }, { frameSize: 128 })).toBe(128);
    expect(pickRequestedFrameSize({ frameSize: 256 }, { frameSize: 64 })).toBe(64);
    // And the other way round — capture asking for less doesn't shrink the amp's buffer either.
    expect(pickRequestedFrameSize({ frameSize: 64 }, { frameSize: 256 })).toBe(256);
  });

  it("falls back to the default when nobody says", () => {
    expect(pickRequestedFrameSize(null, null)).toBe(DEFAULT_FRAME_SIZE);
    expect(pickRequestedFrameSize({}, {})).toBe(DEFAULT_FRAME_SIZE);
    expect(pickRequestedFrameSize({ frameSize: 0 }, { frameSize: 0 })).toBe(DEFAULT_FRAME_SIZE);
  });

  it("ignores an amp entry with no usable size instead of shadowing capture's", () => {
    expect(pickRequestedFrameSize({ frameSize: 256 }, {})).toBe(256);
  });
});
