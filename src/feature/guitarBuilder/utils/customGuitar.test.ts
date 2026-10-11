import {
  guitarDefinitionByImageId,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import type { InventoryItem } from "feature/arsenal/types/arsenal.types";
import {
  getRankBadgeSrc,
  isGuitarImageId,
} from "feature/arsenal/utils/guitarImage";
import { describe, expect, it } from "vitest";

import type { OwnedComponent } from "../types/guitarBuilder.types";
import {
  checkBuild,
  COMPONENT_CASE_CHANCE,
  getComponentResaleValue,
  rollCaseComponent,
  seededRandom,
} from "./components";
import {
  buildFameCost,
  cleanGuitarName,
  customGuitarDefinition,
  customGuitarId,
  parseCustomGuitarId,
  REBUILD_MIN_FAME,
  rebuildFameCost,
} from "./customGuitar";

describe("custom guitar ids", () => {
  const id = customGuitarId({
    rarity: "Epic",
    bodyKey: "superstrat",
    token: "abc123",
  });

  it("round-trips rarity, body and token", () => {
    expect(parseCustomGuitarId(id)).toEqual({
      rarity: "Epic",
      bodyKey: "superstrat",
      token: "abc123",
      name: null,
    });
    expect(parseCustomGuitarId(12)).toBeNull();
    expect(parseCustomGuitarId("custom:Shiny:superstrat:x")).toBeNull();
  });

  it("stands in for a model definition everywhere GUITARS_BY_ID is read", () => {
    const def = GUITARS_BY_ID.get(id);
    expect(def).toEqual(customGuitarDefinition(id));
    expect(def).toMatchObject({ name: "Custom Superstrat", rarity: "Epic" });
    expect(def?.spec.pickups).toBe("HSH");
    // real models still resolve as before
    expect(GUITARS_BY_ID.get(1)?.name).toBe("SV6 Core");
  });

  it("points the image at the build's render in Storage", () => {
    const src = getRankBadgeSrc(customGuitarDefinition(id)!.imageId, "medium");
    expect(src).toContain("custom-guitars%2Fabc123.webp");
    expect(src).toContain("token=abc123");
  });

  it("levels a build by its parts alone", () => {
    const item = {
      id: "x",
      guitarId: id,
      condition: 0.95,
      year: 2026,
      country: "USA",
      buildLevel: 0,
      custom: { level: 41, parts: [], loadout: {} as never, stickers: [] },
    } as unknown as InventoryItem;
    expect(getItemLevel(item, customGuitarDefinition(id)!)).toBe(41);
  });
});

describe("build Fame", () => {
  it("grows steeply with level: pocket money for Commons, a goal for Mythics", () => {
    expect(buildFameCost(14)).toBeLessThan(200);
    expect(buildFameCost(63)).toBeGreaterThan(1300);
    expect(buildFameCost(80)).toBeGreaterThan(buildFameCost(63));
  });

  it("charges a rebuild for the gain, never less than the bench fee", () => {
    expect(rebuildFameCost(30, 40)).toBe(buildFameCost(40) - buildFameCost(30));
    expect(rebuildFameCost(40, 30)).toBe(REBUILD_MIN_FAME);
  });
});

describe("case drops", () => {
  it("drops parts from the guitar cases, not the effects or curated ones", () => {
    expect(COMPONENT_CASE_CHANCE.standard).toBeGreaterThan(0.35);
    expect(COMPONENT_CASE_CHANCE["elite-guitar"]).toBeGreaterThan(0.35);
    expect(COMPONENT_CASE_CHANCE["elite-effect"]).toBeUndefined();
    expect(COMPONENT_CASE_CHANCE.daily).toBeUndefined();
  });

  it("rolls parts on the case's rarity table", () => {
    const random = seededRandom(5);
    const eliteOnly = { Rare: 0.5, Epic: 0.38, Legendary: 0.09, Mythic: 0.03 };
    for (let i = 0; i < 200; i++) {
      const part = rollCaseComponent(eliteOnly, random);
      expect(part.defId).toBeTruthy();
      expect(part.isNew).toBe(true);
      expect(part.defId.includes("smiley")).toBe(false); // Common sticker
    }
  });
});

describe("checkBuild", () => {
  const stash: OwnedComponent[] = [
    { uid: "b", defId: "body:t-style", level: 7 },
    { uid: "n", defId: "neck:maple-dots", level: 3 },
    { uid: "h", defId: "head:six-inline", level: 2 },
    { uid: "p", defId: "pickups:vintage-singles", level: 5 },
    { uid: "ph", defId: "pickups:hot-humbuckers", level: 5 },
    { uid: "f", defId: "finish:black", level: 2 },
    { uid: "s", defId: "sticker:star", level: 1 },
  ];
  const loadout = {
    body: "b",
    neck: "n",
    head: "h",
    pickups: "p",
    finish: "f",
    pickguard: null,
  };

  it("passes a complete, owned, fitting build and lists what it uses", () => {
    const sticker = { id: "s", key: "star", x: 0, y: 0, size: 90, rotation: 0 };
    const check = checkBuild(stash, loadout, [sticker], 12);
    expect(check).toMatchObject({ ok: true, level: 20 });
    if (check.ok)
      expect(check.used.map((p) => p.uid).sort()).toEqual([
        "b",
        "f",
        "h",
        "n",
        "p",
        "s",
      ]);
  });

  it("needs every core part, including the finish", () => {
    expect(checkBuild(stash, { ...loadout, finish: null }, [], 12).ok).toBe(
      false,
    );
  });

  it("refuses parts that aren't owned, don't fit, or sit in the wrong slot", () => {
    expect(checkBuild(stash, { ...loadout, neck: "ghost" }, [], 12).ok).toBe(
      false,
    );
    expect(checkBuild(stash, { ...loadout, pickups: "ph" }, [], 12).ok).toBe(
      false,
    );
    expect(checkBuild(stash, { ...loadout, neck: "h" }, [], 12).ok).toBe(false);
  });

  it("refuses a sticker that claims another sticker's art", () => {
    const fake = { id: "s", key: "skull", x: 0, y: 0, size: 90, rotation: 0 };
    expect(checkBuild(stash, loadout, [fake], 12).ok).toBe(false);
  });
});

describe("part resale", () => {
  it("pays more for a higher roll and a rarer part", () => {
    const low = getComponentResaleValue({
      uid: "a",
      defId: "body:x-style",
      level: 11,
    });
    const high = getComponentResaleValue({
      uid: "b",
      defId: "body:x-style",
      level: 27,
    });
    const common = getComponentResaleValue({
      uid: "c",
      defId: "body:s-style",
      level: 7,
    });
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThan(common);
    expect(
      getComponentResaleValue({ uid: "d", defId: "body:gone", level: 5 }),
    ).toBe(0);
  });
});

describe("naming", () => {
  it("carries the player's name in the id, safely", () => {
    const id = customGuitarId({
      rarity: "Rare",
      bodyKey: "t-style",
      token: "t1",
      name: "Blue: Moon",
    });
    expect(parseCustomGuitarId(id)?.name).toBe("Blue: Moon");
    expect(GUITARS_BY_ID.get(id)?.name).toBe("Blue: Moon");
    expect(GUITARS_BY_ID.get(id)?.rarity).toBe("Rare");
  });

  it("cleans names and falls back to the body's", () => {
    expect(cleanGuitarName("  Old\u0007   Faithful  ")).toBe("Old Faithful");
    expect(cleanGuitarName("x".repeat(80))).toHaveLength(32);
    expect(cleanGuitarName("   ")).toBeNull();
    const id = customGuitarId({
      rarity: "Rare",
      bodyKey: "t-style",
      token: "t1",
      name: "  ",
    });
    expect(GUITARS_BY_ID.get(id)?.name).toBe("Custom T-Style");
  });
});

describe("on the profile", () => {
  it("recognises a build's picture and its rarity from the image id alone", () => {
    const id = customGuitarId({
      rarity: "Mythic",
      bodyKey: "x-style",
      token: "t9",
    });
    const imageId = GUITARS_BY_ID.get(id)!.imageId;
    expect(isGuitarImageId(imageId)).toBe(true);
    expect(isGuitarImageId(12)).toBe(false);
    expect(guitarDefinitionByImageId(imageId)?.rarity).toBe("Mythic");
    expect(getRankBadgeSrc(imageId)).toContain("custom-guitars%2Ft9.webp");
  });
});

describe("workshop on a build", () => {
  it("adds mods and build levels on top of the parts", () => {
    const id = customGuitarId({
      rarity: "Rare",
      bodyKey: "t-style",
      token: "t1",
    });
    const item = {
      id: "x",
      guitarId: id,
      condition: 0.95,
      year: 2026,
      country: "USA",
      buildLevel: 2,
      stats: { pickups: 3, sustain: 1, playFeeling: 0 },
      custom: { level: 30, parts: [], loadout: {} as never, stickers: [] },
    } as unknown as InventoryItem;
    // Rare build gain is 2 per level
    expect(getItemLevel(item, GUITARS_BY_ID.get(id)!)).toBe(30 + 4 + 4);
  });
});
