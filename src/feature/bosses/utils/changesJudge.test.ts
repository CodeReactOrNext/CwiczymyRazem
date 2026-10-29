import type { FreePlayFrame } from "feature/exercisePlan/views/PracticeSession/utils/freePlay";
import { describe, expect, it } from "vitest";

import type { ChangesVariation } from "../types/boss.types";
import type { ChangesEvent } from "./changesJudge";
import { createChangesJudge, HITS_PER_BEAT } from "./changesJudge";

/** C for a bar, G for a bar, at 60 BPM — a beat is a second. */
const VARIATION: ChangesVariation = {
  bpm: 60,
  key: { tonic: 0, mode: "ionian" },
  family: "triads",
  progression: ["C", "G"],
  beatsPerChord: 4,
  units: [
    { chord: "C", beats: 4, quake: false },
    { chord: "G", beats: 4, quake: false },
  ],
};

const HZ = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392, B3: 246.94 } as const;

const frame = (beat: number, attacks: [number, number][] = [], tuningShift = 0): FreePlayFrame => ({
  beat,
  msPerBeat: 1000,
  attacks: attacks.map(([at, pitchHz]) => ({ beat: at, pitchHz })),
  tuningShift,
});

const notes = (events: ChangesEvent[]) => events.filter((e) => e.type === "note");
const settles = (events: ChangesEvent[]) => events.filter((e) => e.type === "settle");

/** Frames every half beat after `from` up to `to`, the way the run plays on; their events. */
const run = (judge: ReturnType<typeof createChangesJudge>, from: number, to: number) => {
  const events: ChangesEvent[] = [];
  for (let beat = from + 0.5; beat < to; beat += 0.5) events.push(...judge.feed(frame(beat), VARIATION));
  events.push(...judge.feed(frame(to), VARIATION));
  return events;
};

/** A judge already running in the first bar. */
const running = () => {
  const judge = createChangesJudge();
  judge.feed(frame(0), VARIATION);
  return judge;
};

