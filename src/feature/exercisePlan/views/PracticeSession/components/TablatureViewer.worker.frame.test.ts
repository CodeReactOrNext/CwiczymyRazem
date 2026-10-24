// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { useTablatureRenderData } from "./useTablatureRenderData";

// Drives the worker through its message handler with a context that only records
// what was asked of it — enough to know what each frame still has to do: a fresh
// hit's glow and a chord's name come from cached bitmaps instead of being blurred
// and typeset every frame, and the parts of the board that look things up along
// the song (rests, time signatures, tuplets) find the same things a
// scan of the whole song did.

const FRAME_MS = 16;
/** The worker's pick-mark stroke colour on the default (white-ink) board. */
const PICK_COLOR = "rgba(255,255,255,0.65)";

const plain: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, notes: [{ string: 6, fret: 5 }] },
      { duration: 1, notes: [{ string: 5, fret: 7 }] },
      { duration: 2, notes: [] },
    ],
  },
];

const chords: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, chordName: "Am", notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }] },
      { duration: 1, chordName: "C", notes: [{ string: 5, fret: 3 }, { string: 4, fret: 2 }] },
      { duration: 2, chordName: "Am", notes: [{ string: 5, fret: 0 }, { string: 4, fret: 2 }] },
    ],
  },
];

/** A long name on an eighth, then three more eighths, each with a pick mark. */
const strum = (chordName?: string): TablatureMeasure[] => [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 0.5, chordName, pickStroke: "down", notes: [{ string: 4, fret: 4 }] },
      { duration: 0.5, pickStroke: "up", notes: [{ string: 4, fret: 4 }] },
      { duration: 0.5, pickStroke: "down", notes: [{ string: 4, fret: 4 }] },
      { duration: 0.5, pickStroke: "up", notes: [{ string: 4, fret: 4 }] },
      { duration: 2, notes: [] },
    ],
  },
];

/** 20 bars of 4/4, then 20 bars of 7/8 opening on a quintuplet, played with dynamics. */
const quarter = { duration: 1, notes: [{ string: 1, fret: 0 }] };
const longPiece: TablatureMeasure[] = [
  ...Array.from({ length: 20 }, () => ({ timeSignature: [4, 4] as [number, number], beats: [quarter, quarter, quarter, quarter] })),
  ...Array.from({ length: 20 }, () => ({
    timeSignature: [7, 8] as [number, number],
    beats: [
      ...Array.from({ length: 5 }, () => ({ duration: 0.4, tuplet: 5, notes: [{ string: 1, fret: 0, dynamics: 0.5 }] })),
      { duration: 1.5, notes: [{ string: 1, fret: 0, dynamics: 0.5 }] },
    ],
  })),
];
/** Where the 7/8 half starts on the board: 80 beats × 200 px. */
const SECOND_HALF_X = 80 * 200;
const isDynamicsBar = (fill: string) => fill.startsWith("rgba(6,182,212,");

function recordingContext() {
  const state: Record<string, unknown> = {};
  const log = {
    drawn: [] as { image: unknown; x: number; y: number }[],
    blurs: [] as number[],
    strokes: [] as string[],
    texts: [] as string[],
    fills: [] as string[],
  };
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop === "drawImage") return (image: unknown, x: number, y: number) => { log.drawn.push({ image, x, y }); };
      if (prop === "stroke") return () => { log.strokes.push(String(target.strokeStyle)); };
      if (prop === "fillRect") return () => { log.fills.push(String(target.fillStyle)); };
      if (prop === "fillText") return (text: string) => { log.texts.push(text); };
      // Roughly a 13px font's advance, so long names come out long.
      if (prop === "measureText") return (text: string) => ({ width: text.length * 7 });
      if (prop === "createLinearGradient") return () => ({ addColorStop: () => undefined });
      // A board scrolled to a fractional device pixel.
      if (prop === "getTransform") return () => ({ a: 2, b: 0, c: 0, d: 2, e: 10.3, f: 0.6 });
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop: string, value) {
      if (prop === "shadowBlur") log.blurs.push(Number(value));
      target[prop] = value;
      return true;
    },
  });
  return { ctx, log };
}

/** Stands in for the worker's own OffscreenCanvas, keeping each bitmap made and
 *  what was painted into it. */
function stubOffscreenCanvas() {
  const made: { width: number; height: number; texts: string[] }[] = [];
  class FakeOffscreenCanvas {
    width: number;
    height: number;
    texts: string[] = [];
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      made.push(this);
    }
    getContext() {
      const { ctx, log } = recordingContext();
      this.texts = log.texts;
      return ctx;
    }
  }
  vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
  return made;
}

type WorkerMessage = { type: string; [key: string]: unknown };

