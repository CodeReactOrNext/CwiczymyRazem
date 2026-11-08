import { describe, expect, it } from "vitest";

import {
  advanceSustain,
  END_SILENCE_MS,
  initialSustain,
  isWrongNote,
  PROCESSOR_GATE_VOLUME,
  SUSTAIN_PASS_SHARE,
  SUSTAIN_TEST_MS,
  type SustainFrame,
  sustainProgress,
  type SustainState,
  WRONG_NOTE_MS,
} from "./sustainCheck";

const FRAME = 16;
const gates = { attackGate: 0.01, sustainGate: 0.004, toleranceCents: 60, dtMs: FRAME, rawPeak: 0.3 };
const ringing: SustainFrame = { ...gates, cents: 5, rawVolume: 0.05, gainedVolume: 0.15 };
/** The pitch dropped because the gained signal fell under the processor's gate. */
const gatedOut: SustainFrame = { ...gates, cents: null, rawVolume: 0.006, gainedVolume: PROCESSOR_GATE_VOLUME / 2 };
/** The string fell to the room's noise. */
const decayed: SustainFrame = { ...gates, cents: null, rawVolume: 0.002, gainedVolume: 0.006 };
const offPitch: SustainFrame = { ...gates, cents: 150, rawVolume: 0.05, gainedVolume: 0.15 };

const run = (state: SustainState, frame: SustainFrame, ms: number) => {
  let s = state;
  for (let t = 0; t < ms; t += FRAME) s = advanceSustain(s, frame);
  return s;
};

describe("advanceSustain", () => {
  it("passes a note followed for the whole test", () => {
    const s = run(initialSustain(), ringing, SUSTAIN_TEST_MS + 100);
    expect(s.outcome).toBe("pass");
    expect(sustainProgress(s)).toBe(1);
  });

  it("passes a note that rang past the share, as a tab note fills whole", () => {
    const held = run(initialSustain(), ringing, SUSTAIN_PASS_SHARE * SUSTAIN_TEST_MS + 50);
    expect(run(held, decayed, END_SILENCE_MS + 50).outcome).toBe("pass");
  });

  it("asks for more app gain when the detector lost a note that was still there", () => {
    const held = run(initialSustain(), ringing, 800);
    const s = run(held, gatedOut, END_SILENCE_MS + 50);
    expect(s.outcome).toBe("gain");
    expect(s.heardMs).toBeLessThan(900);
  });

  it("points at the interface when the string fell into the noise", () => {
    const held = run(initialSustain(), ringing, 800);
    expect(run(held, decayed, END_SILENCE_MS + 50).outcome).toBe("quiet");
  });

  it("says the pitch wandered when it was loud but off the note", () => {
    const held = run(initialSustain(), ringing, 800);
    expect(run(held, offPitch, END_SILENCE_MS + 50).outcome).toBe("pitch");
  });

  it("rides out a short gap", () => {
    let s = run(initialSustain(), ringing, 800);
    s = run(s, gatedOut, END_SILENCE_MS / 2);
    s = run(s, ringing, 300);
    expect(s.phase).toBe("holding");
    expect(s.heardMs).toBeGreaterThan(1000);
  });

  it("fails a note that rang to the end through a clipping input", () => {
    let s = run(initialSustain(), ringing, 500);
    s = run(s, { ...ringing, rawPeak: 1 }, 50);
    s = run(s, ringing, SUSTAIN_TEST_MS);
    expect(s.outcome).toBe("clipping");
  });

  it("fails a note held with the app's gain pinning the meter", () => {
    const s = run(initialSustain(), { ...ringing, gainedVolume: 1 }, SUSTAIN_TEST_MS + 100);
    expect(s.outcome).toBe("too_hot");
  });

  it("lets a loud attack touch the top without calling it too hot", () => {
    let s = run(initialSustain(), { ...ringing, gainedVolume: 1 }, 200);
    s = run(s, ringing, SUSTAIN_TEST_MS);
    expect(s.outcome).toBe("pass");
  });

  it("flags another note while waiting for the right one", () => {
    const s = run(initialSustain(), offPitch, WRONG_NOTE_MS + 50);
    expect(s.phase).toBe("waiting");
    expect(isWrongNote(s)).toBe(true);
  });
});
