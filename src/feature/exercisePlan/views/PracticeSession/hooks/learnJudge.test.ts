import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";
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
  noteKey: `n${Math.round(freq)}`, freq, isDead: false, hasAttack: true, readsAttack: true, ...over,
});

const frame = (now: number, over: Partial<LearnFrame> = {}): LearnFrame => ({
  now, freq: 0, volume: 0, volumeGateBase: 0.005, lastOnsetMs: 0, lastTickMs: 0, ...over,
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

describe("createLearnJudge — a note a half step away", () => {
  const Eb2 = E2 * Math.pow(2, -1 / 12);
  /** The detector reads the low strings sharp — E2 by about 50 cents. */
  const readSharp = (freq: number, cents: number) => freq * Math.pow(2, cents / 1200);
  const withSpectrum = (tones: number[], freq: number) => ({
    freq, volume: 0.1, lastOnsetMs: 1005, readSpectrum: () => spectrumOf(tones),
  });

  it("is not taken for the written low note, even though the biased reading lands inside the window", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    // Eb2 played, E2 written: 100 cents flat, read 54 cents sharp = 46 cents flat.
    expect(heldFor(judge, [note(E2)], 1200, withSpectrum([Eb2], readSharp(Eb2, 54)))).toBe(false);
  });

  it("accepts the written low note on the same biased reading", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    expect(heldFor(judge, [note(E2)], 1200, withSpectrum([E2], readSharp(E2, 54)))).toBe(true);
  });

  it("is not taken for the written note higher up the neck either", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const Gs3 = A3 * Math.pow(2, -1 / 12);
    // The pitch reading is dragged to the written note; the spectrum is not.
    expect(heldFor(judge, [note(A3)], 1200, withSpectrum([Gs3], A3))).toBe(false);
  });

  it("is not played when the spectrum has nothing to show for the note", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const silent = { freq: A3, volume: 0.1, lastOnsetMs: 1005, readSpectrum: () => null };
    expect(heldFor(judge, [note(A3)], 1200, silent)).toBe(false);
  });

  it("asks for a pitch within 35 cents on a high string", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const sharpBy40 = B4 * Math.pow(2, 40 / 1200);
    expect(heldFor(judge, [note(B4)], 1200, withSpectrum([B4], sharpBy40))).toBe(false);
  });

  it("drops a chord tone a half step off the shape", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000));
    const chord = [note(A3), note(D4), note(FS4)];
    const F4 = FS4 * Math.pow(2, -1 / 12);
    const heard = (t: number) => frame(t, { volume: 0.2, lastOnsetMs: 1005, readSpectrum: () => spectrumOf([A3, D4, F4]) });
    judge.judge(chord, heard(1010));
    expect(judge.judge(chord, heard(1010 + LEARN_HOLD_MS))).toBe(false);
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
  const muted: LearnTarget = { noteKey: "x", freq: 0, isDead: true, hasAttack: true, readsAttack: false };

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

// ── What the attack struck (attackTones.ts) ─────────────────────────────────

describe("createLearnJudge — under strings still ringing", () => {
  const BIN_HZ = 48000 / 4096;
  const [AS3, B2, B3] = [233.08, 123.47, 246.94];
  /** An idealised magnitude spectrum: each note's first harmonics as clean peaks. */
  const notes = (...freqs: number[]): Float32Array => {
    const magnitudes = new Float32Array(Math.ceil(2000 / BIN_HZ) + 2);
    for (const f of freqs) {
      for (let h = 1; h * f < 2000; h++) {
        const bin = Math.round((h * f) / BIN_HZ);
        magnitudes[bin] += 1 / h;
        magnitudes[bin - 1] += 0.3 / h;
        magnitudes[bin + 1] += 0.3 / h;
      }
    }
    return magnitudes;
  };
  /** An attack at 1050 that struck `struck` over strings already ringing at `ringing`. */
  const attack = (ringing: number[], struck: number[]): DetectedNoteEvent => ({
    onsetMs: 1050, pitchHz: 0, peakVolume: 0.1,
    attack: { before: notes(...ringing), after: notes(...ringing, ...struck), binHz: BIN_HZ },
  });
  const after = (t: number, event: DetectedNoteEvent, over: Partial<LearnFrame> = {}) =>
    frame(t, { volume: 0.1, lastOnsetMs: 1100, lastAttackMs: event.onsetMs, events: [event], ...over });

  it("moves on once the attack is heard to strike the note, whatever the pitch reads", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { events: [] }));
    // B3 picked under a ringing B2: the detector reads B2.
    expect(judge.judge([note(B3)], after(1250, attack([B2], [B3]), { freq: B2 }))).toBe(true);
  });
  it("still takes the pitch path when the attack's spectrum can't confirm the note — it only ever adds", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { events: [] }));
    // A3 picked where A#3 is waited on: the attack shows A3, the pitch reads A#3 —
    // the pitch path decides, exactly as it did before.
    const other = attack([B3], [A3]);
    const reading = { freq: AS3, readSpectrum: () => spectrumOf([AS3]) };
    expect(heldFor(judge, [note(AS3)], 1110, { ...reading, volume: 0.1, lastOnsetMs: 1100, lastAttackMs: 1050, events: [other] })).toBe(true);
  });
});

describe("createLearnJudge — a low string picked softly", () => {
  it("takes the low-band attack the onset detector missed, for a low note", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { lastOnsetMs: 900, lastLowAttackMs: 900 }));
    // The thumb on the low E: no onset, but the low band heard it at 1050.
    const thumb = { freq: E2, volume: 0.1, lastOnsetMs: 900, lastLowAttackMs: 1050 };
    expect(judge.judge([note(E2)], frame(1060, thumb))).toBe(false);
    expect(judge.judge([note(E2)], frame(1060 + LEARN_HOLD_MS, thumb))).toBe(true);
  });

  it("doesn't count it for a note above the low strings", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { lastOnsetMs: 900, lastLowAttackMs: 900 }));
    expect(heldFor(judge, [note(A3)], 1060, { freq: A3, volume: 0.1, lastOnsetMs: 900, lastLowAttackMs: 1050 })).toBe(false);
  });

  it("still asks for a new one: an attack before the beat started waiting is spent", () => {
    const judge = createLearnJudge();
    judge.arm(frame(1000, { lastOnsetMs: 900, lastLowAttackMs: 950 }));
    expect(heldFor(judge, [note(E2)], 1100, { freq: E2, volume: 0.1, lastOnsetMs: 900, lastLowAttackMs: 950 })).toBe(false);
  });
});
