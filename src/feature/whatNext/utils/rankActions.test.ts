import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { HOUR, NOW } from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import {
  groupLanes,
  laneOf,
  pickHero,
  rankActions,
  scoreAction,
} from "./rankActions";

const action = (
  overrides: Partial<NextAction> & Pick<NextAction, "id">,
): NextAction => ({
  source: "songs",
  kind: "continue",
  isPractice: true,
  title: { key: "x" },
  href: "/",
  ...overrides,
});

describe("scoreAction", () => {
  it("grows as a deadline gets close", () => {
    const far = scoreAction(
      action({ id: "a", kind: "expiring", deadlineAt: NOW + 20 * HOUR }),
      { now: NOW },
    );
    const near = scoreAction(
      action({ id: "a", kind: "expiring", deadlineAt: NOW + 2 * HOUR }),
      { now: NOW },
    );
    expect(near).toBeGreaterThan(far);
  });

  it("favours the goal closest to done", () => {
    const early = scoreAction(
      action({ id: "a", progress: { value: 1, max: 10 } }),
      { now: NOW },
    );
    const late = scoreAction(
      action({ id: "a", progress: { value: 9, max: 10 } }),
      { now: NOW },
    );
    expect(late).toBeGreaterThan(early);
  });

  it("weighs what the player set up above a suggestion", () => {
    expect(
      scoreAction(action({ id: "a", playerSet: true }), { now: NOW }),
    ).toBeGreaterThan(scoreAction(action({ id: "a" }), { now: NOW }));
  });

  it("steps back after a tap that did not finish it", () => {
    expect(
      scoreAction(action({ id: "a" }), {
        now: NOW,
        clicked: { a: NOW - HOUR },
      }),
    ).toBeLessThan(scoreAction(action({ id: "a" }), { now: NOW }));
  });
});

describe("rankActions", () => {
  it("drops snoozed actions until the snooze runs out", () => {
    const actions = [action({ id: "a" }), action({ id: "b", source: "goals" })];
    expect(
      rankActions(actions, { now: NOW, snoozed: { a: NOW + HOUR } }).map(
        (a) => a.id,
      ),
    ).toEqual(["b"]);
    expect(
      rankActions(actions, { now: NOW, snoozed: { a: NOW - HOUR } }),
    ).toHaveLength(2);
  });

  it("keeps the top three to one action per source", () => {
    const ranked = rankActions(
      [
        action({ id: "song1", staleDays: 21 }),
        action({ id: "song2", staleDays: 20 }),
        action({ id: "song3", staleDays: 19 }),
        action({ id: "goal", source: "goals" }),
        action({ id: "plan", source: "plan", kind: "start" }),
      ],
      { now: NOW },
    );
    expect(ranked.slice(0, 3).map((a) => a.source)).toEqual([
      "songs",
      "goals",
      "plan",
    ]);
    expect(ranked.map((a) => a.id)).toContain("song3");
  });
});

describe("pickHero", () => {
  it("is the best thing to play, never a non-practice action", () => {
    const ranked = rankActions(
      [
        action({
          id: "plan-week",
          source: "calendar",
          kind: "expiring",
          isPractice: false,
        }),
        action({ id: "goal", source: "goals" }),
      ],
      { now: NOW },
    );
    expect(pickHero(ranked)?.id).toBe("goal");
  });

  it("never gives the spot to the exercise of the day", () => {
    const ranked = rankActions(
      [
        action({
          id: "daily",
          source: "dailyExercise",
          kind: "expiring",
          deadlineAt: NOW + HOUR,
        }),
        action({ id: "song", source: "songs" }),
      ],
      { now: NOW },
    );
    expect(ranked[0].id).toBe("daily");
    expect(pickHero(ranked)?.id).toBe("song");
  });

  it("is null with nothing to play", () => {
    expect(pickHero([])).toBeNull();
  });
});

describe("lanes", () => {
  it("puts each kind in its lane, and a weekly target due today into today", () => {
    expect(laneOf(action({ id: "a", kind: "expiring" }), NOW)).toBe("today");
    expect(laneOf(action({ id: "a", kind: "start" }), NOW)).toBe("inProgress");
    expect(laneOf(action({ id: "a", kind: "week" }), NOW)).toBe("week");
    expect(
      laneOf(
        action({ id: "a", kind: "week", deadlineAt: NOW + 3 * HOUR }),
        NOW,
      ),
    ).toBe("today");
    expect(laneOf(action({ id: "a", kind: "horizon" }), NOW)).toBe("horizon");
  });

  it("leaves the hero out of the lanes", () => {
    const ranked = rankActions(
      [action({ id: "a" }), action({ id: "b", source: "goals" })],
      { now: NOW },
    );
    const lanes = groupLanes(ranked, NOW, "a");
    expect(lanes.inProgress.map((a) => a.id)).toEqual(["b"]);
  });
});
