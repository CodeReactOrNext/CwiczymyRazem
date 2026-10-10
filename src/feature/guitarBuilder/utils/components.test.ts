import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  COMPONENT_DEFS,
  COMPONENT_LEVELS,
  finishIconSrc,
  pickupIconSrc,
} from "../data/components";
import { GUITAR_PARTS, STICKERS } from "../data/guitarParts";
import type {
  ComponentSlot,
  Loadout,
  OwnedComponent,
} from "../types/guitarBuilder.types";
import {
  buildLevel,
  createDemoStash,
  fitProblem,
  levelRange,
  RARITY_ORDER,
  rarityForLevel,
  rollDrop,
  rollLevel,
  seededRandom,
  toGuitarBuild,
} from "./components";

const count = (slot: ComponentSlot) =>
  COMPONENT_DEFS.filter((def) => def.slot === slot).length;

describe("component catalog", () => {
  it("has the 104 items, per slot", () => {
    expect(COMPONENT_DEFS).toHaveLength(104);
    expect([
      count("body"),
      count("pickups"),
      count("neck"),
      count("head"),
      count("finish"),
      count("pickguard"),
      count("sticker"),
    ]).toEqual([13, 14, 8, 7, 49, 5, 8]);
  });

  it("has unique ids and a level range for every item", () => {
    expect(new Set(COMPONENT_DEFS.map((def) => def.id)).size).toBe(
      COMPONENT_DEFS.length,
    );
    for (const def of COMPONENT_DEFS) {
      expect(COMPONENT_LEVELS[def.slot][def.rarity], def.id).toBeDefined();
    }
  });

  it("points every part at art that exists", () => {
    const keys = {
      body: new Set(GUITAR_PARTS.bodies.map((part) => part.key)),
      neck: new Set(GUITAR_PARTS.necks.map((part) => part.key)),
      head: new Set(GUITAR_PARTS.heads.map((part) => part.key)),
      top: new Set(GUITAR_PARTS.tops.map((part) => part.key)),
      sticker: new Set(STICKERS.map((art) => art.key)),
    };
    for (const def of COMPONENT_DEFS) {
      if (def.slot === "body" || def.slot === "neck" || def.slot === "head") {
        expect(keys[def.slot].has(def.partKey), def.id).toBe(true);
      }
      if (def.slot === "finish" && def.top) {
        expect(keys.top.has(def.top), def.id).toBe(true);
      }
      if (def.slot === "sticker") {
        expect(keys.sticker.has(def.stickerKey), def.id).toBe(true);
      }
    }
  });

  it("has a stash icon for every pickup set and finish", () => {
    for (const def of COMPONENT_DEFS) {
      if (def.slot === "pickups") {
        expect(existsSync(`public${pickupIconSrc(def.id)}`), def.id).toBe(true);
      }
      if (def.slot === "finish") {
        expect(existsSync(`public${finishIconSrc(def.id)}`), def.id).toBe(true);
      }
    }
  });

  it("offers every routing pickups at Epic or better", () => {
    for (const type of ["S", "H", "P90"] as const) {
      const best = COMPONENT_DEFS.filter(
        (def) => def.slot === "pickups" && def.type === type,
      ).map((def) => RARITY_ORDER.indexOf(def.rarity));
      expect(Math.max(...best), type).toBeGreaterThanOrEqual(
        RARITY_ORDER.indexOf("Epic"),
      );
    }
  });

  it("sums a full set to about a case guitar of the same rarity", () => {
    const caseAverage = { Common: 14, Epic: 34, Mythic: 63 } as const;
    for (const [rarity, target] of Object.entries(caseAverage)) {
      const mid = (["body", "pickups", "neck", "finish", "head"] as const)
        .map((slot) => {
          const [min, max] = COMPONENT_LEVELS[slot][rarity as "Epic"]!;
          return (min + max) / 2;
        })
        .reduce((sum, value) => sum + value, 0);
      expect(Math.abs(mid - target), rarity).toBeLessThanOrEqual(3);
    }
  });
});

