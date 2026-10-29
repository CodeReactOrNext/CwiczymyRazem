import { describe, expect, it } from "vitest";

import type { ChangesEvent } from "./changesJudge";
import { IDLE_CHANGES, nextChangesLive, TRAIL_LENGTH } from "./changesLive";

const note = (unit: number, extra: Partial<Extract<ChangesEvent, { type: "note" }>> = {}): ChangesEvent => ({
  type: "note",
  unit,
  pc: 4,
  midi: 64,
  role: "third",
  degree: "3",
  lands: true,
  verdict: "hit",
  weak: false,
  perfect: false,
  landing: false,
  tricks: [],
  strongBeat: null,
  ...extra,
});

const run = (...events: ChangesEvent[]) => events.reduce(nextChangesLive, IDLE_CHANGES);

describe("nextChangesLive", () => {
  it("follows the run from chord to chord, a turn of the mask on each", () => {
    const live = run(
      { type: "clock", unit: null, beatsLeft: 2 },
      { type: "clock", unit: 0, beatsLeft: 4 },
      { type: "clock", unit: 0, beatsLeft: 3 },
      { type: "clock", unit: 1, beatsLeft: 4 },
    );
    expect(live).toMatchObject({ unit: 1, beatsLeft: 4, changeTick: 2 });
  });

  it("marks a chord sounded, and calls it once it is over", () => {
    let live = run({ type: "clock", unit: 0, beatsLeft: 4 }, note(0));
    expect(live.landed).toEqual({ 0: true });
    live = run({ type: "clock", unit: 0, beatsLeft: 4 }, note(0), { type: "settle", unit: 0, landed: true });
    expect(live.landed).toEqual({});
    expect(live.results).toEqual({ 0: true });
  });

  it("doesn't mark a chord with a passing note, or one heard too late", () => {
    const live = run(
      { type: "clock", unit: 0, beatsLeft: 4 },
      note(0, { role: "passing", degree: "", lands: false, verdict: "free" }),
      note(0, { lands: false, verdict: "free" }),
    );
    expect(live.landed).toEqual({});
  });

  it("keeps the next chord played early, and forgets a chord's last call on entering it again", () => {
    let live = run(
      { type: "clock", unit: 0, beatsLeft: 4 },
      { type: "settle", unit: 1, landed: false },
      note(1),
    );
    expect(live.results).toEqual({ 1: false });
    live = nextChangesLive(live, { type: "clock", unit: 1, beatsLeft: 4 });
    expect(live.results).toEqual({});
    expect(live.landed).toEqual({ 1: true });
  });

  it("marks the strong beats played, forgetting a chord's on entering it again — but not one played into it early", () => {
    let live = run(
      { type: "clock", unit: 0, beatsLeft: 4 },
      note(0, { strongBeat: { unit: 0, beat: 0, hit: true } }),
      note(0, { strongBeat: { unit: 0, beat: 2, hit: false } }),
    );
    expect(live.strongBeats).toEqual({ "0:0": true, "0:2": false });

    // The next pass: unit 1's beat 1 played just ahead of its change.
    live = run(
      { type: "clock", unit: 1, beatsLeft: 4 },
      note(1, { strongBeat: { unit: 1, beat: 0, hit: false } }),
      { type: "clock", unit: 0, beatsLeft: 4 },
      note(1, { strongBeat: { unit: 1, beat: 0, hit: true } }),
      { type: "clock", unit: 1, beatsLeft: 4 },
    );
    expect(live.strongBeats).toEqual({ "1:0": true });
  });

  it("keeps the last few notes, newest last", () => {
    const notes = Array.from({ length: TRAIL_LENGTH + 2 }, (_, i) => note(0, { pc: i, midi: 60 + i }));
    const live = run(...notes);
    expect(live.trail.map((n) => n.pc)).toEqual(Array.from({ length: TRAIL_LENGTH }, (_, i) => i + 2));
    expect(live.lastNote).toMatchObject({ pc: TRAIL_LENGTH + 1, tick: TRAIL_LENGTH + 2 });
  });
});

describe("why the fight bit", () => {
  it("tells a note outside the scale from a wrong one on a strong beat, and a chord let go by", () => {
    const outside = run(note(0, { verdict: "miss", role: "outside", pc: 8 }));
    expect(outside.lastMiss).toMatchObject({ reason: "outside", unit: 0, pc: 8, beat: null, tick: 1 });

    // In the scale but not the chord's, first on beat 3 of the F's two bars.
    const strong = run(
      note(1, { verdict: "miss", role: "passing", pc: 2, strongBeat: { unit: 1, beat: 2, hit: false } }),
    );
    expect(strong.lastMiss).toMatchObject({ reason: "strongBeat", unit: 1, pc: 2, beat: 2 });

    const silent = run({ type: "settle", unit: 2, landed: false });
    expect(silent.lastMiss).toMatchObject({ reason: "silent", unit: 2, pc: null });
  });

  it("keeps the last bite through notes that don't bite, and counts every bite", () => {
    const live = run(
      note(0, { verdict: "miss", role: "outside" }),
      note(0),
      { type: "settle", unit: 0, landed: true },
      note(1, { verdict: "miss", role: "outside" }),
    );
    expect(live.lastMiss).toMatchObject({ unit: 1, tick: 2 });
  });
});
