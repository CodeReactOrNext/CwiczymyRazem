import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import { describe, expect, it } from "vitest";

import { LEVELS, milestoneLockedAtLvl } from "./milestoneLogic";

describe("the milestone level ladder", () => {
  it("gives every tier a level", () => {
    // The one failure mode of a lookup table beside a list: a tier added to the
    // list and forgotten in the table would ship ungated.
    for (const level of LEVELS) {
      expect(level.reqLvl, level.name).toBeGreaterThan(0);
    }
  });

  it("never asks for less than the page it lives on", () => {
    // Milestones opens at level 3. A tier gated below that would be a promise
    // made on a screen the player cannot reach.
    for (const level of LEVELS) {
      expect(level.reqLvl, level.name).toBeGreaterThanOrEqual(
        FEATURE_UNLOCKS.summary.requiredLvl,
      );
    }
  });

  it("climbs with the goals", () => {
    // A later tier is always a harder weekly goal, so it can never open sooner.
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].reqLvl, LEVELS[i].name).toBeGreaterThanOrEqual(
        LEVELS[i - 1].reqLvl,
      );
    }
  });

  it("leaves the first tier free at the level the page opens", () => {
    // Reaching Milestones and being able to start it are the same moment.
    expect(LEVELS[0].cost).toBe(0);
    expect(milestoneLockedAtLvl(LEVELS[0], FEATURE_UNLOCKS.summary.requiredLvl))
      .toBeNull();
  });
});

describe("milestoneLockedAtLvl", () => {
  const shredder = LEVELS.find((level) => level.name === "Shredder")!;

  it("names the level a tier is waiting for", () => {
    expect(milestoneLockedAtLvl(shredder, 1)).toBe(shredder.reqLvl);
  });

  it("opens once the account gets there", () => {
    expect(milestoneLockedAtLvl(shredder, shredder.reqLvl)).toBeNull();
  });

  it("never takes back a tier that was already bought", () => {
    // The grandfather clause: this ladder shipped after people had been buying
    // tiers for months, and a rule that repossessed them would be a punishment
    // for having played early.
    expect(milestoneLockedAtLvl(shredder, 1, true)).toBeNull();
  });
});
