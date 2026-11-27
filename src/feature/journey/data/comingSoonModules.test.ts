import type { RoadmapTier } from "feature/roadmap/data/roadmap.data";
import { Route } from "lucide-react";
import { describe, expect, it } from "vitest";

import { getComingSoonModules } from "./comingSoonModules";

const tier = (over: Partial<RoadmapTier>): RoadmapTier => ({
  id: "x",
  cost: 10,
  goal: 10,
  icon: Route,
  label: "x",
  kind: "feature",
  ...over,
});

describe("getComingSoonModules", () => {
  it("lists only the Journey modules not built yet, in roadmap order", () => {
    const result = getComingSoonModules([
      tier({
        id: "journey-intervals",
        label: "Journey: Intervals",
        done: true,
      }),
      tier({ id: "ex-scales", label: "+3 New Exercises" }),
      tier({
        id: "journey-chords",
        label: "Journey: Chords & Triads",
        description: "A new Journey module: open chords and triads.",
      }),
      tier({ id: "journey-speed", label: "Journey: Speed & Precision" }),
    ]);

    expect(result).toEqual([
      {
        id: "journey-chords",
        title: "Chords & Triads",
        subtitle: "Open chords and triads.",
      },
      { id: "journey-speed", title: "Speed & Precision", subtitle: "" },
    ]);
  });

  it("matches the real roadmap: every entry has a title", () => {
    for (const entry of getComingSoonModules()) {
      expect(entry.title).not.toMatch(/^Journey:/);
      expect(entry.title.length).toBeGreaterThan(0);
    }
  });
});
