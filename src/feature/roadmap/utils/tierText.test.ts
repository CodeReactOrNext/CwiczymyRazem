import type { RoadmapTier } from "feature/roadmap/data/roadmap.data";
import type { Translate } from "lib/i18n/translate";
import { Target } from "lucide-react";
import { describe, expect, it } from "vitest";

import { tierLabel } from "./tierText";

const pack: RoadmapTier = {
  id: "ex-chord-changes",
  cost: 30,
  goal: 30,
  icon: Target,
  label: "+3 New Exercises",
  topic: "Chord Changes",
  kind: "content",
};

const polish: Record<string, string> = {
  "supporter:tiers.content.exercises": "+{{count}} nowe ćwiczenia",
  "supporter:tiers.ex-chord-changes.topic": "Zmiany akordów",
};

const t: Translate = (key, options) => {
  const text = polish[key];
  if (!text) return key;
  const count = typeof options === "object" ? options.count : undefined;
  return text.replace("{{count}}", String(count));
};

describe("tierLabel", () => {
  it("names the topic after the pack in English", () => {
    expect(tierLabel(pack)).toBe("+3 New Exercises: Chord Changes");
  });

  it("translates both the pack and its topic", () => {
    expect(tierLabel(pack, t)).toBe("+3 nowe ćwiczenia: Zmiany akordów");
  });

  it("leaves a tier without a topic as it was", () => {
    expect(tierLabel({ ...pack, topic: undefined }, t)).toBe(
      "+3 nowe ćwiczenia",
    );
  });
});
