import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { drawChordHeader } from "./strumming.canvas";
import { HEADER_H, PAD } from "./strumming.constants";

/** A 2D context that draws nothing and remembers where the boxes and the text went. */
const recordingContext = () => {
  const boxes: { y: number; h: number }[] = [];
  const texts: { text: string; y: number; font: string }[] = [];
  let font = "";
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === "roundRect") {
          return (_x: number, y: number, _w: number, h: number) => boxes.push({ y, h });
        }
        if (key === "fillText") {
          return (text: string, _x: number, y: number) => texts.push({ text, y, font });
        }
        if (key === "measureText") return (text: string) => ({ width: text.length * 10 });
        if (key === "font") return font;
        return () => {};
      },
      set: (_, key, value) => {
        if (key === "font") font = value;
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, boxes, texts };
};

const pattern = (overrides: Partial<StrumPattern>) =>
  ({ timeSignature: [4, 4], subdivisions: 2, name: "All Downs", ...overrides }) as StrumPattern;

const fontPx = (font: string) => Number(/(\d+)px/.exec(font)?.[1] ?? 0);

describe("strumming header", () => {
  const tileTop = PAD + HEADER_H;

  for (const [label, p] of [
    ["a single chord", pattern({ chord: "Em" })],
    ["a progression", pattern({ chords: ["Em", "C", "G", "D"] })],
  ] as const) {
    for (const width of [360, 900]) {
      it(`keeps ${label} clear of the tiles at ${width}px`, () => {
        const { ctx, boxes, texts } = recordingContext();
        drawChordHeader(ctx, width, p, 0);

        expect(boxes.length).toBeGreaterThan(0);
        expect(Math.max(...boxes.map((b) => b.y + b.h))).toBeLessThan(tileTop);
        expect(texts.some((t) => t.text === "Em")).toBe(true);
        for (const t of texts) expect(t.y + fontPx(t.font) / 2).toBeLessThan(tileTop);
      });
    }
  }

  it("names the pattern next to the chord", () => {
    const { ctx, texts } = recordingContext();
    drawChordHeader(ctx, 900, pattern({ chord: "Em" }), 0);
    expect(texts.some((t) => t.text === "All Downs")).toBe(true);
  });
});
