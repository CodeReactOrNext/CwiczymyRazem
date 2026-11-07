import {
  DAY,
  goal,
  NOW,
  snapshot,
  song,
} from "feature/whatNext/utils/testSnapshot";
import { describe, expect, it } from "vitest";

import {
  goalActions,
  planActions,
  roadmapActions,
  rotationActions,
  songActions,
} from "./progress.provider";

describe("goalActions", () => {
  it("counts the clean runs left to the next milestone", () => {
    const [action] = goalActions(snapshot({ goals: [goal({ cleanRuns: 1 })] }));
    expect(action.reason).toEqual({
      key: "goals.reason",
      params: { count: 2, bpm: 100 },
    });
    expect(action.href).toBe("/practice/goal/g1");
    expect(action.sessionItem).toMatchObject({ kind: "goal", bpm: 100 });
  });

  it("measures progress along the whole path, so the closest goal ranks highest", () => {
    const [near] = goalActions(
      snapshot({ goals: [goal({ stageBpm: 120, cleanRuns: 2 })] }),
    );
    const [far] = goalActions(
      snapshot({ goals: [goal({ stageBpm: 80, cleanRuns: 0 })] }),
    );
    expect(near.progress!.value / near.progress!.max).toBeGreaterThan(
      far.progress!.value / far.progress!.max,
    );
    expect(near.reason?.key).toBe("goals.reason_final");
  });

  it("suggests a first goal only to a player with some sessions behind them", () => {
    expect(goalActions(snapshot({ goals: [] }))[0].id).toBe("goals:create");
    expect(goalActions(snapshot({ goals: [], sessionCount: 1 }))).toEqual([]);
    expect(
      goalActions(snapshot({ goals: [goal({ status: "completed" })] }))[0].id,
    ).toBe("goals:create");
  });
});

describe("songActions", () => {
  it("keeps quiet about songs played in the last few days", () => {
    expect(
      songActions(
        snapshot({
          songs: {
            learning: [song({ lastPracticedAt: NOW - DAY })],
            wantToLearn: [],
            learnedCount: 0,
          },
        }),
      ),
    ).toEqual([]);
  });

  it("lists the stalest learning songs first, never-played on top", () => {
    const actions = songActions(
      snapshot({
        songs: {
          learning: [
            song({ id: "a", lastPracticedAt: NOW - 4 * DAY }),
            song({ id: "b", lastPracticedAt: null }),
            song({ id: "c", lastPracticedAt: NOW - 20 * DAY }),
          ],
          wantToLearn: [],
          learnedCount: 0,
        },
      }),
    );
    expect(actions.map((a) => a.id)).toEqual(["song:b", "song:c"]);
  });

  it("picks the next song from the wish list when nothing is being learned", () => {
    const [action] = songActions(
      snapshot({
        songs: {
          learning: [],
          wantToLearn: [song({ id: "w" })],
          learnedCount: 3,
        },
      }),
    );
    expect(action).toMatchObject({ id: "song:w", kind: "start" });
  });

  it("plays over the tab when the player attached one", () => {
    const [action] = songActions(
      snapshot({
        songs: {
          learning: [song({ hasGpFile: true })],
          wantToLearn: [],
          learnedCount: 0,
        },
      }),
    );
    expect(action.sessionItem).toMatchObject({ kind: "song", songMode: "gp" });
  });
});

describe("roadmapActions", () => {
  it("links each started roadmap to its current step", () => {
    const [action] = roadmapActions(
      snapshot({
        roadmapSteps: [
          {
            roadmapId: "r1",
            roadmapTitle: "John Mayer",
            stepId: "s3",
            title: "Slow blues",
          },
        ],
      }),
    );
    expect(action.href).toBe("/ai-coach?roadmapId=r1&step=s3");
    expect(action.playerSet).toBe(true);
  });
});

describe("rotationActions", () => {
  it("speaks up from two rusty items", () => {
    expect(
      rotationActions(
        snapshot({ rotation: { rusty: 1, cooling: 4, total: 9 } }),
      ),
    ).toEqual([]);
    expect(
      rotationActions(
        snapshot({ rotation: { rusty: 3, cooling: 0, total: 9 } }),
      )[0].title.params,
    ).toEqual({
      count: 3,
    });
  });
});

describe("planActions", () => {
  it("offers the last plan again while it is recent", () => {
    const lastPlan = {
      planId: "p1",
      title: "Morning warm-up",
      lastPlayedAt: NOW - 2 * DAY,
    };
    expect(planActions(snapshot({ lastPlan }))[0].href).toBe(
      "/timer/plans?planId=p1",
    );
    expect(
      planActions(
        snapshot({ lastPlan: { ...lastPlan, lastPlayedAt: NOW - 30 * DAY } }),
      ),
    ).toEqual([]);
  });
});
