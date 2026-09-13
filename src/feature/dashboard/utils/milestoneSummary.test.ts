import type { ProgressData } from "feature/aiSummary/utils/milestoneLogic";
import { LEVELS } from "feature/aiSummary/utils/milestoneLogic";
import { describe, expect, it } from "vitest";

import { milestoneStatuses } from "./milestoneSummary";

const WEEK = "2026-W37";

const nothingDone: ProgressData = {
  daysIn7With15: 0,
  daysIn7With20: 0,
  streak15: 0,
  allCatsThisWeek: 0,
  daysIn7AllCats: 0,
  streakAllCats: 0,
};

const solidWeek: ProgressData = {
  daysIn7With15: 4,
  daysIn7With20: 3,
  streak15: 4,
  allCatsThisWeek: 1,
  daysIn7AllCats: 0,
  streakAllCats: 0,
};

describe("milestoneStatuses", () => {
  it("covers every tier in ladder order, carrying what a card has to draw", () => {
    const statuses = milestoneStatuses({
      progress: nothingDone,
      levels: { ownedLevelIds: [1], claims: {} },
      weekKey: WEEK,
      playerLvl: 10,
    });

    expect(statuses.map((s) => s.id)).toEqual(LEVELS.map((l) => l.id));
    expect(statuses[0]).toMatchObject({
      name: LEVELS[0].name,
      req: LEVELS[0].req,
      reward: LEVELS[0].reward,
      cost: LEVELS[0].cost,
      met: false,
      owned: true,
    });
    expect(statuses[0].Icon).toBe(LEVELS[0].Icon);
    expect(statuses[0].short).toBe(LEVELS[0].name.split(" ")[0]);
  });

  it("uses the tier's own short label where it has one", () => {
    const zone = LEVELS.find((tier) => tier.short);
    expect(zone).toBeDefined();

    const statuses = milestoneStatuses({
      progress: nothingDone,
      levels: { ownedLevelIds: [], claims: {} },
      weekKey: WEEK,
      playerLvl: 30,
    });

    expect(statuses.find((s) => s.id === zone!.id)?.short).toBe(zone!.short);
  });

  it("marks a claim only on the tier claimed in the week being asked about", () => {
    const statuses = milestoneStatuses({
      progress: solidWeek,
      levels: {
        ownedLevelIds: [1, 2],
        claims: { 1: { weekKey: WEEK, claimedAt: "2026-09-08T10:00:00Z" } },
      },
      weekKey: WEEK,
      playerLvl: 10,
    });

    // Spark and Groove are both met; Spark is already claimed, Groove is not.
    expect(statuses[0]).toMatchObject({
      met: true,
      owned: true,
      claimed: true,
    });
    expect(statuses[1]).toMatchObject({
      met: true,
      owned: true,
      claimed: false,
    });
  });

  it("treats last week's claim as unclaimed this week", () => {
    const statuses = milestoneStatuses({
      progress: solidWeek,
      levels: {
        ownedLevelIds: [1],
        claims: {
          1: { weekKey: "2026-W36", claimedAt: "2026-09-01T10:00:00Z" },
        },
      },
      weekKey: WEEK,
      playerLvl: 10,
    });

    expect(statuses[0].claimed).toBe(false);
  });

  it("reports the level a tier is still waiting for", () => {
    const locked = milestoneStatuses({
      progress: nothingDone,
      levels: { ownedLevelIds: [], claims: {} },
      weekKey: WEEK,
      playerLvl: 1,
    });
    expect(locked[0].lockedAtLvl).toBe(LEVELS[0].reqLvl);

    const open = milestoneStatuses({
      progress: nothingDone,
      levels: { ownedLevelIds: [], claims: {} },
      weekKey: WEEK,
      playerLvl: LEVELS[0].reqLvl,
    });
    expect(open[0].lockedAtLvl).toBeNull();
  });

  it("never re-locks a tier the player already owns", () => {
    const statuses = milestoneStatuses({
      progress: nothingDone,
      levels: { ownedLevelIds: [1, 8], claims: {} },
      weekKey: WEEK,
      playerLvl: 1,
    });

    expect(statuses.find((s) => s.id === 8)?.lockedAtLvl).toBeNull();
  });

  it("caps the week's progress at what the goal asks for", () => {
    const everything: ProgressData = {
      daysIn7With15: 7,
      daysIn7With20: 7,
      streak15: 30,
      allCatsThisWeek: 7,
      daysIn7AllCats: 7,
      streakAllCats: 30,
    };
    const statuses = milestoneStatuses({
      progress: everything,
      levels: { ownedLevelIds: [1], claims: {} },
      weekKey: WEEK,
      playerLvl: 30,
    });

    expect(statuses.every((s) => s.met)).toBe(true);
    statuses.forEach((s) => {
      expect(s.progress.value).toBe(s.progress.max);
    });
  });
});