describe("createChangesJudge", () => {
  it("counts a tone of the chord as a hit, dead on when it lands on the change", () => {
    const judge = running();
    const [first, second] = notes(judge.feed(frame(1.5, [[0.2, HZ.E4], [1.4, HZ.G4]]), VARIATION));
    expect(first).toMatchObject({ unit: 0, role: "third", verdict: "hit", perfect: true, weak: true });
    expect(first).toMatchObject({ midi: 64, degree: "3", lands: true });
    expect(second).toMatchObject({ unit: 0, role: "fifth", verdict: "hit", perfect: false, weak: false });
  });

  it("counts a note of the scale between the strong beats and bites on one from outside the key", () => {
    const judge = running();
    const [passing, outside] = notes(judge.feed(frame(2, [[1, HZ.F4], [1.5, HZ.Fs4]]), VARIATION));
    expect(passing).toMatchObject({ role: "passing", verdict: "hit", lands: false, strongBeat: null });
    expect(outside).toMatchObject({ role: "outside", verdict: "miss" });
  });

  it("holds the first note on a strong beat to the chord", () => {
    const judge = running();
    // D is in C major's scale but not in the chord: on beat 3 it bites; the E after it is just a tone.
    const [onBeat, after] = notes(judge.feed(frame(2.4, [[2, HZ.D4], [2.1, HZ.E4]]), VARIATION));
    expect(onBeat).toMatchObject({ role: "passing", verdict: "miss", strongBeat: { unit: 0, beat: 2, hit: false } });
    expect(after).toMatchObject({ role: "third", verdict: "hit", strongBeat: null });

    // A tone of the G on its beat 1, a little late.
    const [tone] = notes(judge.feed(frame(4.4, [[4.25, HZ.D4]]), VARIATION));
    expect(tone).toMatchObject({ unit: 1, verdict: "hit", strongBeat: { unit: 1, beat: 0, hit: true } });
  });

  it("counts a chord tone on a strong beat however many notes came before it", () => {
    const judge = running();
    // A run up the scale through the first two beats uses up the chord's hits…
    const scale = [HZ.D4, HZ.F4, HZ.B3, HZ.D4, HZ.F4, HZ.B3, HZ.D4, HZ.F4, HZ.B3, HZ.D4].map(
      (hz, i): [number, number] => [0.35 + i * 0.15, hz],
    );
    const climb = notes(judge.feed(frame(1.9, scale), VARIATION));
    expect(climb.filter((n) => n.type === "note" && n.verdict === "hit")).toHaveLength(4 * HITS_PER_BEAT);
    // …but the E on beat 3 still counts.
    const [onBeat] = notes(judge.feed(frame(2.2, [[2, HZ.E4]]), VARIATION));
    expect(onBeat).toMatchObject({ verdict: "hit", strongBeat: { unit: 0, beat: 2, hit: true } });
  });

  it("leaves a 16th before the beat, and the old chord ringing over the change, out of it", () => {
    const judge = running();
    // D a 16th before beat 3 approaches the C that lands on it.
    const [approach, target] = notes(judge.feed(frame(2.2, [[1.75, HZ.D4], [2, HZ.C4]]), VARIATION));
    expect(approach).toMatchObject({ role: "passing", verdict: "hit", strongBeat: null });
    expect(target).toMatchObject({ verdict: "hit", strongBeat: { unit: 0, beat: 2, hit: true } });

    // C just past the change to G is the C still ringing: let be, and the G's beat 1 is still open.
    run(judge, 2.2, 4);
    const [ringing, landing] = notes(judge.feed(frame(4.3, [[4.1, HZ.C4], [4.2, HZ.B3]]), VARIATION));
    expect(ringing).toMatchObject({ role: "passing", verdict: "free", strongBeat: null });
    expect(landing).toMatchObject({ unit: 1, verdict: "hit", strongBeat: { unit: 1, beat: 0, hit: true } });
  });

  it("calls a chord once it is over, landed or let go by", () => {
    const judge = running();
    judge.feed(frame(1, [[0.5, HZ.C4]]), VARIATION);
    // Not before the grace after its end is out.
    expect(settles(run(judge, 1, 4.1))).toEqual([]);
    expect(settles(judge.feed(frame(4.4), VARIATION))).toEqual([{ type: "settle", unit: 0, landed: true }]);
    expect(settles(run(judge, 4.4, 8.4))).toEqual([{ type: "settle", unit: 1, landed: false }]);
  });

  it("lands the next chord early on a tone of it just before the change", () => {
    const judge = running();
    // B is in G, not in C: played half a beat early it lands the G.
    const [note] = notes(judge.feed(frame(3.8, [[3.7, HZ.B3]]), VARIATION));
    expect(note).toMatchObject({ unit: 1, role: "third", verdict: "hit", perfect: true });
    expect(settles(run(judge, 3.8, 8.4))).toEqual([
      { type: "settle", unit: 0, landed: false },
      { type: "settle", unit: 1, landed: true },
    ]);
  });

  it("names the tricks of a chord's first tone: on the one, and stepped into", () => {
    const judge = running();
    // E lands the C late, from nothing: no trick.
    const [late] = notes(judge.feed(frame(3.6, [[3.5, HZ.E4]]), VARIATION));
    expect(late).toMatchObject({ unit: 0, landing: true, tricks: [] });
    // D, a whole step down from it, lands the G right on the change.
    const [step, after] = notes(judge.feed(frame(4.4, [[4.1, HZ.D4], [4.3, HZ.B3]]), VARIATION));
    expect(step).toMatchObject({ unit: 1, landing: true, tricks: ["onTheOne", "smooth"] });
    // Only the first tone lands the chord.
    expect(after).toMatchObject({ unit: 1, landing: false, tricks: [] });
  });

  it("doesn't call a leap, nor a step after a rest, smooth", () => {
    const leap = running();
    leap.feed(frame(3.6, [[3.5, HZ.E4]]), VARIATION);
    // E4 to B3 is a fifth down.
    const [far] = notes(leap.feed(frame(4.2, [[4.1, HZ.B3]]), VARIATION));
    expect(far).toMatchObject({ unit: 1, tricks: ["onTheOne"] });

    const rest = running();
    rest.feed(frame(1.1, [[1, HZ.E4]]), VARIATION);
    run(rest, 1.1, 4);
    const [late] = notes(rest.feed(frame(4.2, [[4.1, HZ.D4]]), VARIATION));
    expect(late).toMatchObject({ unit: 1, tricks: ["onTheOne"] });
  });

  it("doesn't count hammering one note, nor more than two tones a beat", () => {
    const judge = running();
    const repeated = notes(judge.feed(frame(1, [[0.1, HZ.C4], [0.3, HZ.C4], [0.5, HZ.C4]]), VARIATION));
    expect(repeated.map((n) => n.type === "note" && n.verdict)).toEqual(["hit", "hit", "free"]);

    const fresh = running();
    const arpeggio = Array.from({ length: 12 }, (_, i): [number, number] => [
      0.1 + i * 0.3,
      [HZ.C4, HZ.E4, HZ.G4][i % 3],
    ]);
    const hits = notes(fresh.feed(frame(3.9, arpeggio), VARIATION)).filter(
      (n) => n.type === "note" && n.verdict === "hit",
    );
    expect(hits).toHaveLength(4 * HITS_PER_BEAT);
  });

  it("only hears the first chord's own anticipation in the count-in", () => {
    const judge = createChangesJudge();
    const events = judge.feed(frame(-0.2, [[-2, HZ.E4], [-0.3, HZ.Fs4], [-0.25, HZ.C4]]), VARIATION);
    // C is a tone of the first chord; the rest came before the run.
    expect(notes(events)).toEqual([
      expect.objectContaining({ unit: 0, role: "root", verdict: "hit", perfect: true }),
    ]);
    expect(events).toContainEqual({ type: "clock", unit: null, beatsLeft: 1 });
  });

  it("doesn't call the chords it never heard when it starts mid-run", () => {
    const judge = createChangesJudge();
    expect(settles(judge.feed(frame(13), VARIATION))).toEqual([]);
    // The chord under way when it came in is called as usual.
    expect(settles(run(judge, 13, 16.4))).toEqual([{ type: "settle", unit: 1, landed: false }]);
  });

  it("starts over when the run does", () => {
    const judge = running();
    judge.feed(frame(1, [[0.5, HZ.C4]]), VARIATION);
    judge.feed(frame(-2), VARIATION);
    expect(settles(run(judge, -2, 4.4))).toEqual([{ type: "settle", unit: 0, landed: false }]);
  });

  it("hears a detuned guitar in the names of the shapes played", () => {
    const judge = running();
    // E♭ standard: the E shape of a C chord sounds as D#.
    const [note] = notes(judge.feed(frame(1, [[0.5, HZ.E4 / 2 ** (1 / 12)]], -1), VARIATION));
    expect(note).toMatchObject({ role: "third", verdict: "hit" });
  });

  it("tells where the run is and how soon the next change comes", () => {
    const judge = createChangesJudge();
    expect(judge.feed(frame(1.2), VARIATION)).toContainEqual({ type: "clock", unit: 0, beatsLeft: 3 });
    // Only when it moves.
    expect(judge.feed(frame(1.3), VARIATION)).toEqual([]);
    expect(judge.feed(frame(4.1), VARIATION)).toContainEqual({ type: "clock", unit: 1, beatsLeft: 4 });
  });
});
