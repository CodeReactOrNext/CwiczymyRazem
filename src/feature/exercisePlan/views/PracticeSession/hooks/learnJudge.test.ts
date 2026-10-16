import type { Spectrum } from "utils/audio/chordTones";
import { harmonicFor } from "utils/audio/chordTones";
import { describe, expect, it } from "vitest";

import type { LearnTarget } from "../utils/learnSteps";
import type { LearnFrame } from "./learnJudge";
import { createLearnJudge, LEARN_HOLD_MS } from "./learnJudge";

const E2 = 82.41;
const A3 = 220;
const D4 = 293.66;
const FS4 = 369.99;
const B4 = 493.88;

const note = (freq: number, over: Partial<LearnTarget> = {}): LearnTarget => ({
  noteKey: `n${Math.round(freq)}`, freq, isDead: false, hasAttack: true, ...over,
});

const frame = (now: number, over: Partial<LearnFrame> = {}): LearnFrame => ({
  now, freq: 0, volume: 0, volumeGateBase: 0.005, confidence: 0, lastOnsetMs: 0, lastTickMs: 0, ...over,
});

/** Plays the same reading twice, a hold apart — the way frames keep arriving — and says what the second one decided. */
function heldFor(judge: ReturnType<typeof createLearnJudge>, targets: LearnTarget[], at: number, over: Partial<LearnFrame>) {
  judge.judge(targets, frame(at, over));
  return judge.judge(targets, frame(at + LEARN_HOLD_MS, over));
}

/** A spectrum with one clean peak where each chord tone is looked for. */
function spectrumOf(freqs: number[]): Spectrum {
  const binHz = 5;
  const magnitudes = new Float32Array(Math.ceil(2000 / binHz) + 1);
  for (const f of freqs) magnitudes[Math.round((f * harmonicFor(f, binHz)) / binHz)] = 1;
  return { magnitudes, binHz };
}

describe("createLearnJudge — a picked note", () => {
  it("waits while nothing is played", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    for (let t = 1000; t < 3000; t += 16) expect(judge.judge([note(A3)], frame(t))).toBe(false);
  });

  it("accepts the right pitch once it has been held after the attack", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const played = (t: number) => frame(t, { freq: A3, volume: 0.1, lastOnsetMs: 1005 });
    // First heard at 1010: the hold runs from there.
    expect(judge.judge([note(A3)], played(1010))).toBe(false);
    expect(judge.judge([note(A3)], played(1010 + LEARN_HOLD_MS - 1))).toBe(false);
    expect(judge.judge([note(A3)], played(1010 + LEARN_HOLD_MS))).toBe(true);
  });

  it("does not accept another pitch, however long it rings", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    for (let t = 1010; t < 3000; t += 16) {
      expect(judge.judge([note(A3)], frame(t, { freq: D4, volume: 0.1, lastOnsetMs: 1005 }))).toBe(false);
    }
  });

  it("does not take a note still ringing from before as the answer", () => {
    const judge = createLearnJudge();
    // The right pitch is already sounding from an attack the lesson has spent.
    judge.arm(frame(1000, { freq: A3, volume: 0.1, lastOnsetMs: 900 }));
    for (let t = 1010; t < 3000; t += 16) {
      expect(judge.judge([note(A3)], frame(t, { freq: A3, volume: 0.1, lastOnsetMs: 900 }))).toBe(false);
    }
  });

  it("asks for a new attack when the same pitch comes twice", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    expect(heldFor(judge, [note(A3)], 1100, { freq: A3, volume: 0.1, lastOnsetMs: 1005 })).toBe(true);

    judge.arm(frame(1200, { freq: A3, volume: 0.1, lastOnsetMs: 1005 }));
    expect(judge.judge([note(A3)], frame(1500, { freq: A3, volume: 0.1, lastOnsetMs: 1005 }))).toBe(false);
    expect(judge.judge([note(A3)], frame(2010, { freq: A3, volume: 0.1, lastOnsetMs: 2000 }))).toBe(false);
    expect(judge.judge([note(A3)], frame(2000 + LEARN_HOLD_MS, { freq: A3, volume: 0.1, lastOnsetMs: 2000 }))).toBe(true);
  });

  it("starts the hold over after the pitch wavers", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const right = (t: number) => frame(t, { freq: A3, volume: 0.1, lastOnsetMs: 1005 });
    expect(judge.judge([note(A3)], right(1010))).toBe(false);
    expect(judge.judge([note(A3)], frame(1040, { freq: D4, volume: 0.1, lastOnsetMs: 1005 }))).toBe(false);
    expect(judge.judge([note(A3)], right(1050))).toBe(false);
    expect(judge.judge([note(A3)], right(1050 + LEARN_HOLD_MS))).toBe(true);
  });

  it("ignores a pitch too quiet to be the string", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    for (let t = 1010; t < 2000; t += 16) {
      expect(judge.judge([note(A3)], frame(t, { freq: A3, volume: 0.001, lastOnsetMs: 1005 }))).toBe(false);
    }
  });

  it("takes the detector's octave slip on a low string for the note", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    expect(heldFor(judge, [note(E2)], 1200, { freq: E2 * 2, volume: 0.1, lastOnsetMs: 1005 })).toBe(true);
  });

  it("forgives a few cents of tuning drift", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const sharpBy30Cents = A3 * Math.pow(2, 30 / 1200);
    expect(heldFor(judge, [note(A3)], 1200, { freq: sharpBy30Cents, volume: 0.1, lastOnsetMs: 1005 })).toBe(true);
  });
});

