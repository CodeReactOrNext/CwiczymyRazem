// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useTablatureRenderData } from "./useTablatureRenderData";

// The worker draws on an OffscreenCanvas nobody can look at from a test, so this
// drives it through its message handler with a context that only records what
// was drawn — enough to know the learn-mode target is painted, goes away with
// the lesson, and stops costing frames when motion is off.

const LEARN_COLOR = "#22d3ee";
const FRAME_MS = 16;

const measures: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, notes: [{ string: 6, fret: 5 }] },
      { duration: 1, notes: [{ string: 5, fret: 7 }] },
      { duration: 2, notes: [] },
    ],
  },
];

function recordingContext() {
  const state: Record<string, unknown> = {};
  const log = { strokes: [] as string[], paints: 0 };
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop === "stroke") return () => { log.strokes.push(String(target.strokeStyle)); };
      if (prop === "clearRect") return () => { log.paints++; };
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop === "createLinearGradient") return () => ({ addColorStop: () => undefined });
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
  return { ctx, log };
}

type WorkerMessage = { type: string; [key: string]: unknown };

async function startWorker() {
  const { ctx, log } = recordingContext();
  let now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  let frame: FrameRequestCallback | null = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frame = cb; return 1; });
  vi.stubGlobal("cancelAnimationFrame", () => { frame = null; });

  vi.resetModules();
  await import("./TablatureViewer.worker");
  const send = (data: WorkerMessage) => (self as unknown as { onmessage: (e: { data: WorkerMessage }) => void }).onmessage({ data });

  const { result } = renderHook(() => useTablatureRenderData(measures));
  const { renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics } = result.current;

  const canvas = { width: 0, height: 0, getContext: () => ctx };
  send({ type: "INIT", canvas, dpr: 1, width: 800, height: 300 });
  send({ type: "DATA", renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics });

  const run = (ms: number) => {
    for (let t = 0; t < ms; t += FRAME_MS) {
      now += FRAME_MS;
      frame?.(now);
    }
  };
  return { send, run, log };
}

const target = { noteKeys: ["0-0-0"], beatStart: 0, beatEnd: 1 };

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TablatureViewer.worker — learn mode", () => {
  it("rings the note the lesson is waiting for", async () => {
    const { send, run, log } = await startWorker();
    send({ type: "LEARN", target, reducedMotion: false });
    run(500);
    expect(log.strokes).toContain(LEARN_COLOR);
  });

  it("draws nothing of it when there is no lesson", async () => {
    const { send, run, log } = await startWorker();
    send({ type: "LEARN", target: null, reducedMotion: false });
    run(500);
    expect(log.strokes).not.toContain(LEARN_COLOR);
  });

  it("lets go of the note when the lesson ends", async () => {
    const { send, run, log } = await startWorker();
    send({ type: "LEARN", target, reducedMotion: false });
    run(300);
    send({ type: "LEARN", target: null, reducedMotion: false });
    log.strokes.length = 0;
    run(300);
    expect(log.strokes).not.toContain(LEARN_COLOR);
  });

  it("keeps painting while the target breathes and glides", async () => {
    const { send, run, log } = await startWorker();
    send({ type: "LEARN", target, reducedMotion: false });
    send({ type: "SCROLL", scrollX: 0, cursorPos: 300, smooth: true });
    run(200);
    const before = log.paints;
    run(FRAME_MS * 10);
    expect(log.paints - before).toBe(10);
  });

  it("stands still, and stops painting, when the system asks for less motion", async () => {
    const { send, run, log } = await startWorker();
    send({ type: "LEARN", target, reducedMotion: true });
    send({ type: "SCROLL", scrollX: 0, cursorPos: 300, smooth: true });
    run(200);
    expect(log.strokes).toContain(LEARN_COLOR);
    const before = log.paints;
    run(FRAME_MS * 10);
    expect(log.paints).toBe(before);
  });
});
