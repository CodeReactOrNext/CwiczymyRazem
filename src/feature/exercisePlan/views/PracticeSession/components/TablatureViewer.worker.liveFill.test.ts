// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import type { FillStep } from "../utils/fillFeed";
import { useTablatureRenderData } from "./useTablatureRenderData";

// Plays a held note through the worker the way a session does — TICKs from an
// audio clock that moves in 10 ms callbacks, matching 50 ms behind it — and
// measures how far the green fill moves on each frame.

const FRAME_MS = 16;
const HIT_FILL = "#10b981";
const LATENCY_SEC = 0.05;
/** One beat a second, 200 px a beat: the fill should move 3.2 px a frame. */
const BPM = 60;

/** A half note to hold, then a rest. */
const held: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 2, notes: [{ string: 6, fret: 5 }] },
      { duration: 2, notes: [] },
    ],
  },
];

type WorkerMessage = { type: string; [key: string]: unknown };

async function startWorker() {
  const log = { hitFillW: -1, texts: [] as string[] };
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop === "fillRect") {
        return (_x: number, _y: number, w: number) => {
          if (target.fillStyle === HIT_FILL) log.hitFillW = Math.max(log.hitFillW, w);
        };
      }
      if (prop === "fillText") return (text: string) => { log.texts.push(text); };
      if (prop === "measureText") return (text: string) => ({ width: text.length * 7 });
      if (prop === "createLinearGradient") return () => ({ addColorStop: () => undefined });
      if (prop === "getTransform") return () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });

  let now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.spyOn(performance, "now").mockImplementation(() => now);
  let frame: FrameRequestCallback | null = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frame = cb; return 1; });
  vi.stubGlobal("cancelAnimationFrame", () => { frame = null; });
  vi.stubGlobal("postMessage", () => undefined);
  vi.stubGlobal("OffscreenCanvas", undefined);

  vi.resetModules();
  await import("./TablatureViewer.worker");
  const send = (data: WorkerMessage) => (self as unknown as { onmessage: (e: { data: WorkerMessage }) => void }).onmessage({ data });

  const { result } = renderHook(() => useTablatureRenderData(held));
  const { renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics } = result.current;
  send({ type: "INIT", canvas: { width: 0, height: 0, getContext: () => ctx }, dpr: 2, width: 800, height: 300 });
  send({ type: "DATA", renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics });
  const startMs = now;
  send({ type: "PLAYBACK", isPlaying: true, startWallMs: startMs, audioStartSec: 0, bpm: BPM, countInRemaining: 0 });

  /** currentTime as the main thread reads it: moved once per 10 ms callback. */
  const audioReading = () => Math.floor((now - startMs) / 10) / 100;

  /** Runs `ms` of frames, calling `beforeFrame` with the frame index first;
   *  returns how wide the hit fill was drawn on each frame (-1: not drawn). */
  const play = (ms: number, beforeFrame: (frameIndex: number, audioSec: number) => void) => {
    const widths: number[] = [];
    for (let i = 0; i * FRAME_MS < ms; i++) {
      now += FRAME_MS;
      if (i % 2 === 0) send({ type: "TICK", audioCurrentSec: audioReading(), pitch: null });
      beforeFrame(i, audioReading());
      log.hitFillW = -1;
      log.texts = [];
      frame?.(now);
      widths.push(log.hitFillW);
    }
    return widths;
  };
  return { send, play, log };
}

/** Matching's beat for an audio reading — it judges 50 ms behind the clock. */
const matchedBeat = (audioSec: number) => (audioSec - LATENCY_SEC) * (BPM / 60);
const HIT_AT_SEC = 0.1;

/** Per-frame growth over a stretch of the hold well under way (12–200 px). */
function growthWhileHolding(widths: number[]): number[] {
  const from = widths.findIndex((w) => w >= 12);
  const to = widths.findIndex((w) => w >= 200);
  return widths.slice(from + 1, to).map((w, i) => w - widths[from + i]);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TablatureViewer.worker — streamed fill", () => {
  it("shows the hit and its Early/Late label before React's copy of it arrives", async () => {
    const { send, play, log } = await startWorker();
    let sent = false;
    const widths = play(200, (_, audioSec) => {
      if (sent || audioSec < HIT_AT_SEC) return;
      sent = true;
      const hit: FillStep = { noteKey: "0-0-0", audioSec, beat: matchedBeat(audioSec), hit: true, timing: { grade: 2, hint: "late", offsetBeats: 0.05 } };
      send({ type: "FILL_STEPS", steps: [hit] });
    });
    expect(widths.some((w) => w >= 0)).toBe(true);
    expect(log.texts).toContain("Late");
  });

  it("grows by the same amount every frame while the note is held", async () => {
    const { send, play } = await startWorker();
    let lastSec = -1;
    const widths = play(1500, (_, audioSec) => {
      if (audioSec < HIT_AT_SEC || audioSec === lastSec) return;
      const step: FillStep = lastSec < 0
        ? { noteKey: "0-0-0", audioSec, beat: matchedBeat(audioSec), hit: true, timing: { grade: 3, hint: null, offsetBeats: 0 } }
        : { noteKey: "0-0-0", audioSec, beat: matchedBeat(audioSec) };
      lastSec = audioSec;
      send({ type: "FILL_STEPS", steps: [step] });
    });

    const growth = growthWhileHolding(widths);
    expect(growth.length).toBeGreaterThan(40);
    // 200 px a second over 16 ms frames, every frame.
    for (const g of growth) expect(g).toBeCloseTo(3.2, 0);
  });

  it("(before) grew in spurts and stalls when eased toward React's copy at 20 Hz", async () => {
    const { send, play } = await startWorker();
    const widths = play(1500, (i, audioSec) => {
      if (audioSec < HIT_AT_SEC || i % 3 !== 0) return;
      send({ type: "HIT_NOTES", hitNotes: { "0-0-0": matchedBeat(audioSec) } });
    });

    // A jump toward each new copy, then a slowdown until the next one.
    const growth = growthWhileHolding(widths);
    expect(Math.max(...growth)).toBeGreaterThan(4.5);
    expect(Math.max(...growth) / Math.min(...growth)).toBeGreaterThan(2.5);
  });

  it("takes streamed hits off the board on a reset", async () => {
    const { send, play } = await startWorker();
    let sent = false;
    const before = play(200, (_, audioSec) => {
      if (sent || audioSec < HIT_AT_SEC) return;
      sent = true;
      send({ type: "FILL_STEPS", steps: [{ noteKey: "0-0-0", audioSec, beat: matchedBeat(audioSec), hit: true }] });
    });
    expect(before.some((w) => w >= 0)).toBe(true);
    send({ type: "FILL_RESET" });
    const widths = play(50, () => undefined);
    expect(widths.every((w) => w === -1)).toBe(true);
  });
});
