import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { describe, expect, it } from "vitest";

import { getReplayHref } from "./replayHref";

const log = { exceriseTitle: "Evening practice" };
const song = { songId: "s1", songTitle: "Iron Man" } as never;

describe("getReplayHref", () => {
  it("opens a catalog plan", () => {
    const planId = defaultPlans[0].id;
    expect(getReplayHref({ ...log, planId })).toBe(
      `/timer/plans?planId=${planId}`,
    );
  });

  it("opens the song, unless the session held several", () => {
    expect(getReplayHref({ ...log, songId: "s1" })).toBe("/timer/song/s1");
    expect(
      getReplayHref({ ...log, songId: "s1", songs: [song, song] }),
    ).toBeUndefined();
  });

  it("opens a single exercise even when its session was wrapped in a plan", () => {
    const { id, title } = exercisesAgregat[0];
    expect(getReplayHref({ planId: "wrapped", exceriseTitle: title })).toBe(
      `/practice/exercise/${id}`,
    );
  });

  it("has nowhere to go for anything else", () => {
    expect(getReplayHref(log)).toBeUndefined();
    expect(getReplayHref({ ...log, planId: "auto-plan" })).toBeUndefined();
  });
});
