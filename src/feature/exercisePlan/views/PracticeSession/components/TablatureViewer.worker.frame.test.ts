// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { DEFAULT_PILL_METRICS, pillHeadWidth } from "./tabSpacing";
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

/** A quarter, then a sextuplet run on the 11th fret — the run that piled up on a zoomed-out board. */
const fastRun: TablatureMeasure[] = [
  {
    timeSignature: [4, 4],
    beats: [
      { duration: 1, notes: [{ string: 3, fret: 9 }] },
      ...Array.from({ length: 6 }, () => ({ duration: 1 / 6, tuplet: 6, notes: [{ string: 3, fret: 11 }] })),
      { duration: 2, notes: [] },
    ],
  },
];
const isDynamicsBar = (fill: string) => fill.startsWith("rgba(6,182,212,");

/** What the fake context hands back for the winding's pattern. */
const WINDING_FILL = "winding-pattern";
/** The winding's one-period tile is a bitmap too, one device pixel tall. */
const isSprite = (bitmap: { height: number }) => bitmap.height > 1;

function recordingContext() {
  const state: Record<string, unknown> = {};
  const log = {
    drawn: [] as { image: unknown; x: number; y: number }[],
    blurs: [] as number[],
    strokes: [] as string[],
    texts: [] as string[],
    textXs: [] as { text: string; x: number }[],
    fills: [] as string[],
    patterns: [] as unknown[],
    dashes: [] as number[][],
    translates: [] as number[],
  };
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop === "drawImage") return (image: unknown, x: number, y: number) => { log.drawn.push({ image, x, y }); };
      if (prop === "stroke") return () => { log.strokes.push(String(target.strokeStyle)); };
      if (prop === "fillRect") return () => { log.fills.push(String(target.fillStyle)); };
      if (prop === "fillText") return (text: string, x: number) => { log.texts.push(text); log.textXs.push({ text, x }); };
      // Roughly a 13px font's advance, so long names come out long.
      if (prop === "measureText") return (text: string) => ({ width: text.length * 7 });
      if (prop === "createLinearGradient") return () => ({ addColorStop: () => undefined });
      if (prop === "createPattern") return (image: unknown) => { log.patterns.push(image); return WINDING_FILL; };
      if (prop === "translate") return (x: number) => { log.translates.push(x); };
      if (prop === "setLineDash") return (dash: number[]) => { log.dashes.push(dash); };
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
  // How long after its frame's timestamp the paint gets to run.
  let paintLag = 0;
  vi.spyOn(Date, "now").mockImplementation(() => now + paintLag);
  vi.spyOn(performance, "now").mockImplementation(() => now + paintLag);
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
  /** One frame stamped a frame after the last, painted `lagMs` after its stamp;
   *  returns where the board was scrolled to for it. */
  const frameAt = (lagMs: number) => {
    now += FRAME_MS;
    paintLag = lagMs;
    log.translates = [];
    frame?.(now);
    paintLag = 0;
    return log.translates[0];
  };
  return { send, run, frameAt, log, posted, now: () => now };
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

    const sprites = made.filter(isSprite);
    expect(sprites).toHaveLength(1);
    expect(log.drawn.length).toBeGreaterThan(3);
    expect(log.drawn.every(({ image }) => image === sprites[0])).toBe(true);
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

describe("TablatureViewer.worker — scrolling", () => {
  it("moves the board by the frame's timestamp, not by when the paint got to run", async () => {
    stubOffscreenCanvas();
    const { send, run, frameAt, now } = await startWorker(longPiece);
    send({ type: "PLAYBACK", isPlaying: true, startWallMs: now(), bpm: 120, countInRemaining: 0 });
    run(2000);

    // Evenly stamped frames whose paint runs now on time, now 8 ms late.
    const offsets = Array.from({ length: 12 }, (_, i) => frameAt(i % 2 === 0 ? 0 : 8));
    const steps = offsets.slice(1).map((x, i) => offsets[i] - x);
    expect(Math.min(...steps)).toBeGreaterThan(0);
    // Whole device pixels may round a step up or down, never more.
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThanOrEqual(1.01);
  });
});

describe("TablatureViewer.worker — standing board", () => {
  it("holds the board still while the cursor crosses a page, then turns to the next", async () => {
    stubOffscreenCanvas();
    const { send, frameAt, now } = await startWorker(longPiece);
    send({ type: "STYLE", pagedScroll: true });
    send({ type: "PLAYBACK", isPlaying: true, startWallMs: now(), bpm: 120, countInRemaining: 0 });

    // Ten seconds at 400 px/s: the cursor covers 4000 px of board.
    const offsets = Array.from({ length: 625 }, () => frameAt(0));
    const still = offsets.filter((x, i) => i > 0 && x === offsets[i - 1]).length;
    const stands = new Set(offsets.filter((x, i) => i > 0 && x === offsets[i - 1]));
    // Several pages were stood on, and the board stood for most of the time.
    expect(stands.size).toBeGreaterThan(2);
    expect(still / offsets.length).toBeGreaterThan(0.6);
    // The board only ever moves on.
    expect(offsets.every((x, i) => i === 0 || x <= offsets[i - 1])).toBe(true);
  });
});

