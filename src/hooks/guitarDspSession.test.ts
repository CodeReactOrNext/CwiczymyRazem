// The worker path must hear exactly what the processor hears on its own
// thread: the same readings after every window and the same note events,
// attack spectra included — only somewhere else, and a message later.

import { describe, expect, it } from "vitest";

import type { DetectedNoteEvent } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor, createGuitarDetectors } from "./guitarBufferProcessor";
import type { DspTargets } from "./guitarDspSession";
import { applyDspReadings, createDspSession } from "./guitarDspSession";

const SAMPLE_RATE = 48000;
const WINDOW = 2048;

const box = <T,>(value: T) => ({ current: value });

const makeTargets = () => ({
  frequencyRef: box(0),
  volumeRef: box(0),
  rawVolumeRef: box(0),
  noiseFloorRef: box(0),
  confidenceRef: box(0),
  lastOnsetTimeRef: box(0),
  lastTickTimeRef: box(0),
  noteEventsRef: box<DetectedNoteEvent[]>([]),
  lastAttackMsRef: box(0),
  lastLowAttackMsRef: box(0),
  lastSoftAttackMsRef: box(0),
  inputPeakRef: box(0),
}) satisfies DspTargets;

const snapshot = (targets: ReturnType<typeof makeTargets>) =>
  Object.fromEntries(Object.entries(targets).filter(([key]) => key !== "noteEventsRef").map(([key, ref]) => [key, ref.current]));

/** Plucked notes a quarter of a second apart, with a silent bar in the middle. */
function renderRun(seconds: number): Float32Array {
  const out = new Float32Array(Math.round(SAMPLE_RATE * seconds));
  const notes = [110, 146.83, 196, 246.94, 329.63, 220];
  for (let n = 0; n < out.length; n++) {
    const t = n / SAMPLE_RATE;
    if (t >= 1.5 && t < 2.5) continue;
    const index = Math.floor(t / 0.25);
    const sincePluck = t - index * 0.25;
    const f0 = notes[index % notes.length];
    let s = 0;
    for (let h = 1; h <= 8; h++) s += Math.pow(h, -1.2) * Math.sin(2 * Math.PI * f0 * h * t);
    out[n] = 0.25 * s * Math.exp(-sincePluck * 7) * Math.min(1, sincePluck * 400);
  }
  return out;
}

async function loadAubio(): Promise<unknown> {
  // @ts-ignore — aubiojs has no types
  const AubioModule = await import("aubiojs");
  return (AubioModule.default || AubioModule)();
}

describe("guitar DSP session", () => {
  it("leaves the refs exactly as the processor on its own thread does", async () => {
    const aubio = await loadAubio();
    const signal = renderRun(4);

    const direct = makeTargets();
    const processDirect = createGuitarBufferProcessor({
      detectors: createGuitarDetectors(aubio, SAMPLE_RATE),
      targets: direct,
      sampleRate: SAMPLE_RATE,
      getGain: () => 3,
    });

    const viaWorker = makeTargets();
    const session = createDspSession(aubio, SAMPLE_RATE, { gain: 3, bass: false, strum: true });

    let windows = 0;
    for (let offset = 0; offset + WINDOW <= signal.length; offset += WINDOW, windows++) {
      const timeMs = 1_000_000 + ((offset + WINDOW) / SAMPLE_RATE) * 1000;
      processDirect(signal.slice(offset, offset + WINDOW), timeMs);
      // Through a structured clone, as postMessage would take it.
      applyDspReadings(viaWorker, structuredClone(session.push(signal.slice(offset, offset + WINDOW), timeMs)));
      expect(snapshot(viaWorker)).toEqual(snapshot(direct));
    }

    expect(windows).toBeGreaterThan(80);
    expect(direct.noteEventsRef.current.length).toBeGreaterThan(8);
    expect(viaWorker.noteEventsRef.current).toEqual(direct.noteEventsRef.current);
    // Spectra that came in after their event was posted made it across too.
    expect(viaWorker.noteEventsRef.current.some((event) => event.attack && event.attack !== "reading")).toBe(true);
    expect(viaWorker.noteEventsRef.current.every((event) => event.attack !== "reading")).toBe(true);
  });

  it("updates an event the reader already holds instead of replacing it", async () => {
    const aubio = await loadAubio();
    const signal = renderRun(1.5);
    const targets = makeTargets();
    const session = createDspSession(aubio, SAMPLE_RATE, { gain: 3, bass: false, strum: false });

    let held: DetectedNoteEvent | null = null;
    for (let offset = 0; offset + WINDOW <= signal.length; offset += WINDOW) {
      const message = structuredClone(session.push(signal.slice(offset, offset + WINDOW), 1_000_000 + (offset / SAMPLE_RATE) * 1000));
      applyDspReadings(targets, message);
      held ??= targets.noteEventsRef.current.find((event) => event.attack === "reading") ?? null;
    }

    expect(held).not.toBeNull();
    expect(held!.attack).not.toBe("reading");
    expect(targets.noteEventsRef.current).toContain(held);
  });

  it("leaves the strum detector idle until a strumming exercise asks for it", async () => {
    const aubio = await loadAubio();
    const signal = renderRun(1.5);
    const session = createDspSession(aubio, SAMPLE_RATE, { gain: 3, bass: false, strum: false });

    let softAttack = 0;
    const run = () => {
      for (let offset = 0; offset + WINDOW <= signal.length; offset += WINDOW) {
        softAttack = session.push(signal.slice(offset, offset + WINDOW), 1_000_000 + (offset / SAMPLE_RATE) * 1000).readings.lastSoftAttackMs;
      }
    };
    run();
    expect(softAttack).toBe(0);

    session.configure({ strum: true });
    run();
    expect(softAttack).toBeGreaterThan(0);
  });

  it("reports the processor's throttled sign of life", async () => {
    const aubio = await loadAubio();
    const session = createDspSession(aubio, SAMPLE_RATE, { gain: 3, bass: false, strum: false });
    const window = renderRun(0.1).slice(0, WINDOW);
    expect(session.push(window, 1_000_000).readings.active).toBe(true);
    // 43 ms later is inside the 100 ms throttle.
    expect(session.push(window, 1_000_043).readings.active).toBe(false);
    expect(session.push(window, 1_000_120).readings.active).toBe(true);
  });
});
