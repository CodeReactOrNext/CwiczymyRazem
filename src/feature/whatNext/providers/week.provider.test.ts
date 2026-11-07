import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import { DAY, NOW, snapshot } from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import {
  balanceActions,
  challengeActions,
  guildActions,
  milestoneActions,
  seasonActions,
} from "./week.provider";

const tier = (overrides: Partial<MilestoneStatus>): MilestoneStatus =>
  ({
    id: 1,
    name: "Steady",
    short: "Steady",
    req: "15 min on 3 days",
    color: "#fff",
    Icon: () => null,
    reward: 30,
    cost: 0,
    met: false,
    owned: true,
    claimed: false,
    lockedAtLvl: null,
    progress: { value: 1, max: 3 },
    ...overrides,
  }) as MilestoneStatus;

describe("milestoneActions", () => {
  it("names the owned weekly goal closest to done", () => {
    const [action] = milestoneActions(
      snapshot({
        milestones: {
          weekKey: "2026-W45",
          statuses: [
            tier({ id: 1, progress: { value: 1, max: 3 } }),
            tier({ id: 2, name: "Daily", progress: { value: 4, max: 5 } }),
            tier({ id: 3, owned: false, progress: { value: 5, max: 5 } }),
          ],
        },
      }),
    );
    expect(action.title.params).toEqual({ name: "Daily" });
    expect(action.reward).toEqual({ fame: 30 });
  });

  it("leaves met goals to the claims strip", () => {
    expect(
      milestoneActions(
        snapshot({
          milestones: { weekKey: "w", statuses: [tier({ met: true })] },
        }),
      ),
    ).toEqual([]);
  });
});

describe("challengeActions", () => {
  const challenge = {
    id: "2026-11",
    total: 4,
    cleared: 2,
    daysLeft: 23,
    endsAt: NOW + 23 * DAY,
  };

  it("is a weekly target with time to spare, a deadline at the end of the month", () => {
    expect(challengeActions(snapshot({ challenge }))[0].kind).toBe("week");
    expect(
      challengeActions(
        snapshot({ challenge: { ...challenge, daysLeft: 2 } }),
      )[0].kind,
    ).toBe("expiring");
  });

  it("disappears once every song is recorded", () => {
    expect(
      challengeActions(snapshot({ challenge: { ...challenge, cleared: 4 } })),
    ).toEqual([]);
  });
});

describe("seasonActions", () => {
  it("says how far the next player is", () => {
    const [action] = seasonActions(
      snapshot({
        season: {
          place: 14,
          rivalName: "Ola",
          gap: 120,
          endsAt: NOW + 20 * DAY,
        },
      }),
    );
    expect(action.title.params).toEqual({ gap: 120, name: "Ola" });
    expect(action.reason?.key).toBe("season.reason_paid");
  });
});

describe("balanceActions", () => {
  const picks = { hearing: { exerciseId: "ear_1", title: "Intervals" } };

  it("points at a category left out this week, with an exercise for it", () => {
    const [action] = balanceActions(
      snapshot({
        weekMinutes: { technique: 90, theory: 20, hearing: 0, creativity: 10 },
        categoryPicks: picks,
      }),
    );
    expect(action.title.key).toBe("balance.hearing");
    expect(action.href).toBe("/practice/exercise/ear_1");
  });

  it("waits until the week has enough practice to say anything", () => {
    expect(
      balanceActions(
        snapshot({
          weekMinutes: { technique: 20, theory: 0, hearing: 0, creativity: 0 },
          categoryPicks: picks,
        }),
      ),
    ).toEqual([]);
  });
});

describe("guildActions", () => {
  it("shows the player's open share of a quest and a founder's applications", () => {
    const actions = guildActions(
      snapshot({
        guild: {
          isMember: true,
          claimableFame: 0,
          claimableQuests: 0,
          openShares: [{ id: "q1", name: "Scale week", mine: 20, target: 60 }],
          applications: 2,
        },
      }),
    );
    expect(actions.map((a) => a.href)).toEqual([
      "/guilds?tab=quests",
      "/guilds?tab=members",
    ]);
  });

  it("is empty outside a guild", () => {
    expect(guildActions(snapshot({ guild: null }))).toEqual([]);
  });
});
