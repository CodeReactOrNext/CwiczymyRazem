import { describe, expect, it } from "vitest";

import { palmMuteRuns } from "./palmMuteRuns";

const muted = { notes: [{ isPalmMute: true }] };
const open = { notes: [{}] };
const rest = { notes: [] };

describe("palmMuteRuns", () => {
  it("returns nothing for a tab without palm muting", () => {
    expect(palmMuteRuns([open, rest, open])).toEqual([]);
  });

  it("joins consecutive muted beats into one run", () => {
    expect(palmMuteRuns([muted, muted, muted])).toEqual([{ start: 0, end: 2 }]);
  });

  it("ends a run at an open beat and at a rest", () => {
    expect(palmMuteRuns([muted, muted, open, muted, rest, muted])).toEqual([
      { start: 0, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
    ]);
  });

  it("counts a beat as muted when any of its notes is", () => {
    expect(palmMuteRuns([{ notes: [{}, { isPalmMute: true }] }])).toEqual([{ start: 0, end: 0 }]);
  });
});
