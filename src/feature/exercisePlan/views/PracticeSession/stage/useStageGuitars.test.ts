import type { BoardSkinState } from "feature/arsenal/data/boardSkins";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import type { InventoryItem, RigSetup } from "feature/arsenal/types/arsenal.types";
import { describe, expect, it } from "vitest";

import { pickStageGuitars, STAGE_GUITARS_MAX } from "./useStageGuitars";

const [a, b, c, d] = GUITAR_DEFINITIONS;
const item = (id: string, guitarId: number | string, condition = 0.5): InventoryItem =>
  ({ id, guitarId, acquiredAt: 0, isNew: false, year: a.yearFrom, country: a.countries[0], condition }) as InventoryItem;
const rig = (slots: (string | null)[]): RigSetup =>
  ({ guitarSlots: slots, pedalboardItems: [], ampHeadId: null, ampId: null }) as unknown as RigSetup;

describe("pickStageGuitars", () => {
  const inventory = [item("i1", a.id), item("i2", b.id), item("i3", c.id), item("i4", d.id)];

  it("hangs the guitars on the player's Rig, in the Rig's order", () => {
    const picked = pickStageGuitars({ inventory, rig: rig(["i3", null, "i1"]) });
    expect(picked.map((g) => g.key)).toEqual(["i3", "i1"]);
    expect(picked[0].name).toBe(c.name);
    expect(picked[0].src).toMatch(/\.webp$/);
  });

  it("hangs each guitar in the case of its Rig bay, the studio's own where the bay has none", () => {
    const boardSkins: BoardSkinState = { owned: ["rack-studio"], rack: [null, null, "rack-studio"], cable: null, board: null };
    const picked = pickStageGuitars({ inventory, rig: rig(["i2", null, "i4"]), boardSkins });
    expect(picked.map((g) => [g.key, g.look])).toEqual([
      ["i2", undefined],
      ["i4", "studio"],
    ]);
  });

  it("falls back to the player's guitars when the Rig is empty, never more than the wall holds", () => {
    const picked = pickStageGuitars({ inventory, rig: rig([null, null, null]) });
    expect(picked).toHaveLength(STAGE_GUITARS_MAX);
  });

  it("skips what isn't a known guitar and hangs nothing without data", () => {
    expect(pickStageGuitars({ inventory: [item("x", "no-such-guitar")], rig: rig(["x", null, null]) })).toEqual([]);
    expect(pickStageGuitars(undefined)).toEqual([]);
  });
});
