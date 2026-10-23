import { getCentsDistance } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { createGuitarDetectors } from "./guitarBufferProcessor";
import { ANALYSIS_SAMPLE_RATE, getDecimationFactor, GUITAR_INPUT_WORKLET_CODE } from "./guitarInputWorklet";

interface WorkletProcessor {
  process(inputs: Float32Array[][]): boolean;
}
type WorkletProcessorClass = new (options?: { processorOptions?: { decimation?: number } }) => WorkletProcessor;

/** Evaluates the worklet source the way AudioWorkletGlobalScope would, with a
 *  stub base class whose port collects every posted window. */
function loadWorklet() {
  const posted: Float32Array[] = [];
  class AudioWorkletProcessorStub {
    port = { postMessage: (buf: Float32Array) => posted.push(buf) };
  }
  let Processor: WorkletProcessorClass | null = null;
  new Function("AudioWorkletProcessor", "registerProcessor", GUITAR_INPUT_WORKLET_CODE)(
    AudioWorkletProcessorStub,
    (_name: string, cls: WorkletProcessorClass) => { Processor = cls; },
  );
  if (!Processor) throw new Error("worklet did not register a processor");
  return { Processor: Processor as WorkletProcessorClass, posted };
}

/** Feeds `signal` to the worklet in 128-sample render quanta, like the browser. */
function runWorklet(signal: Float32Array, decimation: number): Float32Array[] {
  const { Processor, posted } = loadWorklet();
  const node = new Processor({ processorOptions: { decimation } });
  for (let i = 0; i < signal.length; i += 128) node.process([[signal.subarray(i, i + 128)]]);
  return posted;
}

/** A sustained guitar-like note: 12 harmonics with 1/h^1.2 rolloff. */
function renderNote(f0: number, sampleRate: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.round(sampleRate * seconds));
  for (let n = 0; n < out.length; n++) {
    let s = 0;
    for (let h = 1; h <= 12; h++) s += Math.pow(h, -1.2) * Math.sin((2 * Math.PI * f0 * h * n) / sampleRate);
    out[n] = s * 0.2;
  }
  return out;
}

async function medianPitch(windows: Float32Array[], sampleRate: number): Promise<number> {
  const AubioModule: any = await import("aubiojs");
  const aubio = await (AubioModule.default || AubioModule)();
  const { pitch } = createGuitarDetectors(aubio, sampleRate);
  const estimates: number[] = [];
  windows.forEach((window, w) => {
    for (let offset = 0; offset < window.length; offset += 512) {
      const hz = pitch.do(window.subarray(offset, offset + 512));
      if (w > 1 && hz > 20) estimates.push(hz); // skip the detector's warm-up
    }
  });
  estimates.sort((a, b) => a - b);
  return estimates[estimates.length >> 1];
}

const LOW_E = 82.41;

describe("getDecimationFactor", () => {
  it("leaves the usual device rates alone", () => {
    expect(getDecimationFactor(44100)).toBe(1);
    expect(getDecimationFactor(48000)).toBe(1);
  });

  it("brings high-rate interfaces down to ~48 kHz", () => {
    expect(getDecimationFactor(88200)).toBe(2);
    expect(getDecimationFactor(96000)).toBe(2);
    expect(getDecimationFactor(176400)).toBe(4);
    expect(getDecimationFactor(192000)).toBe(4);
  });
});

describe("guitar input worklet", () => {
  it("passes samples through untouched without decimation", () => {
    const signal = Float32Array.from({ length: 4096 }, (_, i) => Math.sin(i / 10));
    const windows = runWorklet(signal, 1);
    expect(windows).toHaveLength(2);
    expect(Array.from(windows[0])).toEqual(Array.from(signal.subarray(0, 2048)));
    expect(Array.from(windows[1])).toEqual(Array.from(signal.subarray(2048)));
  });

  it("averages groups of `decimation` samples into 2048-sample windows", () => {
    const signal = Float32Array.from({ length: 8192 }, (_, i) => i % 4);
    const windows = runWorklet(signal, 4);
    expect(windows).toHaveLength(1);
    expect(windows[0].every((v) => v === 1.5)).toBe(true);
  });

  it("reads low E at 192 kHz the same as a native 48 kHz capture", async () => {
    const native = await medianPitch(runWorklet(renderNote(LOW_E, 48000, 1), 1), 48000);

    const deviceRate = 192000;
    const decimation = getDecimationFactor(deviceRate);
    const decimated = await medianPitch(
      runWorklet(renderNote(LOW_E, deviceRate, 1), decimation),
      deviceRate / decimation,
    );

    expect(deviceRate / decimation).toBe(ANALYSIS_SAMPLE_RATE);
    expect(Math.abs(getCentsDistance(decimated, native))).toBeLessThan(5);
  });

  it("reads low E at 44.1 kHz without the ~150¢ sharp error of analysing it as 48 kHz", async () => {
    const deviceRate = 44100;
    const windows = runWorklet(renderNote(LOW_E, deviceRate, 1), getDecimationFactor(deviceRate));

    const correct = await medianPitch(windows, deviceRate);
    const mislabelled = await medianPitch(windows, 48000); // the old pinned-context failure

    expect(Math.abs(getCentsDistance(correct, LOW_E))).toBeLessThan(25);
    expect(getCentsDistance(mislabelled, LOW_E)).toBeGreaterThan(120);
  });
});
