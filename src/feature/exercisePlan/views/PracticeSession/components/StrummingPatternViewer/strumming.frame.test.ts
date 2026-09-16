import type { StrumBeat, StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { canvasContentWidth, fitSlotWidth } from "./strumming.canvas";
import { drawFrame } from "./strumming.frame";

const D = (o: Partial<StrumBeat> = {}): StrumBeat => ({ direction: "down", ...o });
const U = (o: Partial<StrumBeat> = {}): StrumBeat => ({ direction: "up", ...o });
const X: StrumBeat = { direction: "miss" };

/** The pattern from the bug report: "Strumming — Funk 16ths", pattern A. */
const funk: StrumPattern = {
  name: "Pattern A: Classic Funk",
  timeSignature: [4, 4],
  subdivisions: 4,
  strums: [
    D({ accented: true }), X, U({ muted: true }), X,
    D({ muted: true }), X, U({ accented: true }), X,
    D({ accented: true }), X, U({ muted: true }), D({ muted: true }),
    X, X, U({ accented: true }), X,
  ],
};

/** Records every x a draw call touches, so an off-canvas glyph is detectable. */
function recordingContext() {
  const xs: number[] = [];
  const texts: string[] = [];
  const track = (x: number) => { if (Number.isFinite(x)) xs.push(x); };
  const ctx = {
    save: () => {}, restore: () => {}, scale: () => {},
    beginPath: () => {}, stroke: () => {}, fill: () => {}, closePath: () => {},
    setLineDash: () => {},
    fillRect: () => {},
    moveTo: track, lineTo: track,
    arc: (x: number, _y: number, r: number) => { track(x - r); track(x + r); },
    roundRect: (x: number, _y: number, w: number) => { track(x); track(x + w); },
    fillText: (t: string, x: number) => { texts.push(t); track(x); },
    // Rough but stable stand-in: jsdom has no text metrics.
    measureText: (t: string) => ({ width: t.length * 7 }),
    font: "", fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "",
    lineJoin: "", textAlign: "", textBaseline: "", globalAlpha: 1,
    shadowColor: "", shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, xs, texts };
}

function renderAt(viewW: number, pattern: StrumPattern) {
  const slots   = pattern.timeSignature[0] * pattern.subdivisions;
  const width   = canvasContentWidth(viewW, slots);
  const { ctx, xs, texts } = recordingContext();
  drawFrame(
    ctx, 1, width, 160, pattern,
    -1, 0, new Map(), new Map(), 0, false, true,
    0, 10, fitSlotWidth(width, slots),
  );
  return { width, xs, texts };
}

describe("drawFrame stays inside the canvas", () => {
  it.each([320, 343, 360, 390, 412, 768])("paints every strum within %ipx", (viewW) => {
    const { width, xs } = renderAt(viewW, funk);
    expect(width).toBe(viewW);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(width);
  });

  it("labels all sixteen slots on a phone", () => {
    const { texts } = renderAt(360, funk);
    const counts = ["1", "e", "&", "a"].map(l => texts.filter(t => t === l).length);
    expect(counts).toEqual([1, 4, 4, 4]); // "2".."4" carry the other downbeats
    expect(texts).toContain("2");
    expect(texts).toContain("4");
  });

  it("keeps the pattern name clear of the rep counter", () => {
    const { texts } = renderAt(360, funk);
    expect(texts).toContain("Pattern A: Classic Funk");
    expect(texts).toContain("Rep 1 / 10");
  });

  it("shrinks a four-chord loop to fit a phone header", () => {
    const chordy: StrumPattern = { ...funk, name: undefined, chords: ["Cmaj7", "Am7", "Dm7", "G7"] };
    const { width, xs, texts } = renderAt(320, chordy);
    expect(Math.max(...xs)).toBeLessThanOrEqual(width);
    expect(texts).toContain("Cmaj7");
    expect(texts).toContain("G7");
  });

  it("collapses a progression too long to fit instead of overflowing", () => {
    const chordy: StrumPattern = {
      ...funk, name: undefined,
      chords: ["Cmaj7", "Am7", "Dm7", "G7", "Emin7", "Fmaj7", "Bm7b5", "E7alt"],
    };
    const { width, xs, texts } = renderAt(320, chordy);
    expect(Math.max(...xs)).toBeLessThanOrEqual(width);
    expect(texts).toContain("Cmaj7 · 1/8");
    expect(texts).not.toContain("E7alt");
  });
});
