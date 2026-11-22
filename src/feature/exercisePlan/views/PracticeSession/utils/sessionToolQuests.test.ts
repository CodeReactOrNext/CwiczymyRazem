import { describe, expect, it } from "vitest";

import {
  type SessionToolQuestInput,
  sessionToolQuests,
} from "./sessionToolQuests";

const base: SessionToolQuestInput = {
  planId: "auto-1",
  played: [{ id: "ex1" }],
  songIds: [],
  isDuel: false,
  isBoss: false,
  isGuildTake: false,
  isDailyExercise: () => false,
};

const types = (input: Partial<SessionToolQuestInput>) =>
  sessionToolQuests({ ...base, ...input }).map((event) => event.type);

describe("sessionToolQuests", () => {
  it("moves nothing for a plain session", () => {
    expect(types({})).toEqual([]);
  });

  it("counts every played item of a session started from Rotation", () => {
    expect(
      sessionToolQuests({
        ...base,
        planId: "rotation-123",
        played: [{ id: "a" }, { id: "b" }],
      }),
    ).toEqual([{ type: "rotation_item", amount: 2 }]);
  });

  it("counts rotation items played elsewhere when the rotation is cached", () => {
    const events = sessionToolQuests({
      ...base,
      practiced: { exerciseIds: ["ex1", "ex2"], skillIds: ["legato"] },
      songIds: ["song9"],
      rotationItems: [
        { type: "exercise", id: "ex1", addedAt: 0 },
        { type: "skill", id: "legato", addedAt: 0 },
        { type: "song", id: "song9", addedAt: 0 },
        { type: "exercise", id: "other", addedAt: 0 },
      ],
    });
    expect(events).toEqual([{ type: "rotation_item", amount: 3 }]);
  });

  it("recognises calendar, daily exercise, Play by Ear, duels, bosses and guild takes", () => {
    expect(
      types({
        planId: "calendar-2026-11-22",
        played: [
          { id: "daily1" },
          { id: "ear1", riddleConfig: { mode: "sequenceRepeat" } },
        ],
        isDailyExercise: (id) => id === "daily1",
        isDuel: true,
        isBoss: true,
        isGuildTake: true,
      }),
    ).toEqual([
      "calendar_tick",
      "daily_exercise",
      "ear_round",
      "duel_run",
      "boss_attempt",
      "guild_contribution",
    ]);
  });

  it("counts a challenge song only when it is on this month's board", () => {
    expect(types({ songIds: ["s1"], challengeSongIds: ["s1", "s2"] })).toEqual([
      "challenge_play",
    ]);
    expect(types({ songIds: ["s3"], challengeSongIds: ["s1", "s2"] })).toEqual(
      [],
    );
  });
});