describe("rolling", () => {
  it("rolls levels inside the item's range", () => {
    const random = seededRandom(1);
    for (const def of COMPONENT_DEFS) {
      const [min, max] = levelRange(def);
      for (let i = 0; i < 20; i++) {
        const level = rollLevel(def, random);
        expect(level).toBeGreaterThanOrEqual(min);
        expect(level).toBeLessThanOrEqual(max);
      }
    }
  });

  it("drops mostly low rarities", () => {
    const random = seededRandom(2);
    const drops = Array.from({ length: 2000 }, () => rollDrop(random).rarity);
    const share = (rarity: string) =>
      drops.filter((r) => r === rarity).length / drops.length;
    expect(share("Common")).toBeGreaterThan(0.3);
    expect(share("Mythic")).toBeLessThan(0.02);
  });

  it("builds the same demo stash every time", () => {
    expect(createDemoStash()).toEqual(createDemoStash());
    expect(createDemoStash()).toHaveLength(COMPONENT_DEFS.length + 40);
  });
});

describe("building", () => {
  const stash: OwnedComponent[] = [
    { uid: "b", defId: "body:t-style", level: 7 },
    { uid: "b2", defId: "body:single-cut", level: 4 },
    { uid: "n", defId: "neck:maple-dots", level: 3 },
    { uid: "h", defId: "head:six-inline", level: 2 },
    { uid: "p", defId: "pickups:vintage-singles", level: 5 },
    { uid: "f", defId: "finish:purple-flame", level: 8 },
    { uid: "g", defId: "pickguard:mint", level: 2 },
    { uid: "s1", defId: "sticker:shred", level: 3 },
    { uid: "s2", defId: "sticker:star", level: 1 },
    { uid: "s3", defId: "sticker:skull", level: 2 },
    { uid: "s4", defId: "sticker:flame", level: 3 },
  ];
  const loadout: Loadout = {
    body: "b",
    neck: "n",
    head: "h",
    pickups: "p",
    finish: "f",
    pickguard: "g",
  };
  const placed = ["s1", "s2", "s3", "s4"].map((id) => ({
    id,
    key: "star",
    x: 0,
    y: 0,
    size: 90,
    rotation: 0,
  }));

  it("sums every part and the best three stickers", () => {
    const summary = buildLevel(stash, loadout, placed);
    expect(summary.total).toBe(7 + 3 + 2 + 5 + 8 + 2 + (3 + 3 + 2));
    expect(summary.complete).toBe(true);
  });

  it("drops pickups and pickguard that don't fit the body", () => {
    const summary = buildLevel(stash, { ...loadout, body: "b2" }, []);
    expect(summary.lines.map((line) => line.slot)).toEqual([
      "body",
      "neck",
      "head",
      "finish",
    ]);
    expect(summary.complete).toBe(false);
  });

  it("explains why a part won't go on", () => {
    const singleCut = {
      id: "body:single-cut",
      slot: "body",
      partKey: "single-cut",
      name: "",
      rarity: "Common",
      routing: "H",
      source: "",
    } as const;
    expect(
      fitProblem(
        COMPONENT_DEFS.find((def) => def.id === "pickups:vintage-singles")!,
        singleCut,
      ),
    ).toMatch(/routing/);
    expect(
      fitProblem(
        COMPONENT_DEFS.find((def) => def.id === "pickguard:mint")!,
        singleCut,
      ),
    ).toMatch(/pickguard/);
  });

  it("names the build's rarity from its level", () => {
    expect(rarityForLevel(10)).toBe("Common");
    expect(rarityForLevel(34)).toBe("Epic");
    expect(rarityForLevel(70)).toBe("Mythic");
  });

  it("turns a loadout into what the renderer draws", () => {
    const build = toGuitarBuild(stash, loadout, [], {
      bodyKey: "x",
      neckKey: "x",
      headKey: "x",
    });
    expect(build).toMatchObject({
      bodyKey: "t-style",
      neckKey: "maple-dots",
      headKey: "six-inline",
      finish: "#6b2fa0",
      top: "flame",
      burst: true,
      pickguard: "#cfe3cf",
      pickups: { color: "#e6dcc2", metal: false },
    });
  });
});
