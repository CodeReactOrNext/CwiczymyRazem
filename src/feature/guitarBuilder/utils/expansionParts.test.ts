import { join } from "node:path";

import { GUITAR_PARTS } from "feature/guitarBuilder/data/guitarParts";
import { layoutGuitar } from "feature/guitarBuilder/utils/layout";
import { paintBody } from "feature/guitarBuilder/utils/paint";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const keys = [
  "junior-honey",
  "osprey-tobacco",
  "aurelis-walnut",
  "aurelis-pearl",
  "jazzcaster-coral",
];
const bodies = GUITAR_PARTS.bodies.filter((body) => keys.includes(body.key));
const read = (src: string) =>
  sharp(join(process.cwd(), "public", src))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

describe("extracted Arsenal builder parts", () => {
  it("assembles every new body with every neck and head without gaps at the nut", () => {
    expect(bodies).toHaveLength(5);
    for (const body of bodies) {
      for (const neck of GUITAR_PARTS.necks) {
        for (const head of GUITAR_PARTS.heads) {
          const layout = layoutGuitar(body, neck, head);
          const [, , neckStep, headStep] = layout.steps;
          expect(
            headStep.dest.x + head.nutX * (neck.nutWidth / head.nutWidth),
          ).toBeCloseTo(neckStep.dest.x + neck.nutX - neck.jointX);
          for (const step of layout.steps) {
            expect(step.dest.w).toBeGreaterThan(0);
            expect(step.dest.h).toBeGreaterThan(0);
            expect(Number.isFinite(step.dest.x)).toBe(true);
          }
        }
      }
    }
  });

  it("ships matching body masks that recolour paint and covers while preserving alpha", async () => {
    for (const body of bodies) {
      const [base, maps, surface] = await Promise.all([
        read(body.src),
        read(body.maps),
        read(body.surface),
      ]);
      for (const asset of [base, maps, surface]) {
        expect([asset.info.width, asset.info.height], body.key).toEqual([
          body.width,
          body.height,
        ]);
      }
      const pixels = paintBody(
        new Uint8ClampedArray(base.data),
        new Uint8ClampedArray(maps.data),
        {
          width: body.width,
          finish: "#1e8d6e",
          top: null,
          burst: false,
          pickguard: "#171719",
          pickups: { color: "#be3448", metal: false },
          surface: new Uint8ClampedArray(surface.data),
          singleCoils: body.singleCoils,
          finishL: body.finishL,
          pickguardL: body.pickguardL,
          pickupTone: body.pickupTone,
        },
      );
      let painted = 0,
        covers = 0,
        alphaChanges = 0,
        colourChanges = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== base.data[i + 3]) alphaChanges++;
        if (
          pixels[i] !== base.data[i] ||
          pixels[i + 1] !== base.data[i + 1] ||
          pixels[i + 2] !== base.data[i + 2]
        )
          colourChanges++;
        if (maps.data[i] > 128) painted++;
        if (surface.data[i + 1] > 128) covers++;
      }
      expect(alphaChanges, body.key).toBe(0);
      expect(colourChanges, body.key).toBeGreaterThan(3000);
      expect(painted, body.key).toBeGreaterThan(body.width * body.height * 0.1);
      expect(covers, body.key).toBeGreaterThan(3000);
    }
  });

  it("keeps bridges, knobs and tortoise out of the paintable pickup covers", async () => {
    const probes: Record<string, [number, number][]> = {
      "junior-honey": [[230, 240]],
      "osprey-tobacco": [
        [187, 240],
        [252, 240],
        [400, 380],
      ],
      "aurelis-walnut": [
        [257, 260],
        [325, 260],
        [122, 396],
      ],
      "aurelis-pearl": [
        [220, 260],
        [290, 260],
        [105, 390],
      ],
      "jazzcaster-coral": [
        [130, 280],
        [290, 280],
        [208, 440],
      ],
    };
    for (const body of bodies) {
      const { data } = await read(body.surface);
      for (const [x, y] of probes[body.key]) {
        expect(
          data[(y * body.width + x) * 4 + 1],
          `${body.key} hardware ${x},${y}`,
        ).toBe(0);
      }
    }
  });
});
