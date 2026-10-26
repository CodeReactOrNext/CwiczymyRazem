import { describe, expect, it } from "vitest";

import type { AttackSpectra } from "./attackTones";
import { createAttackSpectraTap, isStruckAt } from "./attackTones";

const RATE = 48000;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const ms = (t: number) => Math.round((t / 1000) * RATE);

const [B2, A3, AS3, B3, A2, A4] = [47, 57, 58, 59, 45, 69].map(midiHz);

/** A deterministic plucked string: Karplus–Strong started from the triangle a
 *  pick leaves the string in, so its harmonics are a guitar's, not noise's. */
function pluck(out: Float32Array, atMs: number, freq: number, gain = 1, stopMs = Infinity) {
  const period = Math.round(RATE / freq - 0.5);
  const line = new Float32Array(period);
  let mean = 0;
  for (let i = 0; i < period; i++) {
    const x = i / period;
    line[i] = x < 0.15 ? x / 0.15 : (1 - x) / 0.85;
    mean += line[i] / period;
  }
  let smooth = 0;
  for (let i = 0; i < period; i++) line[i] = smooth = 0.3 * smooth + 0.7 * (line[i] - mean);
  const stop = stopMs === Infinity ? Infinity : ms(stopMs);
  for (let n = ms(atMs), i = 0; n < out.length; n++) {
    const fade = n < stop ? 1 : Math.max(0, 1 - (n - stop) / ms(10));
    if (fade === 0) break;
    const a = line[i];
    const b = line[(i + 1) % period];
    out[n] += gain * fade * a;
    line[i] = 0.997 * 0.5 * (a + b);
    i = (i + 1) % period;
  }
}

/** Plays `plucks`, then reads the attack at `attackMs` the way the DSP does:
 *  marked once the onset detector would have reported it, a window late. */
function attackAt(attackMs: number, plucks: [atMs: number, freq: number, gain?: number, stopMs?: number][]) {
  const audio = new Float32Array(ms(attackMs + 600));
  for (const [at, freq, gain, stop] of plucks) pluck(audio, at, freq, gain, stop);
  const tap = createAttackSpectraTap(RATE);
  let spectra: AttackSpectra | null | undefined;
  let marked = false;
  const onset = ms(attackMs);
  for (let offset = 0; offset < audio.length; offset += 2048) {
    tap.push(audio.subarray(offset, offset + 2048));
    if (!marked && tap.written >= onset + 2048) {
      tap.mark(onset, (s) => { spectra = s; });
      marked = true;
    }
  }
  if (!spectra) throw new Error("the attack was never read");
  return { spectra };
}

describe("createAttackSpectraTap", () => {
  it("gives both looks at an attack only once nothing can cut it short", () => {
    const tap = createAttackSpectraTap(RATE);
    const audio = new Float32Array(ms(1500));
    pluck(audio, 500, A3);
    tap.push(audio.subarray(0, ms(560)));
    let spectra: AttackSpectra | null | undefined;
    tap.mark(ms(500), (s) => { spectra = s; });
    expect(spectra).toBeUndefined();
    tap.push(audio.subarray(ms(560), ms(640))); // the "after" is in, but an attack inside it could still be reported
    expect(spectra).toBeUndefined();
    tap.push(audio.subarray(ms(640), ms(700)));
    expect(spectra).toBeTruthy();
  });

  it("drops an attack the next one lands inside of", () => {
    const tap = createAttackSpectraTap(RATE);
    tap.push(new Float32Array(ms(600)));
    const got: (AttackSpectra | null | undefined)[] = [undefined, undefined];
    tap.mark(ms(500), (s) => { got[0] = s; });
    tap.mark(ms(540), (s) => { got[1] = s; });
    expect(got[0]).toBeNull();
    tap.push(new Float32Array(ms(400)));
    expect(got[1]).not.toBeNull();
  });

  it("can't read an attack too close to the start to have a 'before'", () => {
    const tap = createAttackSpectraTap(RATE);
    tap.push(new Float32Array(ms(200)));
    let spectra: AttackSpectra | null | undefined;
    tap.mark(ms(40), (s) => { spectra = s; });
    expect(spectra).toBeNull();
  });
});

describe("isStruckAt", () => {
  it("hears a note struck over silence, and none of the notes it could be taken for", () => {
    const { spectra } = attackAt(500, [[500, A3]]);
    expect(isStruckAt(spectra, A3)).toBe(true);
    for (const wrong of [AS3, midiHz(56), A2, A4]) expect(isStruckAt(spectra, wrong)).toBe(false);
  });

  it("hears B3 struck while B2 still rings — which the pitch detector reads as B2", () => {
    const { spectra } = attackAt(800, [[500, B2], [800, B3, 0.5]]);
    expect(isStruckAt(spectra, B3)).toBe(true);
    expect(isStruckAt(spectra, B2)).toBe(false);
  });

  it("hears A#3 struck a semitone under a ringing B3", () => {
    const { spectra } = attackAt(800, [[200, B2], [500, B3], [800, AS3, 0.7]]);
    expect(isStruckAt(spectra, AS3)).toBe(true);
    expect(isStruckAt(spectra, B3)).toBe(false);
  });

  it("doesn't take a wrong fret for the note, with the right one's neighbour ringing", () => {
    // A3 where the tab has A#3, B3 ringing: the detector reads the pitch between them.
    const { spectra } = attackAt(800, [[200, B2], [500, B3], [800, A3, 0.7]]);
    expect(isStruckAt(spectra, AS3)).toBe(false);
  });

  it("doesn't take the octave below for the note", () => {
    const { spectra } = attackAt(800, [[500, B3, 0.5], [800, B2]]);
    expect(isStruckAt(spectra, B3)).toBe(false);
  });
});
