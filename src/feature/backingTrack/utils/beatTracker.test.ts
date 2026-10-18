import { describe, expect, it } from "vitest";

import { synthesize } from "../testing/synthAudio";
import { ONSET_FPS, onsetEnvelope } from "./audioFeatures";
import { estimatePeriod, trackBeats } from "./beatTracker";

/** A drummer drifting from 118 to 124 BPM: loud on the beat, soft between. */
function drifting() {
  const beats: number[] = [];
  let sec = 0.6;
  for (let beat = 0; beat < 100; beat += 1) {
    beats.push(sec);
    sec += 60 / (118 + (6 * beat) / 99);
  }
  const hits = beats.flatMap((at, index) => [
    { sec: at, midi: [36, 48] },
    // Offbeat hats, quieter: a click with no tone.
    ...(index + 1 < beats.length ? [{ sec: (at + beats[index + 1]) / 2, midi: [] }] : []),
  ]);
  return { beats, onset: onsetEnvelope(synthesize(hits, sec + 1)) };
}

describe("beat tracker", () => {
  const { beats, onset } = drifting();

  it("hears the tempo near the score's, not a multiple of it", () => {
    const period = estimatePeriod(onset, ONSET_FPS, 120);
    const bpm = (60 * ONSET_FPS) / period;
    expect(bpm).toBeGreaterThan(116);
    expect(bpm).toBeLessThan(126);
  });

  it("follows a drummer who speeds up, beat by beat", () => {
    const tracked = trackBeats(onset, ONSET_FPS, estimatePeriod(onset, ONSET_FPS, 120));
    const found = beats.filter((truth) =>
      tracked.some((beat) => Math.abs(beat - truth) <= 0.025),
    );
    expect(found.length / beats.length).toBeGreaterThan(0.95);
  });

  it("finds nothing to follow in silence", () => {
    expect(trackBeats(new Float32Array(0), ONSET_FPS, 80)).toEqual([]);
  });
});
