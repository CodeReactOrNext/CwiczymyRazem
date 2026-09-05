import staticRoadmaps from "data/roadmaps";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { PART_TIERS, PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import { describe, expect, it } from "vitest";

import type { StaticRoadmap } from "../types/roadmap.types";
import {
  getCuratedRoadmap,
  getRoadmapCompletion,
  getRoadmapReward,
  getRoadmapSteps,
  getRoadmapTrophy,
  isRewardableRoadmap,
  roadmapRewardId,
} from "./roadmapRewards";

const ROADMAP_IDS = (staticRoadmaps as StaticRoadmap[]).map((r) => r.id);

/** Progress with the first `count` steps practised to their session target. */
const progressWith = (
  roadmapId: string,
  count: number,
): Record<string, number> =>
  Object.fromEntries(
    getRoadmapSteps(roadmapId)
      .slice(0, count)
      .map((step) => [step.id, step.sessionsRequired]),
  );

describe("isRewardableRoadmap", () => {
  it("covers every curated roadmap that ships", () => {
    for (const roadmapId of ROADMAP_IDS) {
      expect(isRewardableRoadmap(roadmapId), roadmapId).toBe(true);
    }
  });

  // A roadmap the player generated lives in a document they can write, so its
  // step list — and therefore the price of a Legendary — would be theirs to set.
  it("refuses a roadmap that is not one of the authored ones", () => {
    expect(isRewardableRoadmap("some-generated-roadmap-id")).toBe(false);
    expect(getRoadmapReward("some-generated-roadmap-id")).toBeNull();
  });
});

describe("getRoadmapTrophy", () => {
  it("hands every curated roadmap a Legendary or better", () => {
    for (const roadmapId of ROADMAP_IDS) {
      expect(["Legendary", "Mythic"], roadmapId).toContain(
        getRoadmapTrophy(roadmapId)?.rarity,
      );
    }
  });

  // A guaranteed Mythic rather than an unobtainable one: the same models roll
  // out of the cases, at a rarity worth about one pull in two hundred.
  it("ends the artist roadmaps in a Mythic the cases also carry", () => {
    const mythics = ROADMAP_IDS.map(getRoadmapTrophy).filter(
      (guitar) => guitar?.rarity === "Mythic",
    );
    expect(mythics.length).toBeGreaterThan(0);

    for (const guitar of mythics) {
      expect(
        (GUITARS_BY_RARITY.Mythic ?? []).some((g) => g.id === guitar!.id),
        String(guitar!.id),
      ).toBe(true);
    }
  });

  it("gives each roadmap a guitar of its own", () => {
    const models = ROADMAP_IDS.map((id) => getRoadmapTrophy(id)!.id);
    expect(new Set(models).size).toBe(models.length);
  });

  it("names the same model every time it is asked", () => {
    expect(getRoadmapTrophy(ROADMAP_IDS[0])).toBe(
      getRoadmapTrophy(ROADMAP_IDS[0]),
    );
  });
});

describe("getRoadmapReward", () => {
  it("prices every curated roadmap", () => {
    for (const roadmapId of ROADMAP_IDS) {
      expect(getRoadmapReward(roadmapId), roadmapId).not.toBeNull();
    }
  });

  it("pays two free cases — more than any other single reward", () => {
    for (const roadmapId of ROADMAP_IDS) {
      expect(getRoadmapReward(roadmapId)!.payout.caseTokens, roadmapId).toBe(2);
    }
  });

  it("pays the longer roadmap more Fame", () => {
    const byLength = [...ROADMAP_IDS].sort(
      (a, b) => getRoadmapSteps(a).length - getRoadmapSteps(b).length,
    );
    const shortest = getRoadmapReward(byLength[0])!.payout.fame;
    const longest = getRoadmapReward(byLength.at(-1)!)!.payout.fame;

    expect(longest).toBeGreaterThan(shortest);
  });

  it("never hands out a part above the grade it can reach", () => {
    for (const roadmapId of ROADMAP_IDS) {
      for (const part of getRoadmapReward(roadmapId)!.payout.parts) {
        const def = PARTS_BY_ID.get(part.partId);
        expect(def, `${part.partId} is not a real part`).toBeDefined();
        expect(PART_TIERS.indexOf(def!.maxTier)).toBeGreaterThanOrEqual(
          PART_TIERS.indexOf(part.tier),
        );
      }
    }
  });

  it("pays the same thing every time it is asked", () => {
    expect(getRoadmapReward(ROADMAP_IDS[0])).toEqual(
      getRoadmapReward(ROADMAP_IDS[0]),
    );
  });
});

describe("roadmapRewardId", () => {
  it("is unique per roadmap", () => {
    const ids = ROADMAP_IDS.map(roadmapRewardId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getCuratedRoadmap", () => {
  it("finds each roadmap that ships, and nothing else", () => {
    for (const roadmapId of ROADMAP_IDS) {
      expect(getCuratedRoadmap(roadmapId)?.id, roadmapId).toBe(roadmapId);
    }
    expect(getCuratedRoadmap("nope")).toBeNull();
  });
});

describe("getRoadmapCompletion", () => {
  it("is unfinished with no progress at all", () => {
    const roadmapId = ROADMAP_IDS[0];
    const completion = getRoadmapCompletion(roadmapId, null);

    expect(completion.done).toBe(0);
    expect(completion.total).toBe(getRoadmapSteps(roadmapId).length);
    expect(completion.isComplete).toBe(false);
  });

  it("counts only the steps that hit their session target", () => {
    const roadmapId = ROADMAP_IDS[0];
    const completion = getRoadmapCompletion(
      roadmapId,
      progressWith(roadmapId, 3),
    );

    expect(completion.done).toBe(3);
    expect(completion.isComplete).toBe(false);
  });

  it("does not count a step one session short", () => {
    const roadmapId = ROADMAP_IDS[0];
    const steps = getRoadmapSteps(roadmapId);
    const progress = progressWith(roadmapId, steps.length);
    progress[steps[0].id] = steps[0].sessionsRequired - 1;

    const completion = getRoadmapCompletion(roadmapId, progress);
    expect(completion.isComplete).toBe(false);
    expect(completion.done).toBe(completion.total - 1);
  });

  it("closes once every step is practised to target", () => {
    for (const roadmapId of ROADMAP_IDS) {
      const total = getRoadmapSteps(roadmapId).length;
      const completion = getRoadmapCompletion(
        roadmapId,
        progressWith(roadmapId, total),
      );

      expect(completion.isComplete, roadmapId).toBe(true);
      expect(completion.done).toBe(total);
    }
  });

  // Progress filed under an id the roadmap no longer has must not close it.
  it("ignores sessions logged against a step that is not in the roadmap", () => {
    const roadmapId = ROADMAP_IDS[0];
    const completion = getRoadmapCompletion(roadmapId, {
      step_that_was_retired: 999,
    });

    expect(completion.done).toBe(0);
    expect(completion.isComplete).toBe(false);
  });

  it("knows nothing about a roadmap it does not have", () => {
    expect(getRoadmapCompletion("nope", { a: 5 })).toEqual({
      done: 0,
      total: 0,
      isComplete: false,
    });
  });
});
