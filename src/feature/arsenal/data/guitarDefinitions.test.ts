import type { SlateRarity } from "feature/supporterCase/types/supporterCase.types";
import { eligibleItems } from "feature/supporterCase/utils/slate";
import { describe, expect, it } from "vitest";

import {
  GUITAR_DEFINITIONS,
  GUITARS_BY_ID,
  GUITARS_BY_RARITY,
} from "./guitarDefinitions";

/** The five instruments the artist roadmaps hand out. */
const TROPHY_IDS = [67, 68, 69, 70, 71];

const trophies = TROPHY_IDS.map((id) => GUITARS_BY_ID.get(id)!);

describe("roadmap trophy guitars", () => {
  it("are all in the catalogue, and all Mythic", () => {
    for (const [index, guitar] of trophies.entries()) {
      expect(guitar, String(TROPHY_IDS[index])).toBeDefined();
      expect(guitar.rarity, String(TROPHY_IDS[index])).toBe("Mythic");
    }
  });

  // Finishing a roadmap is how you are *given* one, not the only way to own
  // one: they roll out of the cases like any other Mythic.
  it("drop from the cases like every other Mythic", () => {
    const pool = GUITARS_BY_RARITY.Mythic ?? [];
    for (const guitar of trophies) {
      expect(
        pool.some((entry) => entry.id === guitar.id),
        String(guitar.id),
      ).toBe(true);
    }
  });

  it("stand on the supporter ballot too", () => {
    for (const guitar of trophies) {
      const onBallot = eligibleItems(guitar.rarity as SlateRarity).some(
        (item) => item.kind === "guitar" && item.id === guitar.id,
      );
      expect(onBallot, String(guitar.id)).toBe(true);
    }
  });
});

describe("guitar definitions", () => {
  it("puts every model in a draw pool", () => {
    const pooled = new Set(
      Object.values(GUITARS_BY_RARITY).flatMap((pool) =>
        pool.map((guitar) => guitar.id),
      ),
    );
    for (const guitar of GUITAR_DEFINITIONS) {
      expect(pooled.has(guitar.id), String(guitar.id)).toBe(true);
    }
  });

  it("gives every model a unique id and a unique art slot", () => {
    const ids = GUITAR_DEFINITIONS.map((guitar) => guitar.id);
    expect(new Set(ids).size).toBe(ids.length);

    const art = GUITAR_DEFINITIONS.map((guitar) => guitar.imageId);
    expect(new Set(art).size).toBe(art.length);
  });

  it("keeps every model's production window the right way round", () => {
    for (const guitar of GUITAR_DEFINITIONS) {
      expect(guitar.yearTo, String(guitar.id)).toBeGreaterThanOrEqual(
        guitar.yearFrom,
      );
      expect(guitar.countries.length, String(guitar.id)).toBeGreaterThan(0);
    }
  });
});