async function startWorker(measures: TablatureMeasure[], zoom = 1) {
  const { ctx, log } = recordingContext();
  let now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  let frame: FrameRequestCallback | null = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { frame = cb; return 1; });
  vi.stubGlobal("cancelAnimationFrame", () => { frame = null; });
  const posted: WorkerMessage[] = [];
  vi.stubGlobal("postMessage", (message: WorkerMessage) => { posted.push(message); });

  vi.resetModules();
  await import("./TablatureViewer.worker");
  const send = (data: WorkerMessage) => (self as unknown as { onmessage: (e: { data: WorkerMessage }) => void }).onmessage({ data });

  const { result } = renderHook(() => useTablatureRenderData(measures));
  const { renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics } = result.current;

  const canvas = { width: 0, height: 0, getContext: () => ctx };
  send({ type: "INIT", canvas, dpr: 2, width: 800, height: 300 });
  send({ type: "DATA", renderBeats, measureEndXs, totalBeats, timeSigMarkers, tupletGroups, tempoMap, hasAccentedNotes, hasDynamics });
  send({ type: "ZOOM", zoom });

  const run = (ms: number) => {
    for (let t = 0; t < ms; t += FRAME_MS) {
      now += FRAME_MS;
      frame?.(now);
    }
  };
  return { send, run, log, posted, now: () => now };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TablatureViewer.worker — hit glow", () => {
  it("draws a fresh hit's glow from one cached bitmap, never blurring the board", async () => {
    const made = stubOffscreenCanvas();
    const { send, run, log } = await startWorker(plain);
    send({ type: "HIT_NOTES", hitNotes: { "0-0-0": true } });
    run(120);

    expect(made).toHaveLength(1);
    expect(log.drawn.length).toBeGreaterThan(3);
    expect(log.drawn.every(({ image }) => image === made[0])).toBe(true);
    expect(log.blurs.every((blur) => blur === 0)).toBe(true);
  });

  it("stops drawing the glow once it has faded", async () => {
    stubOffscreenCanvas();
    const { send, run, log } = await startWorker(plain);
    send({ type: "HIT_NOTES", hitNotes: { "0-0-0": true } });
    run(200);
    const drawn = log.drawn.length;
    run(200);
    expect(log.drawn.length).toBe(drawn);
  });

  it("falls back to the canvas shadow where the worker can't make bitmaps", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const { send, run, log } = await startWorker(plain);
    send({ type: "HIT_NOTES", hitNotes: { "0-0-0": true } });
    run(60);

    expect(log.drawn).toHaveLength(0);
    expect(log.blurs.some((blur) => blur > 0)).toBe(true);
  });
});

describe("TablatureViewer.worker — chord names", () => {
  it("paints each name once, then only blits it — no blur, no typesetting per frame", async () => {
    const made = stubOffscreenCanvas();
    const { send, run, log } = await startWorker(chords);
    run(FRAME_MS);
    send({ type: "SCROLL", scrollX: 0, cursorPos: 0 });
    run(FRAME_MS);

    expect(made.map((sprite) => sprite.texts)).toEqual([["Am"], ["C"]]);
    // Two frames × three named beats, every one a blit of a cached tag.
    expect(log.drawn).toHaveLength(6);
    expect(log.drawn.every(({ image }) => image === made[0] || image === made[1])).toBe(true);
    expect(log.texts).not.toContain("Am");
    expect(log.blurs.every((blur) => blur === 0)).toBe(true);
  });

  it("lands each tag on whole device pixels, so its text stays sharp while scrolling", async () => {
    stubOffscreenCanvas();
    const { run, log } = await startWorker(chords);
    run(FRAME_MS);

    expect(log.drawn.length).toBeGreaterThan(0);
    for (const { x, y } of log.drawn) {
      expect(Number.isInteger(x)).toBe(true);
      expect(Number.isInteger(y)).toBe(true);
    }
  });

  it("paints the tag straight on the board where the worker can't make bitmaps", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const { run, log } = await startWorker(chords);
    run(FRAME_MS);

    expect(log.texts.filter((text) => text === "Am")).toHaveLength(2);
    expect(log.texts).toContain("C");
  });

  it("lets a long name cover the next beat's pick mark instead of drawing it through the text", async () => {
    const named = await startWorker(strum("F#m7b5"), 0.45);
    named.run(FRAME_MS);
    expect(named.log.strokes.filter((style) => style === PICK_COLOR)).toHaveLength(3);

    const unnamed = await startWorker(strum(), 0.45);
    unnamed.run(FRAME_MS);
    expect(unnamed.log.strokes.filter((style) => style === PICK_COLOR)).toHaveLength(4);
  });
});

describe("TablatureViewer.worker — looking things up along the song", () => {
  it("tells the main thread when the cursor enters a rest and when it leaves", async () => {
    const { send, run, posted, now } = await startWorker(plain);
    // 60 BPM: one beat a second. Notes on beats 0 and 1, a half rest from beat 2.
    send({ type: "PLAYBACK", isPlaying: true, startWallMs: now(), bpm: 60, countInRemaining: 0 });
    const restStates = () => posted.filter((m) => m.type === "REST_ACTIVE").map((m) => m.isRest);

    run(1500);
    expect(restStates()).toEqual([]);
    run(1000);
    expect(restStates()).toEqual([true]);
    // Past beat 4 the loop starts over on a note.
    run(1700);
    expect(restStates()).toEqual([true, false]);
  });

  it("draws the time signature and tuplet in view, nothing from far away, and no dynamics bars", async () => {
    const { send, run, log } = await startWorker(longPiece);
    run(FRAME_MS);
    expect(log.texts).toContain("4");
    expect(log.texts).not.toContain("7");
    expect(log.texts).not.toContain("5");
    expect(log.fills.filter(isDynamicsBar)).toHaveLength(0);

    log.texts.length = 0;
    log.fills.length = 0;
    send({ type: "SCROLL", scrollX: SECOND_HALF_X - 100, cursorPos: SECOND_HALF_X - 100 });
    run(FRAME_MS);
    expect(log.texts).toEqual(expect.arrayContaining(["7", "8", "5"]));
    expect(log.texts).not.toContain("4");
    expect(log.fills.filter(isDynamicsBar)).toHaveLength(0);
  });
});
