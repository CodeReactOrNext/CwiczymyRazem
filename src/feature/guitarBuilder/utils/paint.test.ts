import { describe, expect, it } from "vitest";

import {
  hexToHsl,
  hslToRgb,
  paintBody,
  type PaintOptions,
  remapLightness,
  rgbToHsl,
  shadeCover,
  shadeFinish,
} from "./paint";

const options = (patch: Partial<PaintOptions> = {}): PaintOptions => ({
  width: 1,
  finish: null,
  top: null,
  burst: false,
  pickguard: null,
  finishL: 0.5,
  pickguardL: 0.9,
  ...patch,
});

/** One pixel: [r, g, b, a] + maps [finish, edgeDistance, pickguard, 255]. */
const pixel = (
  rgb: [number, number, number],
  maps: [number, number, number],
) => ({
  pixels: new Uint8ClampedArray([...rgb, 255]),
  maps: new Uint8ClampedArray([...maps, 255]),
});

describe("colour conversions", () => {
  it("round-trips rgb through hsl", () => {
    const [h, s, l] = rgbToHsl(200, 60, 30);
    const [r, g, b] = hslToRgb(h, s, l);
    expect([Math.round(r), Math.round(g), Math.round(b)]).toEqual([
      200, 60, 30,
    ]);
  });

  it("parses hex", () => {
    expect(hexToHsl("#ff0000")).toEqual([0, 1, 0.5]);
  });
});

describe("remapLightness", () => {
  it("moves the source average onto the target and keeps the ends", () => {
    expect(remapLightness(0.4, 0.4, 0.1)).toBeCloseTo(0.1);
    expect(remapLightness(0, 0.4, 0.1)).toBe(0);
    expect(remapLightness(1, 0.4, 0.1)).toBe(1);
  });
});

describe("paintBody", () => {
  it("leaves pixels outside the masks alone", () => {
    const { pixels, maps } = pixel([10, 200, 30], [0, 40, 0]);
    paintBody(
      pixels,
      maps,
      options({ finish: "#0000ff", pickguard: "#ff0000" }),
    );
    expect([...pixels]).toEqual([10, 200, 30, 255]);
  });

  it("repaints finish pixels in the target hue", () => {
    const { pixels, maps } = pixel([200, 40, 40], [255, 200, 0]);
    paintBody(
      pixels,
      maps,
      options({ finish: "#2a4f94", finishL: rgbToHsl(200, 40, 40)[2] }),
    );
    const [h] = rgbToHsl(pixels[0], pixels[1], pixels[2]);
    expect(h * 360).toBeCloseTo(hexToHsl("#2a4f94")[0] * 360, 0);
  });

  it("darkens finish near the outline when bursting", () => {
    const run = (edgeDistance: number) => {
      const { pixels, maps } = pixel([200, 120, 40], [255, edgeDistance, 0]);
      paintBody(pixels, maps, options({ burst: true }));
      return pixels[0];
    };
    expect(run(0)).toBeLessThan(run(200));
    expect(run(200)).toBe(200);
  });

  it("repaints the pickguard and only when the body has one", () => {
    const { pixels, maps } = pixel([240, 240, 240], [0, 50, 255]);
    paintBody(
      pixels,
      maps,
      options({ pickguard: "#18181a", pickguardL: 0.94 }),
    );
    expect(pixels[0]).toBeLessThan(40);

    const untouched = pixel([240, 240, 240], [0, 50, 255]);
    paintBody(
      untouched.pixels,
      untouched.maps,
      options({ pickguard: "#18181a", pickguardL: null }),
    );
    expect(untouched.pixels[0]).toBe(240);
  });

  it("adds figure from the top texture", () => {
    const run = (tileValue: number) => {
      const { pixels, maps } = pixel([120, 80, 40], [255, 200, 0]);
      const top = {
        pixels: new Uint8ClampedArray([tileValue, tileValue, tileValue, 255]),
        size: 1,
      };
      paintBody(pixels, maps, options({ finish: "#c8781e", top }));
      return rgbToHsl(pixels[0], pixels[1], pixels[2])[2];
    };
    expect(run(255)).toBeGreaterThan(run(0));
  });
});

describe("shadeCover", () => {
  const tone = { lo: 0.2, mid: 0.6, hi: 0.8 };
  const black = hexToHsl("#18181a");

  it("keeps a plastic cover's colour across a chrome source's reflections", () => {
    const dull = shadeCover(0.3, 0, tone, black, false);
    const mirror = shadeCover(0.78, 0, tone, black, false);
    expect(Math.abs(mirror[0] - dull[0])).toBeLessThan(25);
  });

  it("turns pole pieces on plastic silver", () => {
    const pole = shadeCover(0.7, 0.25, tone, black, false);
    expect(pole[0]).toBeGreaterThan(150);
  });

  it("lets metal follow the source's full shading", () => {
    const gold = hexToHsl("#c9a24a");
    const low = shadeCover(0.25, 0, tone, gold, true);
    const high = shadeCover(0.75, 0, tone, gold, true);
    expect(high[0]).toBeGreaterThan(low[0] + 40);
  });
});

describe("shadeFinish styles", () => {
  const blue = hexToHsl("#2a4f94");
  const at = (
    style: Parameters<typeof shadeFinish>[4],
    l: number,
    x = 10,
    y = 10,
  ) =>
    rgbToHsl(
      ...shadeFinish(
        l,
        { x, y, dist: 200, edge: 0, figure: 0 },
        blue,
        null,
        style,
        0.5,
        [0, 0, 0],
      ),
    );

  it("satin flattens the glare that gloss keeps", () => {
    expect(at("satin", 0.9)[2]).toBeLessThan(at("gloss", 0.9)[2] - 0.1);
  });

  it("sparkle throws some bright flakes, gloss none", () => {
    const flakes = (style: "sparkle" | "gloss") =>
      Array.from({ length: 400 }, (_, i) => at(style, 0.5, i * 2, 7)[2]).filter(
        (l) => l > 0.6,
      ).length;
    expect(flakes("sparkle")).toBeGreaterThan(3);
    expect(flakes("gloss")).toBe(0);
  });

  it("chameleon shifts hue toward the rim", () => {
    const rim = rgbToHsl(
      ...shadeFinish(
        0.5,
        { x: 0, y: 0, dist: 0, edge: 0, figure: 0 },
        blue,
        null,
        "chameleon",
        0.5,
        [0, 0, 0],
      ),
    );
    const middle = at("chameleon", 0.5);
    expect(Math.abs(rim[0] - middle[0])).toBeGreaterThan(0.1);
  });

  it("blends a multi-tone burst into its middle colour near the edge", () => {
    const amber = hexToHsl("#e8b13a");
    const red = hexToHsl("#a0201a");
    const nearEdge = rgbToHsl(
      ...shadeFinish(
        0.5,
        { x: 0, y: 0, dist: 20, edge: 0, figure: 0 },
        amber,
        red,
        "gloss",
        0.5,
        [0, 0, 0],
      ),
    );
    expect(Math.abs(nearEdge[0] - red[0])).toBeLessThan(
      Math.abs(nearEdge[0] - amber[0]),
    );
  });
});
