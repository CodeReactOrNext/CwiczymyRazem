import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { drawChordHeader, drawCursor } from "./strumming.canvas";
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
  const arrowTop = PAD + HEADER_H;

  for (const [label, p] of [
    ["a single chord", pattern({ chord: "Em" })],
    ["a progression", pattern({ chords: ["Em", "C", "G", "D"] })],
  ] as const) {
    it(`keeps ${label} clear of the cursor and its PLAY label`, () => {
      const { ctx, boxes, texts } = recordingContext();
      drawChordHeader(ctx, 360, p, 0);
      drawCursor(ctx, PAD, arrowTop, true);

      const chordBottom = Math.max(...boxes.map((b) => b.y + b.h));
      const play = texts.find((t) => t.text.includes("PLAY"));
      expect(play).toBeDefined();
      // fillText draws on the baseline, so the label's glyphs start a font-size above it.
      expect(chordBottom).toBeLessThanOrEqual(play!.y - fontPx(play!.font));
      // The cursor line starts 2px above the arrows.
      expect(chordBottom).toBeLessThan(arrowTop - 2);
    });
  }
});
