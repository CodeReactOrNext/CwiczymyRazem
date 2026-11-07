import { BOSSES } from "feature/bosses/data/bosses";
import { getNextMilestone } from "feature/progression/data/levelMilestones";
import { snapshot } from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import {
  achievementActions,
  bossActions,
  progressionActions,
} from "./horizon.provider";

describe("progressionActions", () => {
  it("names the next rung of the level ladder", () => {
    const [action] = progressionActions(snapshot({ lvl: 10 }));
    expect(action.title.params).toEqual({ lvl: getNextMilestone(10)!.lvl });
    expect(action.kind).toBe("horizon");
  });

  it("says which feature a rung opens", () => {
    const [action] = progressionActions(snapshot({ lvl: 4, points: 0 }));
    expect(action.reason?.key).toBe("progression.unlock");
    expect(action.reason?.params?.feature).toBe("Guilds");
  });
});

describe("achievementActions", () => {
  it("shows ready badges first, then the nearest, at most two", () => {
    const actions = achievementActions(
      snapshot({
        achievements: [
          { id: "a", name: "Far", current: 1, max: 10, ready: false },
          { id: "b", name: "Close", current: 8, max: 10, ready: false },
          { id: "c", name: "Next session", current: 0, max: 1, ready: true },
          { id: "d", name: "Closer", current: 9, max: 10, ready: false },
        ],
      }),
    );
    expect(actions.map((a) => a.id)).toEqual([
      "achievement:c",
      "achievement:d",
    ]);
  });
});

describe("bossActions", () => {
  it("suggests a boss never fought", () => {
    const [action] = bossActions(snapshot({ bosses: {} }));
    expect(action.id).toBe(`boss:${BOSSES[0].id}:first`);
  });

  it("aims at the nearest savepoint once all are fought", () => {
    const record = (bestPhase: number) => ({
      bestPhase,
      bestDamage: 0,
      bestScore: 0,
      reached: { normal: bestPhase },
      runs: 3,
    });
    const bosses = Object.fromEntries(
      BOSSES.map((boss, i) => [boss.id, record(i === 1 ? 9 : 2)]),
    );
    const [action] = bossActions(snapshot({ bosses }));
    expect(action.title.params).toEqual({ name: BOSSES[1].name, phase: 10 });
  });

  it("waits until the player has a few sessions", () => {
    expect(bossActions(snapshot({ bosses: {}, sessionCount: 1 }))).toEqual([]);
  });
});
