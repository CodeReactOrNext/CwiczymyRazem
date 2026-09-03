import { describe, expect, it } from "vitest";

import type {
  ArsenalUserData,
  EffectInventoryItem,
  InventoryItem,
} from "../types/arsenal.types";
import { DEFAULT_RIG } from "../types/arsenal.types";
import { EMPTY_ARSENAL_SUMMARY, summarizeArsenal } from "./arsenalSummary";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";

const guitarOfRarity = (rarity: string) =>
  GUITAR_DEFINITIONS.find((g) => g.rarity === rarity)!;

const effectOfRarity = (rarity: string) =>
  EFFECT_DEFINITIONS.find((e) => e.rarity === rarity)!;

const guitar = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "g1",
  guitarId: guitarOfRarity("Common").id,
  acquiredAt: 0,
  isNew: false,
  year: 1998,
  country: "USA",
  ...over,
} as InventoryItem);

const pedal = (over: Partial<EffectInventoryItem> = {}): EffectInventoryItem => ({
  id: "e1",
  effectId: effectOfRarity("Common").id,
  acquiredAt: 0,
  isNew: false,
  ...over,
});

const arsenalOf = (
  inventory: InventoryItem[],
  effectInventory: EffectInventoryItem[] = [],
): ArsenalUserData => ({
  inventory,
  effectInventory,
  equippedGuitarId: null,
  equippedItemId: null,
  rig: DEFAULT_RIG,
  parts: [],
});

describe("summarizeArsenal", () => {
  it("reads a missing arsenal as an empty one rather than throwing", () => {
    expect(summarizeArsenal(null)).toEqual(EMPTY_ARSENAL_SUMMARY);
    expect(summarizeArsenal(undefined)).toEqual(EMPTY_ARSENAL_SUMMARY);
  });

  it("counts rarities across both halves of the stash", () => {
    const summary = summarizeArsenal(
      arsenalOf(
        [
          guitar({ id: "a", guitarId: guitarOfRarity("Mythic").id }),
          guitar({ id: "b", guitarId: guitarOfRarity("Common").id }),
        ],
        [pedal({ id: "c", effectId: effectOfRarity("Legendary").id })],
      ),
    );

    expect(summary.ownedByRarity.Mythic).toBe(1);
    expect(summary.ownedByRarity.Common).toBe(1);
    expect(summary.ownedByRarity.Legendary).toBe(1);
    expect(summary.itemCount).toBe(3);
  });

  it("grades Museum condition off the shared threshold, not a magic number", () => {
    const summary = summarizeArsenal(
      arsenalOf([
        guitar({ id: "a", condition: 0.95 }),
        guitar({ id: "b", condition: 0.92 }),
        guitar({ id: "c", condition: 0.9199 }),
        // Legacy items carry no condition at all and must not count.
        guitar({ id: "d", condition: undefined }),
      ]),
    );

    expect(summary.museumCount).toBe(2);
  });

  it("keeps the lowest serial and the earliest guitar year", () => {
    const summary = summarizeArsenal(
      arsenalOf(
        [
          guitar({ id: "a", serial: 47, year: 1998 }),
          guitar({ id: "b", serial: 1, year: 1966 }),
        ],
        [pedal({ id: "c", serial: 900 })],
      ),
    );

    expect(summary.bestSerial).toBe(1);
    expect(summary.oldestGuitarYear).toBe(1966);
  });

  it("leaves serial and year null when nothing carries them", () => {
    const summary = summarizeArsenal(
      arsenalOf([guitar({ id: "a", serial: undefined, year: undefined as never })]),
    );

    expect(summary.bestSerial).toBeNull();
    expect(summary.oldestGuitarYear).toBeNull();
  });

  it("counts each production country once", () => {
    const summary = summarizeArsenal(
      arsenalOf(
        [
          guitar({ id: "a", country: "USA" }),
          guitar({ id: "b", country: "USA" }),
          guitar({ id: "c", country: "Japan" }),
        ],
        [pedal({ id: "d", country: "Germany" })],
      ),
    );

    expect(summary.countryCount).toBe(3);
  });
});
