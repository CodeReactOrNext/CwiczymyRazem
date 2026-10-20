import { describe, expect, it } from "vitest";

import type { ParamLike } from "./envelope";
import { Envelope } from "./envelope";

/** Records what the envelope asks of the AudioParam. */
function fakeParam() {
  const calls: string[] = [];
  const param: ParamLike = {
    setValueAtTime: (v, t) =>
      calls.push(`set ${v.toFixed(3)} @${+t.toFixed(4)}`),
    linearRampToValueAtTime: (v, t) =>
      calls.push(`ramp ${v.toFixed(3)} @${+t.toFixed(4)}`),
    setTargetAtTime: (v, t, tau) => calls.push(`target ${v} @${t} tau ${tau}`),
    cancelScheduledValues: (t) => calls.push(`cancel @${t}`),
  };
  return { param, calls };
}

describe("Envelope", () => {
  it("knows its level along an attack ramp and after it", () => {
    const envelope = new Envelope(fakeParam().param);
    envelope.set(0, 1);
    envelope.rampTo(0.8, 2);
    expect(envelope.levelAt(0.5)).toBe(0);
    expect(envelope.levelAt(1.5)).toBeCloseTo(0.4);
    expect(envelope.levelAt(3)).toBeCloseTo(0.8);
  });

  it("follows an exponential approach", () => {
    const envelope = new Envelope(fakeParam().param);
    envelope.set(1, 0);
    envelope.approach(0, 1, 0.5);
    expect(envelope.levelAt(1)).toBeCloseTo(1);
    expect(envelope.levelAt(1.5)).toBeCloseTo(Math.exp(-1));
  });

  it("fades from mid-attack without a jump", () => {
    const { param, calls } = fakeParam();
    const envelope = new Envelope(param);
    envelope.set(0, 0);
    envelope.rampTo(1, 1);
    calls.length = 0;
    envelope.fadeOut(0.25, 0.1);
    // Anchored at the level the ramp had reached, then the fade.
    expect(calls).toEqual([
      "cancel @0.25",
      "set 0.250 @0.25",
      "target 0 @0.25 tau 0.1",
    ]);
    expect(envelope.levelAt(0.25)).toBeCloseTo(0.25);
  });

  it("ties a fading note back up from where the fade got to", () => {
    const { param, calls } = fakeParam();
    const envelope = new Envelope(param);
    envelope.set(0, 0);
    envelope.rampTo(1, 0.5);
    envelope.fadeOut(2, 0.4);
    calls.length = 0;
    envelope.glideTo(1, 2.2, 0.06);
    const faded = Math.exp(-0.2 / 0.4);
    expect(calls).toEqual([
      "cancel @2.2",
      `set ${faded.toFixed(3)} @2.2`,
      "ramp 1.000 @2.26",
    ]);
    expect(envelope.levelAt(3)).toBeCloseTo(1);
  });
  it("forgets its past without changing where it is going", () => {
    const envelope = new Envelope(fakeParam().param);
    envelope.set(1, 0);
    // A long-lived sidechain duck: a dip and a recovery every half second.
    for (let k = 0; k < 40; k++) {
      envelope.moveTo(0.5, k * 0.5, 0.006);
      envelope.moveTo(1, k * 0.5 + 0.05, 0.09);
    }
    const before = [19.52, 19.6, 19.9, 21].map((t) => envelope.levelAt(t));
    envelope.forget(19.5);
    const after = [19.52, 19.6, 19.9, 21].map((t) => envelope.levelAt(t));
    after.forEach((level, i) => expect(level).toBeCloseTo(before[i], 6));
  });
});
