import type { FeatureUseMap, QuestFeature } from "types/api.types";
import { describe, expect, it } from "vitest";

import {
  drawDailyQuest,
  drawReplacementTask,
  featuresInUse,
} from "./dailyQuest.draw";
import {
  CORE_QUEST_TEMPLATES,
  FEATURE_QUEST_TEMPLATES,
  mergeFeatureUse,
  QUEST_TYPE_FEATURE,
  seedFeatureUse,
} from "./dailyQuest.features";

/** A deterministic stream of rolls, so every draw is reproducible. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const coreTypes = new Set(
  CORE_QUEST_TEMPLATES.map((template) => template.type),
);

const drawMany = (input: Parameters<typeof drawDailyQuest>[0], times = 200) =>
  Array.from({ length: times }, (_, i) =>
    drawDailyQuest({ ...input, random: seeded(i + 1) }),
  );

describe("drawDailyQuest", () => {
  it("always draws three tasks with one practice quest first", () => {
    for (const draw of drawMany({
      sessionCount: 40,
      featureUse: { goals: 39, songs: 30 },
    })) {
      expect(draw.tasks).toHaveLength(3);
      expect(draw.tasks[0].slot).toBe("core");
      expect(coreTypes.has(draw.tasks[0].template.type)).toBe(true);
    }
  });

  it("never repeats a task type or a feature within one set", () => {
    const featureUse: FeatureUseMap = {
      goals: 39,
      songs: 35,
      rotation: 20,
      plans: 38,
    };
    for (const draw of drawMany({ sessionCount: 40, featureUse })) {
      const types = draw.tasks.map((task) => task.template.type);
      expect(new Set(types).size).toBe(types.length);
      expect(new Set(draw.features).size).toBe(draw.features.length);
    }
  });

  it("draws tool quests only from features used in the last 30 active days", () => {
    // songs 35 days ago is out of the window; goals and calendar are in.
    const featureUse: FeatureUseMap = { goals: 95, calendar: 80, songs: 65 };
    for (const draw of drawMany({ sessionCount: 101, featureUse })) {
      expect(draw.mode).toBe("regular");
      for (const task of draw.tasks.slice(1)) {
        if (task.slot === "tool")
          expect(["goals", "calendar"]).toContain(task.feature);
      }
    }
  });

  it("measures the window in active days, so a break does not empty the profile", () => {
    // Used on active day 10, now active day 12 — however many calendar days passed.
    expect(featuresInUse({ rotation: 10 }, 12)).toEqual(["rotation"]);
    expect(featuresInUse({ rotation: 10 }, 40)).toEqual([]);
  });

  it("skips yesterday's features when there are enough others", () => {
    const featureUse: FeatureUseMap = {
      goals: 39,
      songs: 39,
      rotation: 39,
      calendar: 39,
    };
    const previousFeatures: QuestFeature[] = ["goals", "songs"];
    for (const draw of drawMany({
      sessionCount: 41,
      featureUse,
      previousFeatures,
    })) {
      for (const feature of draw.features)
        expect(previousFeatures).not.toContain(feature);
    }
  });

  it("turns the third slot into a come-back quest every fourth active day", () => {
    const featureUse: FeatureUseMap = { goals: 39, songs: 38, bosses: 0 };
    for (const draw of drawMany({ sessionCount: 40, featureUse }, 50)) {
      expect(draw.tasks[2]).toMatchObject({
        slot: "comeback",
        feature: "bosses",
      });
    }
    for (const draw of drawMany({ sessionCount: 41, featureUse }, 50)) {
      expect(draw.tasks.some((task) => task.slot === "comeback")).toBe(false);
    }
  });

  it("gives a new player quests from across the app, a step ahead of What Next", () => {
    const seen = new Set<QuestFeature>();
    for (const draw of drawMany({
      sessionCount: 2,
      featureUse: { songs: 1 },
    })) {
      expect(draw.mode).toBe("onboarding");
      draw.tasks.slice(1).forEach((task) => {
        expect(task.slot).toBe("discover");
        seen.add(task.feature!);
      });
    }
    // songs is used; goals, plans and journey are what What Next shows first.
    expect(seen.has("songs")).toBe(false);
    expect(seen.has("goals")).toBe(false);
    expect([...seen].sort()).toEqual([
      "calendar",
      "daily",
      "rotation",
      "trees",
    ]);
  });

  it("never discovers guilds, which are level-locked", () => {
    for (const draw of drawMany({ sessionCount: 3 })) {
      expect(draw.features).not.toContain("guild");
    }
  });

  it("widens out a profile with a single tool", () => {
    for (const draw of drawMany({
      sessionCount: 20,
      featureUse: { songs: 19 },
    })) {
      expect(draw.mode).toBe("thin");
      expect(draw.tasks[1]).toMatchObject({ slot: "tool", feature: "songs" });
      expect(draw.tasks[2].slot).toBe("discover");
    }
  });

  it("draws any tools for an account that has no profile yet", () => {
    for (const draw of drawMany({ sessionCount: 50 })) {
      expect(draw.mode).toBe("legacy");
      expect(draw.tasks).toHaveLength(3);
      expect(draw.features).toHaveLength(2);
    }
  });

  it("fills with practice when nothing is left to draw", () => {
    const everything = Object.fromEntries(
      Object.keys(FEATURE_QUEST_TEMPLATES).map((feature) => [feature, 0]),
    ) as FeatureUseMap;
    const draw = drawDailyQuest({
      sessionCount: 500,
      featureUse: everything,
      random: seeded(3),
    });
    expect(draw.mode).toBe("empty");
    expect(draw.tasks).toHaveLength(3);
    expect(draw.tasks.every((task) => task.slot === "core")).toBe(true);
  });
});

describe("drawReplacementTask", () => {
  const tasks = [
    { type: "practice_total_time" as const, slot: "core" as const },
    {
      type: "goal_run" as const,
      feature: "goals" as const,
      slot: "tool" as const,
    },
    {
      type: "rotation_item" as const,
      feature: "rotation" as const,
      slot: "tool" as const,
    },
  ];

  it("swaps a tool quest for another tool the player uses", () => {
    const featureUse: FeatureUseMap = { goals: 39, rotation: 39, calendar: 38 };
    for (let i = 1; i < 50; i++) {
      const next = drawReplacementTask(tasks, 1, {
        sessionCount: 40,
        featureUse,
        random: seeded(i),
      });
      expect(next).toMatchObject({ feature: "calendar", slot: "tool" });
    }
  });

  it("swaps a practice quest for a different practice quest", () => {
    for (let i = 1; i < 50; i++) {
      const next = drawReplacementTask(tasks, 0, {
        sessionCount: 40,
        random: seeded(i),
      });
      expect(next?.slot).toBe("core");
      expect(next?.template.type).not.toBe("practice_total_time");
      expect(next?.template.type).not.toBe("practice_specific_exercise");
    }
  });
});

describe("feature profile helpers", () => {
  it("maps every tool quest type to exactly one feature", () => {
    for (const [feature, templates] of Object.entries(
      FEATURE_QUEST_TEMPLATES,
    )) {
      for (const template of templates)
        expect(QUEST_TYPE_FEATURE[template.type]).toBe(feature);
    }
    for (const type of coreTypes)
      expect(QUEST_TYPE_FEATURE[type]).toBeUndefined();
  });

  it("seeds a profile from done What Next goals, inside the window", () => {
    expect(
      seedFeatureUse(["tempo_goal", "rotation", "first_session"], 100),
    ).toEqual({
      goals: 80,
      rotation: 80,
    });
    expect(seedFeatureUse(["calendar"], 5)).toEqual({ calendar: 0 });
  });

  it("keeps the later stamp per feature when merging", () => {
    expect(mergeFeatureUse({ goals: 3, songs: 9 }, { goals: 7 })).toEqual({
      goals: 7,
      songs: 9,
    });
    expect(mergeFeatureUse(undefined, { goals: 7 })).toEqual({ goals: 7 });
  });
});