describe("createLearnJudge — a note with no attack of its own", () => {
  it("accepts a hammer-on by its pitch alone, once it is heard after the beat before", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { freq: A3, volume: 0.1, lastOnsetMs: 990 }));
    const target = note(D4, { hasAttack: false });
    const ringing = (t: number) => frame(t, { freq: D4, volume: 0.1, lastOnsetMs: 990 });
    expect(judge.judge([target], ringing(1100))).toBe(false);
    expect(judge.judge([target], ringing(1100 + LEARN_HOLD_MS))).toBe(true);
  });
});

describe("createLearnJudge — a muted note", () => {
  const muted: LearnTarget = { noteKey: "x", freq: 0, isDead: true, hasAttack: true };

  it("waits for a fresh thud", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { lastTickMs: 900 }));
    expect(judge.judge([muted], frame(1100, { volume: 0.1, lastTickMs: 900 }))).toBe(false);
    expect(judge.judge([muted], frame(1200, { volume: 0.1, lastTickMs: 1150 }))).toBe(true);
  });

  it("does not take silence for it", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    expect(judge.judge([muted], frame(1200, { volume: 0, lastTickMs: 1150 }))).toBe(false);
  });
});

describe("createLearnJudge — a chord", () => {
  const strummed = (tones: number[], over: Partial<LearnFrame> = {}) => (t: number) =>
    frame(t, { volume: 0.2, lastOnsetMs: 1005, readSpectrum: () => spectrumOf(tones), ...over });

  it("needs the strum to be new and the tones to ring for a moment", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const chord = [note(A3), note(D4), note(FS4)];
    const heard = strummed([A3, D4, FS4]);
    expect(judge.judge(chord, heard(1010))).toBe(false);
    expect(judge.judge(chord, heard(1010 + LEARN_HOLD_MS))).toBe(true);
  });

  it("is not played while a string of a small shape is missing", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const chord = [note(A3), note(D4), note(FS4)];
    const heard = strummed([A3, D4]);
    judge.judge(chord, heard(1010));
    expect(judge.judge(chord, heard(1010 + LEARN_HOLD_MS))).toBe(false);
  });

  it("lets a big chord through with one weak string", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const chord = [note(A3), note(D4), note(FS4), note(B4)];
    const heard = strummed([A3, D4, FS4]);
    judge.judge(chord, heard(1010));
    expect(judge.judge(chord, heard(1010 + LEARN_HOLD_MS))).toBe(true);
  });

  it("does not take the strum before as the answer", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { lastOnsetMs: 1005 }));
    const chord = [note(A3), note(D4), note(FS4)];
    const heard = strummed([A3, D4, FS4]);
    judge.judge(chord, heard(1010));
    expect(judge.judge(chord, heard(1010 + LEARN_HOLD_MS))).toBe(false);
  });

  it("hears nothing without a spectrum", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const chord = [note(A3), note(D4)];
    expect(judge.judge(chord, frame(1100, { volume: 0.2, lastOnsetMs: 1005 }))).toBe(false);
  });
});
