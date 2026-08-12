import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { EFFECT_FEATURES } from "./effectStats";
import { GUITAR_FEATURES } from "./itemStats";
import { getModArt, MOD_ART_IDS } from "./modArt";

const KNOWN_MOD_IDS = new Set([
  ...GUITAR_FEATURES.map((f) => f.id),
  ...EFFECT_FEATURES.map((f) => f.id),
]);

describe("modArt", () => {
  it("only names mods that exist", () => {
    for (const id of MOD_ART_IDS) expect(KNOWN_MOD_IDS).toContain(id);
  });

  it("has a plate on disk for every id it claims", () => {
    for (const id of MOD_ART_IDS) {
      const file = join(process.cwd(), "public", "images", "mods", `${id}.webp`);
      expect(existsSync(file), `missing art for ${id}`).toBe(true);
    }
  });

  it("returns null for a mod that has no art yet", () => {
    expect(getModArt("definitely-not-a-mod")).toBeNull();
  });
});
