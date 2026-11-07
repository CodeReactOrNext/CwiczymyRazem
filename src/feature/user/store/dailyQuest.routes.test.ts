import { describe, expect, it } from "vitest";

import { DAILY_QUEST_ROUTES, getQuestTaskHref } from "./dailyQuest.routes";

describe("getQuestTaskHref", () => {
  it("sends a task to its page", () => {
    expect(getQuestTaskHref({ type: "auto_plan" })).toBe("/timer/auto");
  });

  it("opens the exact exercise when the task names one", () => {
    expect(
      getQuestTaskHref({ type: "practice_specific_exercise", exerciseId: "spider_1" })
    ).toBe("/profile/skills?exerciseId=spider_1");
  });

  it("falls back to the skills page when the exercise is missing", () => {
    expect(getQuestTaskHref({ type: "practice_specific_exercise" })).toBe(
      DAILY_QUEST_ROUTES.practice_specific_exercise
    );
  });
});
