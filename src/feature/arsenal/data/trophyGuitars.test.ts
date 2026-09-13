import roadmaps from "data/roadmaps";
import {
  getDailyPool,
  POOL_RARITY_ORDER,
} from "feature/arsenal/data/dailyCase";
import {
  DROPPABLE_GUITARS,
  DROPPABLE_GUITARS_BY_RARITY,
  GUITAR_DEFINITIONS,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import {
  isTrophyGuitar,
  ROADMAP_TROPHY_GUITARS,
  TROPHY_GUITAR_IDS,
} from "feature/arsenal/data/trophyGuitars";
import { SLATE_RARITIES } from "feature/supporterCase/types/supporterCase.types";
import { eligibleItems } from "feature/supporterCase/utils/slate";
import { describe, expect, it } from "vitest";

/**
 * A roadmap trophy is the only guitar in the game that cannot be rolled. These
 * tests are the guard: every route that hands a guitar out at random has to
 * draw from a pool these ids are absent from, or the roadmap stops being the
 * only way to the model.
 */
describe("roadmap trophy guitars", () => {
  it("names a guitar that actually exists, one per curated roadmap", () => {
    Object.entries(ROADMAP_TROPHY_GUITARS).forEach(([roadmapId, guitarId]) => {
      expect(
        GUITARS_BY_ID.get(guitarId),
        `${roadmapId} → ${guitarId}`,
      ).toBeDefined();
    });
    expect(Object.keys(ROADMAP_TROPHY_GUITARS)).toHaveLength(roadmaps.length);
  });

  it("gives every curated roadmap its own trophy, never a shared model", () => {
    const guitarIds = Object.values(ROADMAP_TROPHY_GUITARS);
    expect(new Set(guitarIds).size).toBe(guitarIds.length);
    roadmaps.forEach((roadmap) => {
      expect(ROADMAP_TROPHY_GUITARS[roadmap.id], roadmap.title).toBeDefined();
    });
  });

  it("keeps every trophy out of the droppable pool, and everything else in", () => {
    DROPPABLE_GUITARS.forEach((guitar) => {
      expect(isTrophyGuitar(guitar.id), `${guitar.name} is droppable`).toBe(
        false,
      );
    });
    expect(DROPPABLE_GUITARS).toHaveLength(
      GUITAR_DEFINITIONS.length - TROPHY_GUITAR_IDS.size,
    );
  });

  it("keeps trophies out of every rarity bucket a case draws from", () => {
    Object.entries(DROPPABLE_GUITARS_BY_RARITY).forEach(([rarity, pool]) => {
      pool.forEach((guitar) => {
        expect(isTrophyGuitar(guitar.id), `${rarity}: ${guitar.name}`).toBe(
          false,
        );
      });
    });
  });

  it("leaves every rarity with something a case can still drop", () => {
    POOL_RARITY_ORDER.forEach((rarity) => {
      expect(
        (DROPPABLE_GUITARS_BY_RARITY[rarity] ?? []).length,
        `${rarity} pool is empty`,
      ).toBeGreaterThan(0);
    });
  });

  it("never features a trophy in the rotating Featured pool", () => {
    // Two years of rotations, so a seeded shuffle cannot hide a trophy in a
    // window this test happens not to look at.
    const start = Date.UTC(2026, 0, 1);
    for (let day = 0; day < 730; day += 1) {
      getDailyPool(new Date(start + day * 86_400_000)).forEach((entry) => {
        if (entry.kind !== "guitar") return;
        expect(
          isTrophyGuitar(entry.def.id),
          `day ${day}: ${entry.def.name}`,
        ).toBe(false);
      });
    }
  });

  it("never offers a trophy on a Supporter slate ballot", () => {
    SLATE_RARITIES.forEach((rarity) => {
      eligibleItems(rarity).forEach((item) => {
        if (item.kind !== "guitar") return;
        expect(isTrophyGuitar(item.id), `${rarity}: ${item.name}`).toBe(false);
      });
    });
  });
});
