import { describe, expect, it } from "vitest";

import { renderExerciseCatalog } from "./exerciseCatalog";
import { houseStyleExemplars } from "./houseStyle";

describe("house style", () => {
  it("still finds both curated exemplars in src/data/roadmaps", () => {
    const exemplars = houseStyleExemplars();
    expect(exemplars.map((e) => e.title)).toEqual([
      "Thumb over the neck",
      "Rests, long notes and clean stops",
    ]);
    exemplars.forEach((exemplar) => {
      expect(exemplar.description).toMatch(/\[How to practice\]/);
      expect(exemplar.successCriteria.length).toBeGreaterThan(40);
    });
  });

  it("renders the whole library compactly enough to ship on every call", () => {
    const catalog = renderExerciseCatalog();
    expect(catalog.split("\n").length).toBeGreaterThan(200);
    // ~4 chars per token: keep the library under ~16.5k tokens. Raised from
    // 60k chars on 2026-11-19, when the 22 Interval Mastery drills took the
    // library from 59.4k to 63.6k.
    expect(catalog.length).toBeLessThan(66_000);
    expect(catalog).toContain(
      "one_chord_improv | Improv — One Chord | medium | creativity",
    );
  });
});
