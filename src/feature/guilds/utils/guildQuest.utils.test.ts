import { GUILD_QUEST_CHAPTERS } from "feature/guilds/data/guildQuests";
import {
  chapterOf,
  claimableQuests,
  claimedQuestKeys,
  questDoneList,
  readDoneQuests,
} from "feature/guilds/utils/guildQuest.utils";
import { describe, expect, it } from "vitest";

const cleared = (at: string, ...roster: string[]) => ({ at, roster });

describe("readDoneQuests", () => {
  it("lists what the document says is cleared, oldest first, lap and all", () => {
    const done = readDoneQuests({
      quests: {
        "hours-50": cleared("2026-03-02T00:00:00.000Z", "ann"),
        "sessions-100": cleared("2026-03-01T00:00:00.000Z", "ann", "bob"),
        "sessions-100@2": cleared("2026-09-01T00:00:00.000Z", "ann"),
      },
    });

    expect(done.map((quest) => [quest.key, quest.id, quest.lap])).toEqual([
      ["sessions-100", "sessions-100", 1],
      ["hours-50", "hours-50", 1],
      ["sessions-100@2", "sessions-100", 2],
    ]);
    expect(done[0].roster).toEqual(["ann", "bob"]);
  });

  it("drops keys the catalog cannot place, and survives garbage", () => {
    expect(
      readDoneQuests({
        quests: {
          "sessions-100": cleared("2026-03-01T00:00:00.000Z", "ann"),
          "retired-quest": cleared("2026-03-01T00:00:00.000Z", "ann"),
          "hours-50@x": cleared("2026-03-01T00:00:00.000Z", "ann"),
          "hours-50": null,
          "technique-10": { at: 5, roster: "ann" },
        },
      }).map((quest) => [quest.key, quest.roster]),
    ).toEqual([
      ["hours-50", []],
      ["technique-10", []],
      ["sessions-100", ["ann"]],
    ]);

    expect(readDoneQuests({})).toEqual([]);
    expect(readDoneQuests({ quests: 7 })).toEqual([]);
    expect(readDoneQuests(undefined)).toEqual([]);
  });
});

describe("claims", () => {
  const data = {
    quests: {
      "sessions-100": cleared("2026-03-01T00:00:00.000Z", "ann", "bob"),
      "hours-50": cleared("2026-03-02T00:00:00.000Z", "ann"),
      "technique-10": cleared("2026-03-03T00:00:00.000Z", "ann", "bob"),
      "hours-50@2": cleared("2026-09-03T00:00:00.000Z", "ann", "bob"),
    },
    questClaims: { ann: ["sessions-100"], bob: "nonsense" },
  };
  const reward = GUILD_QUEST_CHAPTERS[0].reward;

  it("reads what a member has taken, and nothing for a broken entry", () => {
    expect(claimedQuestKeys(data, "ann")).toEqual(["sessions-100"]);
    expect(claimedQuestKeys(data, "bob")).toEqual([]);
    expect(claimedQuestKeys(data, "cid")).toEqual([]);
  });

  it("says, per cleared quest, whether the member was there and has taken it", () => {
    expect(
      questDoneList(data, "bob").map((quest) => [
        quest.id,
        quest.eligible,
        quest.claimed,
      ]),
    ).toEqual([
      ["sessions-100", true, false],
      ["hours-50", false, false],
      ["technique-10", true, false],
      ["hours-50@2", true, false],
    ]);

    expect(
      questDoneList(data, "ann").find((q) => q.id === "sessions-100"),
    ).toMatchObject({ claimed: true, eligible: true, reward, lap: 1 });
  });

  it("names and pays a second-lap quest as the second lap does", () => {
    expect(
      questDoneList(data, "ann").find((q) => q.id === "hours-50@2"),
    ).toMatchObject({
      questId: "hours-50",
      lap: 2,
      name: "Fifty Hours II",
      reward: reward * 2,
    });
  });

  it("adds up only what is cleared, earned and untaken", () => {
    // Ann was there for all four and has taken one.
    expect(claimableQuests(data, "ann")).toEqual({
      keys: ["hours-50", "technique-10", "hours-50@2"],
      fame: 4 * reward,
    });
    // Bob missed the second.
    expect(claimableQuests(data, "bob")).toEqual({
      keys: ["sessions-100", "technique-10", "hours-50@2"],
      fame: 4 * reward,
    });
    // Cid joined afterwards.
    expect(claimableQuests(data, "cid")).toEqual({ keys: [], fame: 0 });
  });
});

describe("chapterOf", () => {
  it("names the chapter with the lap's reward, or null past the end", () => {
    expect(chapterOf(0)).toMatchObject({
      index: 0,
      name: "Warm-up",
      reward: GUILD_QUEST_CHAPTERS[0].reward,
    });
    expect(chapterOf(0, 3)).toMatchObject({
      reward: GUILD_QUEST_CHAPTERS[0].reward * 3,
    });
    expect(chapterOf(GUILD_QUEST_CHAPTERS.length)).toBeNull();
  });
});
