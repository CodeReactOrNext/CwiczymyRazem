import { PART_TIERS, PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import { describe, expect, it } from "vitest";

import type { JourneyProgressDocument } from "../types/journey.types";
import { journeyModules } from "./journeyModules";
import {
  getJourneyCompletion,
  getJourneyReward,
  getModuleStepIds,
  getTrophyGuitar,
  journeyRewardId,
} from "./journeyRewards";

const MODULE_IDS = journeyModules.map((module) => module.id);

/** A progress document with `count` of the module's steps ticked off. */
const progressWith = (
  moduleId: string,
  count: number,
): JourneyProgressDocument => ({
  userId: "u1",
  updatedAt: new Date(0).toISOString(),
  moduleProgress: {
    [moduleId]: {
      steps: Object.fromEntries(
        getModuleStepIds(moduleId)
          .slice(0, count)
          .map((stepId) => [stepId, { completed: true }]),
      ),
    },
  },
});

describe("getTrophyGuitar", () => {
  it("hands every roadmap a Legendary", () => {
    for (const moduleId of MODULE_IDS) {
      expect(getTrophyGuitar(moduleId)?.rarity, moduleId).toBe("Legendary");
    }
  });

  it("names the same model every time it is asked", () => {
    for (const moduleId of MODULE_IDS) {
      expect(getTrophyGuitar(moduleId)).toBe(getTrophyGuitar(moduleId));
    }
  });

  it("gives the two roadmaps different guitars", () => {
    const models = MODULE_IDS.map((moduleId) => getTrophyGuitar(moduleId)!.id);
    expect(new Set(models).size).toBe(models.length);
  });
});

describe("getJourneyReward", () => {
  it("prices every module the path can show", () => {
    for (const moduleId of MODULE_IDS) {
      expect(getJourneyReward(moduleId), moduleId).not.toBeNull();
    }
  });

  it("returns nothing for a module that does not exist", () => {
    expect(getJourneyReward("not_a_module")).toBeNull();
  });

  it("pays one free case per roadmap", () => {
    for (const moduleId of MODULE_IDS) {
      expect(getJourneyReward(moduleId)!.payout.caseTokens, moduleId).toBe(1);
    }
  });

  it("pays the longer roadmap more than the shorter one", () => {
    const fundamentals = getJourneyReward("fundamentals")!.payout.fame;
    const fretboard = getJourneyReward("fretboard")!.payout.fame;

    expect(getModuleStepIds("fretboard").length).toBeGreaterThan(
      getModuleStepIds("fundamentals").length,
    );
    expect(fretboard).toBeGreaterThan(fundamentals);
  });

  it("never hands out a part above the grade it can reach", () => {
    for (const moduleId of MODULE_IDS) {
      for (const part of getJourneyReward(moduleId)!.payout.parts) {
        const def = PARTS_BY_ID.get(part.partId);
        expect(def, `${part.partId} is not a real part`).toBeDefined();
        expect(PART_TIERS.indexOf(def!.maxTier)).toBeGreaterThanOrEqual(
          PART_TIERS.indexOf(part.tier),
        );
      }
    }
  });

  it("pays the same thing every time it is asked", () => {
    expect(getJourneyReward("fundamentals")).toEqual(
      getJourneyReward("fundamentals"),
    );
  });
});

describe("journeyRewardId", () => {
  it("is unique per module", () => {
    const ids = MODULE_IDS.map(journeyRewardId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getJourneyCompletion", () => {
  it("is unfinished with no progress document at all", () => {
    const completion = getJourneyCompletion("fundamentals", null);
    expect(completion.done).toBe(0);
    expect(completion.total).toBe(getModuleStepIds("fundamentals").length);
    expect(completion.isComplete).toBe(false);
  });

  it("counts only the steps that are ticked off", () => {
    const completion = getJourneyCompletion(
      "fundamentals",
      progressWith("fundamentals", 3),
    );
    expect(completion.done).toBe(3);
    expect(completion.isComplete).toBe(false);
  });

  it("closes once every step of the module is done", () => {
    for (const moduleId of MODULE_IDS) {
      const total = getModuleStepIds(moduleId).length;
      const completion = getJourneyCompletion(
        moduleId,
        progressWith(moduleId, total),
      );
      expect(completion.isComplete, moduleId).toBe(true);
      expect(completion.done).toBe(total);
    }
  });

  // A step added to a roadmap has to re-open it for the players who had
  // already finished the old version.
  it("does not count progress filed under a step the module no longer has", () => {
    const moduleId = "fundamentals";
    const progress = progressWith(moduleId, getModuleStepIds(moduleId).length);
    progress.moduleProgress[moduleId].steps.step_that_was_retired = {
      completed: true,
    };
    delete progress.moduleProgress[moduleId].steps[
      getModuleStepIds(moduleId)[0]
    ];

    const completion = getJourneyCompletion(moduleId, progress);
    expect(completion.isComplete).toBe(false);
    expect(completion.done).toBe(completion.total - 1);
  });

  it("knows nothing about a module that does not exist", () => {
    expect(getJourneyCompletion("not_a_module", null)).toEqual({
      done: 0,
      total: 0,
      isComplete: false,
    });
  });
});
