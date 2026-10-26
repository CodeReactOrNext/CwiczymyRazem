import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";
import { describe, expect, it } from "vitest";

import type { ExpectedAttack } from "./noteEventGrader";
import { assignAttacks } from "./noteEventGrader";

const E4 = 329.63, G4 = 392.0, A4 = 440.0, B4 = 493.88;

const ev = (onsetMs: number, pitchHz: number, peakVolume = 0.2): DetectedNoteEvent =>
  ({ onsetMs, pitchHz, peakVolume });

const exp_ = (key: string, timeMs: number, targetFreq: number): ExpectedAttack =>
  ({ key, timeMs, targetFreq, toleranceCents: 45, volumeGate: 0.005 });

describe("assignAttacks", () => {
  it("matches an in-order run one-to-one", () => {
    const expected = [exp_("n0", 0, E4), exp_("n1", 80, G4), exp_("n2", 160, A4)];
    const events = [ev(2, E4), ev(83, G4), ev(158, A4)];

    const out = assignAttacks(events, expected, 130);

    expect(out).toHaveLength(3);
    expect(out.map(a => a.key).sort()).toEqual(["n0", "n1", "n2"]);
    out.forEach(a => expect(Math.abs(a.deltaMs)).toBeLessThan(10));
  });

  it("prefers the in-order reading when a swapped one is also possible", () => {
    // Two same-distance candidates exist because both notes are inside the
    // window of both events; the smaller |Δt| pairing must win.
    const expected = [exp_("n0", 0, E4), exp_("n1", 80, E4)];
    const events = [ev(5, E4), ev(85, E4)];

    const out = assignAttacks(events, expected, 130);

    expect(out.find(a => a.key === "n0")!.eventIndex).toBe(0);
    expect(out.find(a => a.key === "n1")!.eventIndex).toBe(1);
  });

  it("still credits two adjacent notes played in swapped order", () => {
    // The player attacked G4 first, then E4 — inside one hit window, which is
    // exactly the case the detector cannot resolve. Both count.
    const expected = [exp_("n0", 0, E4), exp_("n1", 80, G4)];
    const events = [ev(5, G4), ev(85, E4)];

    const out = assignAttacks(events, expected, 130);

    expect(out).toHaveLength(2);
    expect(out.map(a => a.key).sort()).toEqual(["n0", "n1"]);
  });

  it("does not credit a reordering wider than the uncertainty window", () => {
    // Same two pitches, but swapped across 400 ms — that we CAN see.
    const expected = [exp_("n0", 0, E4), exp_("n1", 400, G4)];
    const events = [ev(5, G4), ev(405, E4)];

    expect(assignAttacks(events, expected, 130)).toHaveLength(0);
  });

  it("lets one attack credit at most one note", () => {
    // A single attack under a run of four identical expected notes must not
    // fill the whole run.
    const expected = [exp_("n0", 0, E4), exp_("n1", 60, E4), exp_("n2", 120, E4)];
    const events = [ev(5, E4)];

    expect(assignAttacks(events, expected, 130)).toHaveLength(1);
  });

  it("rejects a wrong pitch outright, however well timed", () => {
    const expected = [exp_("n0", 0, E4)];
    expect(assignAttacks([ev(0, B4)], expected, 130)).toHaveLength(0);
  });

  it("rejects attacks quieter than the note's volume gate", () => {
    const expected = [exp_("n0", 0, E4)];
    expect(assignAttacks([ev(0, E4, 0.001)], expected, 130)).toHaveLength(0);
  });

  it("ignores events whose pitch never resolved", () => {
    const expected = [exp_("n0", 0, E4)];
    expect(assignAttacks([ev(0, 0)], expected, 130)).toHaveLength(0);
  });

  it("applies the low-string octave correction", () => {
    // E2 detected an octave up — the same 2nd-harmonic quirk the live path
    // already forgives, and only ever toward a genuinely low target.
    const expected: ExpectedAttack[] = [
      { key: "n0", timeMs: 0, targetFreq: 82.41, toleranceCents: 45, volumeGate: 0.005 },
    ];
    expect(assignAttacks([ev(0, 164.82)], expected, 130)).toHaveLength(1);
  });

  it("keeps an attack earlier than a note's floor for the note before it", () => {
    // A note whose pitch is already ringing: an attack 300 ms ahead was the
    // previous note settling, not this one being picked early.
    const expected: ExpectedAttack[] = [{ ...exp_("n0", 1000, E4), earliestDeltaMs: -200 }];
    expect(assignAttacks([ev(700, E4)], expected, 420)).toHaveLength(0);
    expect(assignAttacks([ev(850, E4)], expected, 420)).toEqual([{ key: "n0", eventIndex: 0, deltaMs: -150 }]);
    // Late attacks aren't affected by the floor.
    expect(assignAttacks([ev(1300, E4)], expected, 420)).toHaveLength(1);
  });

  it("does not invent matches from an empty side", () => {
    expect(assignAttacks([], [exp_("n0", 0, E4)], 130)).toHaveLength(0);
    expect(assignAttacks([ev(0, E4)], [], 130)).toHaveLength(0);
  });

  it("is deterministic regardless of incidental input order", () => {
    const expected = [exp_("n0", 0, E4), exp_("n1", 80, G4), exp_("n2", 160, A4)];
    const events = [ev(2, E4), ev(83, G4), ev(158, A4)];

    const a = assignAttacks(events, expected, 130);
    const b = assignAttacks(events, [...expected].reverse(), 130);

    expect(a.map(x => `${x.key}:${x.eventIndex}`).sort())
      .toEqual(b.map(x => `${x.key}:${x.eventIndex}`).sort());
  });
});

// ── What the attack struck (attackTones.ts) ─────────────────────────────────

const BIN_HZ = 48000 / 4096;
const [A3, AS3, B2, B3] = [220, 233.08, 123.47, 246.94];

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

/** An attack that struck `struck` over strings already ringing at `ringing`. */
const struckOver = (ringing: number[], struck: number[]): DetectedNoteEvent["attack"] => {
  return { before: notes(...ringing), after: notes(...ringing, ...struck), binHz: BIN_HZ };
};

const plain = (key: string, timeMs: number, targetFreq: number): ExpectedAttack =>
  ({ ...exp_(key, timeMs, targetFreq), readsAttack: true });

describe("assignAttacks — what the attack struck", () => {
  it("credits a note its attack struck, though the pitch read after it is a string still ringing", () => {
    // B3 picked under a ringing B2: the detector reads B2.
    const event = { ...ev(0, B2), attack: struckOver([B2], [B3]) };
    expect(assignAttacks([event], [plain("n0", 0, B3)], 130)).toHaveLength(1);
  });

  it("still credits by pitch what the attack's spectrum can't confirm — it only ever adds", () => {
    // A string picked again while it still rings barely changes the spectrum.
    const event = { ...ev(0, B3), attack: struckOver([B3], []) };
    expect(assignAttacks([event], [plain("n0", 0, B3)], 130)).toHaveLength(1);
    // Nor does it wait for the spectrum: the pitch counts right away.
    expect(assignAttacks([{ ...ev(0, B3), attack: "reading" as const }], [plain("n0", 0, B3)], 130)).toHaveLength(1);
  });

  it("leaves bends, slides and the rest to the pitch, as before", () => {
    const event = { ...ev(0, AS3), attack: struckOver([B3], [A3]) };
    expect(assignAttacks([event], [exp_("n0", 0, AS3)], 130)).toHaveLength(1);
  });
});
