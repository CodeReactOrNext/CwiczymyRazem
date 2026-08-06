import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PART_DEFINITIONS, PART_TIER_COLORS, PART_TIERS, PARTS_BY_ID } from "./partDefinitions";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

describe("part definitions", () => {
  it("has a unique id per part", () => {
    const ids = PART_DEFINITIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PARTS_BY_ID.size).toBe(PART_DEFINITIONS.length);
  });

  it("ships the artwork every declared icon points at", () => {
    const broken = PART_DEFINITIONS.filter(
      (p) => p.icon && !existsSync(path.join(PUBLIC_DIR, p.icon))
    );
    expect(broken.map((p) => `${p.id} -> ${p.icon}`)).toEqual([]);
  });

  it("serves icons as WebP from the parts folder", () => {
    for (const p of PART_DEFINITIONS) {
      if (!p.icon) continue;
      expect(p.icon).toBe(`/images/parts/${p.id}.webp`);
    }
  });

  it("colours every tier a part can reach", () => {
    for (const tier of PART_TIERS) {
      expect(PART_TIER_COLORS[tier]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("only marks showpiece parts as Unique-capable", () => {
    const unique = PART_DEFINITIONS.filter((p) => p.unique).map((p) => p.id);
    expect(unique).toEqual(["body", "bridge", "pickup", "enclosure"]);
  });
});
