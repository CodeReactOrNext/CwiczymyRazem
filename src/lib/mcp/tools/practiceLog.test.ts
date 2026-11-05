import { describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

import { logPracticeInput, sumLogMinutes } from "./practiceLog";

describe("sumLogMinutes", () => {
  it("adds categories, skills and songs into the four boxes", () => {
    expect(
      sumLogMinutes({
        minutes: { theory: 10 },
        skills: [
          { skillId: "alternate_picking", minutes: 20 },
          { skillId: "ear_training", minutes: 15 },
        ],
        songs: [{ songId: "s1", minutes: 30, listeningMinutes: 5 }],
      }),
    ).toEqual({ technique: 50, theory: 10, hearing: 20, creativity: 0 });
  });

  it("is all zeros for an empty log", () => {
    expect(sumLogMinutes({})).toEqual({
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
    });
  });
});

describe("logPracticeInput", () => {
  it("refuses an unknown skill", () => {
    expect(
      logPracticeInput.safeParse({
        skills: [{ skillId: "kazoo", minutes: 5 }],
      }).success,
    ).toBe(false);
  });

  it("refuses more days back than the form allows", () => {
    expect(
      logPracticeInput.safeParse({ minutes: { theory: 5 }, daysAgo: 30 })
        .success,
    ).toBe(false);
  });

  it("refuses fields it doesn't know", () => {
    expect(
      logPracticeInput.safeParse({ minutes: { technique: 5, guitar: 3 } })
        .success,
    ).toBe(false);
  });
});
