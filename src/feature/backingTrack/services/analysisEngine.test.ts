import { describe, expect, it } from "vitest";

import { synthesize } from "../testing/synthAudio";
import type { RecordingFeatures } from "../utils/audioFeatures";
import { ANALYSIS_SAMPLE_RATE } from "../utils/audioFeatures";
import type { LoadedTrack } from "./analysisEngine";
import { handleRequest, MISSING_TRACK, PEAKS_PER_SECOND } from "./analysisEngine";

describe("analysis engine", () => {
  it("downmixes a stereo file, keeps it, and returns only the outline", () => {
    const left = synthesize([{ sec: 0.5, midi: [57] }], 2, 1);
    const right = new Float32Array(left.length);

    const { result, transfer } = handleRequest({ kind: "load", src: "blob:one", channels: [left, right] });
    const track = result as LoadedTrack;

    expect(track.durationSec).toBeCloseTo(left.length / ANALYSIS_SAMPLE_RATE);
    expect(track.peaks.length).toBe(Math.ceil(left.length / Math.round(ANALYSIS_SAMPLE_RATE / PEAKS_PER_SECOND)));
    expect(Math.max(...track.peaks)).toBeCloseTo(1);
    expect(transfer).toEqual([track.peaks.buffer]);
  });

  it("analyses files it already holds, mixed at their own offsets", () => {
    handleRequest({ kind: "load", src: "blob:a", channels: [synthesize([{ sec: 0.4, midi: [52] }], 2, 2)] });
    handleRequest({ kind: "load", src: "blob:b", channels: [synthesize([{ sec: 0.4, midi: [64] }], 2, 3)] });

    const { result } = handleRequest({
      kind: "features",
      layers: [
        { src: "blob:a", offsetMs: 0 },
        { src: "blob:b", offsetMs: 500 },
      ],
    });
    const features = result as RecordingFeatures;

    // The second file starts half a second later, so the mix runs longer.
    expect(features.durationSec).toBeCloseTo(2.5, 1);
    expect(features.onset.length).toBeGreaterThan(0);
  });

  it("says so when asked about a file it no longer holds", () => {
    expect(() =>
      handleRequest({ kind: "features", layers: [{ src: "blob:never-loaded", offsetMs: 0 }] }),
    ).toThrow(MISSING_TRACK);
  });
});
