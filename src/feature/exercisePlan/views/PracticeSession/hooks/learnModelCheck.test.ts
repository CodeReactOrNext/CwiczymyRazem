import type { OnsetQuery } from "utils/audio/noteOnsetModel";
import type { RecentAudioSnapshot } from "utils/audio/recentAudio";
import { describe, expect, it, vi } from "vitest";

import type { LearnTarget } from "../utils/learnSteps";
import type { LearnFrame } from "./learnJudge";
import { createLearnModelCheck } from "./learnModelCheck";

const B3 = 246.94;
const note = (freq: number, over: Partial<LearnTarget> = {}): LearnTarget => ({
  noteKey: `n${Math.round(freq)}`, freq, isDead: false, hasAttack: true, readsAttack: true, ...over,
});
const frame = (now: number, over: Partial<LearnFrame> = {}): LearnFrame => ({
  now, freq: 0, volume: 0, volumeGateBase: 0.005, lastOnsetMs: 0, lastTickMs: 0, ...over,
});
const audioEndingAt = (endMs: number): RecentAudioSnapshot => ({ samples: new Float32Array(10), sampleRate: 48000, endMs });

/** A model answering each query from `answer(midi)`, resolved when `flush` runs. */
function fakeModel(answer: (midi: number) => number) {
  const asked: OnsetQuery[][] = [];
  let pending: (() => void)[] = [];
  return {
    asked,
    probe: vi.fn((_: RecentAudioSnapshot, queries: OnsetQuery[]) => {
      asked.push(queries);
      return new Promise<number[] | null>((resolve) => { pending.push(() => resolve(queries.map((q) => answer(q.midi)))); });
    }),
    flush: async () => { const due = pending; pending = []; due.forEach((go) => go()); await Promise.resolve(); },
  };
}

function setup(answer: (midi: number) => number) {
  const model = fakeModel(answer);
  let now = 0;
  const heard: number[] = [];
  const check = createLearnModelCheck({
    probe: model.probe,
    readAudio: () => audioEndingAt(now),
    onHeard: (token) => heard.push(token),
  });
  const at = (t: number, over: Partial<LearnFrame> = {}) => { now = t; return frame(t, over); };
  return { model, check, heard, at };
}

describe("createLearnModelCheck", () => {
  it("asks once a new attack has had time to sound, and moves on when the model hears the note", async () => {
    const { model, check, heard, at } = setup((midi) => (midi === 59 ? 0.9 : 0.1));
    check.arm(1, at(1000, { lastAttackMs: 900 }));
    check.observe(1, [note(B3)], at(1100, { lastAttackMs: 1050 }));
    expect(model.probe).not.toHaveBeenCalled(); // too soon after the attack
    check.observe(1, [note(B3)], at(1450, { lastAttackMs: 1050 }));
    expect(model.asked[0].map((q) => q.midi)).toEqual([59, 58, 60]);
    expect(model.asked[0][0].secondsBeforeEnd).toBeCloseTo(0.4);
    await model.flush();
    expect(heard).toEqual([1]);
  });

  it("doesn't move on when the model isn't sure, or is surer of a fret beside it", async () => {
    for (const answer of [(midi: number) => (midi === 59 ? 0.6 : 0.1), (midi: number) => (midi === 58 ? 0.95 : midi === 59 ? 0.8 : 0.1)]) {
      const { model, check, heard, at } = setup(answer);
      check.arm(1, at(1000, { lastAttackMs: 900 }));
      check.observe(1, [note(B3)], at(1450, { lastAttackMs: 1050 }));
      await model.flush();
      expect(heard).toEqual([]);
    }
  });

  it("never asks about an attack from before the beat started waiting", () => {
    const { model, check, at } = setup(() => 0.9);
    check.arm(1, at(1000, { lastAttackMs: 980 }));
    check.observe(1, [note(B3)], at(1500, { lastAttackMs: 980 }));
    expect(model.probe).not.toHaveBeenCalled();
  });

  it("asks about each attack once, and drops an answer for a beat already left", async () => {
    const { model, check, heard, at } = setup(() => 0.9);
    check.arm(1, at(1000, { lastAttackMs: 900 }));
    check.observe(1, [note(B3)], at(1450, { lastAttackMs: 1050 }));
    check.arm(2, at(1460, { lastAttackMs: 1050 })); // the old judge moved on first
    await model.flush();
    expect(heard).toEqual([]);
    check.observe(2, [note(B3)], at(1500, { lastAttackMs: 1050 }));
    expect(model.probe).toHaveBeenCalledTimes(1);
  });

  it("leaves bends, slides and hammer-ons to the pitch", () => {
    const { model, check, at } = setup(() => 0.9);
    check.arm(1, at(1000, { lastAttackMs: 900 }));
    check.observe(1, [note(B3, { readsAttack: false })], at(1450, { lastAttackMs: 1050 }));
    expect(model.probe).not.toHaveBeenCalled();
  });

  it("wants as many tones of a chord as the lesson does", async () => {
    const chord = [note(146.83), note(220), note(293.66)]; // D3 A3 D4
    const two = setup((midi) => (midi === 50 || midi === 57 ? 0.9 : 0.1));
    two.check.arm(1, two.at(1000, { lastAttackMs: 900 }));
    two.check.observe(1, chord, two.at(1450, { lastAttackMs: 1050 }));
    await two.model.flush();
    expect(two.heard).toEqual([]);
    const all = setup((midi) => ([50, 57, 62].includes(midi) ? 0.9 : 0.1));
    all.check.arm(1, all.at(1000, { lastAttackMs: 900 }));
    all.check.observe(1, chord, all.at(1450, { lastAttackMs: 1050 }));
    await all.model.flush();
    expect(all.heard).toEqual([1]);
  });
});
