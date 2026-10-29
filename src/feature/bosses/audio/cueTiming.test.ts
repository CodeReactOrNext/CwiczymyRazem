import { rageEntryTime } from "feature/autoBacking/synth/rageEntry";
import { describe, expect, it } from "vitest";

import { beatPosition, beatTime, countdownBeats, nextGridTime, nextQuakeStart } from "./cueTiming";

describe("the beat clock", () => {
  it("turns audio time into beats and back", () => {
    // 120 BPM from t = 10 s: a beat every half second.
    expect(beatPosition(12, 10, 120)).toBe(4);
    expect(beatPosition(9.5, 10, 120)).toBe(-1);
    expect(beatTime(4, 10, 120)).toBe(12);
  });

  it("puts a hit on the next sixteenth", () => {
    // 120 BPM from t = 0: a sixteenth every 0.125 s.
    expect(nextGridTime(1.01, 0, 120)).toBe(1.125);
    expect(nextGridTime(1.125, 0, 120)).toBe(1.125);
  });
});

describe("countdownBeats", () => {
  it("ticks on the last three beats before the attack", () => {
    expect(countdownBeats(3.2, 10)).toEqual([7, 8, 9]);
    // An attack between beats: the beat it falls in counts too.
    expect(countdownBeats(3.2, 10.5)).toEqual([8, 9, 10]);
  });

  it("never ticks on a beat already gone or too close to schedule", () => {
    expect(countdownBeats(7.98, 10)).toEqual([9]);
    expect(countdownBeats(8.97, 10)).toEqual([]);
  });
});

describe("nextQuakeStart", () => {
  it("finds the next quake of a looping pass", () => {
    // A 32-beat pass with quakes at beats 8 and 20.
    expect(nextQuakeStart(3, [8, 20], 32)).toBe(8);
    expect(nextQuakeStart(9, [8, 20], 32)).toBe(20);
    expect(nextQuakeStart(25, [8, 20], 32)).toBe(40);
    expect(nextQuakeStart(3, [], 32)).toBeNull();
  });
});

describe("rageEntryTime", () => {
  it("comes in on a downbeat, two beats of swell at the least", () => {
    // 120 BPM from t = 0: bars every 2 s.
    expect(rageEntryTime(0.5, 0, 120)).toBe(2);
    // Under two beats before the next bar: the one after.
    expect(rageEntryTime(1.2, 0, 120)).toBe(4);
    expect(rageEntryTime(-1, 0, 120)).toBe(0);
  });
});
