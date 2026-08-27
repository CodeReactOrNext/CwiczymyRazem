import { describe, expect, it } from "vitest";

import { mirroredX, mirrorStyle, uprightTransform } from "./useHandedness";

/** Applies an `uprightTransform()` string to a point, the way SVG would. */
function applyUpright(transform: string | undefined, point: number): number {
  if (!transform) return point;
  const match = /^translate\((-?[\d.]+) 0\) scale\(-1 1\)$/.exec(transform);
  if (!match) throw new Error(`unexpected transform: ${transform}`);
  return Number(match[1]) - point;
}

/** The outer mirror on the <svg> element: everything reflects about the centre. */
const applyMirror = (point: number, width: number) => width - point;

describe("handedness", () => {
  it("leaves diagrams alone for right-handed players", () => {
    expect(mirrorStyle(false)).toBeUndefined();
    expect(uprightTransform(40, false)).toBeUndefined();
    expect(mirroredX(40, 400, false)).toBe(40);
  });

  it("mirrors the fret axis about the diagram's centre", () => {
    expect(mirrorStyle(true)).toBe("scaleX(-1)");
    // The nut at the left edge ends up at the right edge, and back again.
    expect(mirroredX(0, 400, true)).toBe(400);
    expect(mirroredX(400, 400, true)).toBe(0);
    expect(mirroredX(120, 400, true)).toBe(280);
  });

  it("keeps counter-transformed text on its mirrored anchor", () => {
    const width = 400;
    const anchor = 40;
    const transform = uprightTransform(anchor, true);

    expect(applyMirror(applyUpright(transform, anchor), width)).toBe(
      mirroredX(anchor, width, true),
    );
  });

  it("keeps counter-transformed text reading forwards", () => {
    const width = 400;
    const anchor = 40;
    const transform = uprightTransform(anchor, true);

    // A glyph drawn 10px to the right of the anchor has to stay to its right:
    // the two flips cancel out into a pure translation.
    const drawn = applyMirror(applyUpright(transform, anchor + 10), width);
    expect(drawn).toBe(mirroredX(anchor, width, true) + 10);
  });
});