describe("TablatureViewer.worker — page turn", () => {
  /** How many frames the first page turn takes at `bpm`. */
  const turnFrames = async (bpm: number) => {
    stubOffscreenCanvas();
    const { send, frameAt, now } = await startWorker(longPiece);
    send({ type: "STYLE", pagedScroll: true });
    send({ type: "PLAYBACK", isPlaying: true, startWallMs: now(), bpm, countInRemaining: 0 });
    const offsets = Array.from({ length: 1500 }, () => frameAt(0));
    const first = offsets.findIndex((x) => x !== offsets[0]);
    let last = first;
    while (offsets[last + 1] !== offsets[last]) last++;
    return last - first + 1;
  };

  it("takes two thirds of a beat, so a faster tempo turns the page sooner", async () => {
    // 120 bpm: 333 ms, about 21 frames of 16 ms.
    const moderate = await turnFrames(120);
    expect(moderate).toBeGreaterThanOrEqual(19);
    expect(moderate).toBeLessThanOrEqual(22);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    expect(await turnFrames(180)).toBeLessThan(moderate);
  });

  it("never drags on a slow piece nor snaps on a fast one", async () => {
    // 40 bpm would be a full second; it is held to 480 ms, 30 frames.
    expect(await turnFrames(40)).toBeLessThanOrEqual(31);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    // 300 bpm would be 133 ms; it is held to 180 ms, 11 frames — of which the
    // eased first and last move the board by less than a device pixel.
    expect(await turnFrames(300)).toBeGreaterThanOrEqual(7);
  });
});

describe("TablatureViewer.worker — string winding", () => {
  it("fills the winding from one cached tile instead of dashing it every frame", async () => {
    const made = stubOffscreenCanvas();
    const { run, log } = await startWorker(plain);
    run(120);

    expect(made.filter((bitmap) => !isSprite(bitmap))).toHaveLength(1);
    expect(log.patterns).toHaveLength(1);
    expect(log.fills).toContain(WINDING_FILL);
    expect(log.dashes.some((dash) => dash.length > 0 && dash[0] < 2)).toBe(false);
  });

  it("dashes the winding where the worker can't make bitmaps", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const { run, log } = await startWorker(plain);
    run(60);

    expect(log.patterns).toHaveLength(0);
    expect(log.dashes.some((dash) => dash.length > 0 && dash[0] < 2)).toBe(true);
  });
});

describe("TablatureViewer.worker — chord names", () => {
  it("paints each name once, then only blits it — no blur, no typesetting per frame", async () => {
    const made = stubOffscreenCanvas();
    const { send, run, log } = await startWorker(chords);
    run(FRAME_MS);
    send({ type: "SCROLL", scrollX: 0, cursorPos: 0 });
    run(FRAME_MS);

    const sprites = made.filter(isSprite);
    expect(sprites.map((sprite) => sprite.texts)).toEqual([["Am"], ["C"]]);
    // Two frames × three named beats, every one a blit of a cached tag.
    expect(log.drawn).toHaveLength(6);
    expect(log.drawn.every(({ image }) => image === sprites[0] || image === sprites[1])).toBe(true);
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

describe("TablatureViewer.worker — fast runs", () => {
  it("spreads a run out on a zoomed-out board, so its fret numbers don't run into each other", async () => {
    // 0.45 of an 800 px board's 200 px beat leaves a sixteenth-sextuplet 15 px — half a pill.
    const { run, log } = await startWorker(fastRun, 0.45);
    run(FRAME_MS);

    const xs = log.textXs.filter(({ text }) => text === "11").map(({ x }) => x);
    expect(xs).toHaveLength(6);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(pillHeadWidth(2, DEFAULT_PILL_METRICS) + 4);
    }
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
    // The counting under the staff is digits too — off, so a "4" is the signature's.
    send({ type: "STYLE", showCounting: false });
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

  it("leaves the time signature out when the bar opens on a note under its digits", async () => {
    // The ear-training riddle a player reported: a "4" peeking out under the G
    // string's "6" read as a double stop.
    const riddle: TablatureMeasure[] = [{
      timeSignature: [4, 4],
      beats: [[3, 6], [2, 7], [2, 9], [1, 10]].map(([string, fret]) => ({ duration: 1, notes: [{ string, fret }] })),
    }];
    const { send, run, log } = await startWorker(riddle);
    send({ type: "STYLE", showCounting: false });
    run(FRAME_MS);
    expect(log.texts).toEqual(expect.arrayContaining(["6", "7", "9", "10"]));
    expect(log.texts).not.toContain("4");
  });

  it("counts the beats under the staff, and stops when counting is switched off", async () => {
    const eighths: TablatureMeasure[] = [{
      timeSignature: [2, 4],
      beats: [7, 7, 7, 7].map((fret) => ({ duration: 0.5, notes: [{ string: 3, fret }] })),
    }];
    const { send, run, log } = await startWorker(eighths);
    run(FRAME_MS);
    expect(log.texts.filter((text) => text === "&")).toHaveLength(2);
    expect(log.texts).toEqual(expect.arrayContaining(["1", "2"]));

    log.texts.length = 0;
    send({ type: "STYLE", showCounting: false });
    run(FRAME_MS);
    expect(log.texts).not.toContain("&");
  });
});
