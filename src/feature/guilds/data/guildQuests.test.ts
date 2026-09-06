import {
  activeChapterOf,
  currentLapOf,
  describeQuest,
  doneQuestKeys,
  formatQuestAmount,
  GUILD_LAP_SIZE,
  GUILD_QUEST_CHAPTERS,
  GUILD_QUESTS,
  GUILD_QUESTS_PER_CHAPTER,
  guildLevelOf,
  lapMultiplier,
  msToHours,
  parseQuestKey,
  questAskOfEach,
  questById,
  questKey,
  questReward,
  questsOfChapter,
  questUnit,
  romanNumeral,
  scaleQuest,
} from "feature/guilds/data/guildQuests";
import { describe, expect, it } from "vitest";

const allKeys = (lap: number) =>
  GUILD_QUESTS.map((quest) => questKey(quest.id, lap));

describe("the quest catalog", () => {
  it("is fifty quests in ten chapters of five", () => {
    expect(GUILD_QUESTS).toHaveLength(50);
    expect(GUILD_LAP_SIZE).toBe(50);
    expect(GUILD_QUEST_CHAPTERS).toHaveLength(10);

    for (let chapter = 0; chapter < GUILD_QUEST_CHAPTERS.length; chapter++) {
      expect(questsOfChapter(chapter)).toHaveLength(GUILD_QUESTS_PER_CHAPTER);
    }
  });

  it("gives every quest a unique, stable id without the lap separator", () => {
    const ids = GUILD_QUESTS.map((quest) => quest.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9-]+$/.test(id))).toBe(true);
  });

  it("pays more for every chapter up the ladder", () => {
    const rewards = GUILD_QUEST_CHAPTERS.map((chapter) => chapter.reward);
    for (let i = 1; i < rewards.length; i++) {
      expect(rewards[i]).toBeGreaterThan(rewards[i - 1]);
    }
    expect(questReward(questById("sessions-100")!)).toBe(rewards[0]);
    expect(questReward(questById("streak-100-x1")!)).toBe(rewards[9]);
  });

  it("asks a fixed number of everything, never the whole roster", () => {
    for (const quest of GUILD_QUESTS) {
      expect(quest.target).toBeGreaterThan(0);
    }

    // A quest that counts members asks for a handful the base roster can seat,
    // so a small guild can reach it and one idle member cannot block it.
    const memberQuests = GUILD_QUESTS.filter(
      (quest) => questUnit(quest) === "members",
    );
    expect(memberQuests.length).toBeGreaterThan(0);
    for (const quest of memberQuests) {
      expect(quest.target).toBeLessThanOrEqual(5);
    }
  });

  it("states each quest in the unit its measure implies", () => {
    expect(questUnit(questById("sessions-100")!)).toBe("sessions");
    expect(questUnit(questById("points-2000")!)).toBe("points");
    expect(questUnit(questById("hours-50")!)).toBe("hours");
    expect(questUnit(questById("theory-100")!)).toBe("hours");
    expect(questUnit(questById("hearing-100")!)).toBe("hours");
    expect(questUnit(questById("technique-10")!)).toBe("hours");
    expect(questUnit(questById("members-sessions-5-x3")!)).toBe("members");
    expect(questUnit(questById("streak-7-x3")!)).toBe("members");
    expect(questUnit(questById("treasury-300")!)).toBe("fame");
    expect(questUnit(questById("songs-learned-25")!)).toBe("songs");
    expect(questUnit(questById("recordings-5")!)).toBe("recordings");
    expect(questUnit(questById("daily-quests-30")!)).toBe("quests");
    expect(questUnit(questById("exams-10")!)).toBe("exams");
    expect(questUnit(questById("submissions-5")!)).toBe("entries");
  });

  it("never reads a whole subcollection or needs a composite index", () => {
    // Every quest is an aggregation with at most equality filters and one
    // date bound, a field on the member's own document, or the guild document.
    // A quest that read documents one by one, or filtered two fields by
    // range, was removed for what it cost — see `lib/guild/guildQuests.ts`.
    const kinds = new Set(GUILD_QUESTS.map((quest) => quest.measure.kind));
    expect(kinds).toEqual(
      new Set([
        "reports",
        "allCategoriesEach",
        "treasury",
        "streak",
        "songsLearned",
        "recordings",
        "logs",
        "submissions",
      ]),
    );
  });

  it("puts the per-member ask into words only where there is one", () => {
    expect(questAskOfEach(questById("members-sessions-5-x3")!)).toBe(
      "5 sessions",
    );
    expect(questAskOfEach(questById("streak-7-x3")!)).toBe("a 7-day streak");
    expect(questAskOfEach(questById("members-all-categories-x4")!)).toBe(
      "1h in all four categories",
    );
    expect(questAskOfEach(questById("sessions-100")!)).toBeNull();
    expect(questAskOfEach(questById("treasury-300")!)).toBeNull();
  });
});

describe("laps", () => {
  it("multiplies linearly, and never below one", () => {
    expect(lapMultiplier(1)).toBe(1);
    expect(lapMultiplier(2)).toBe(2);
    expect(lapMultiplier(5)).toBe(5);
    expect(lapMultiplier(0)).toBe(1);
    expect(lapMultiplier(Number.NaN)).toBe(1);
  });

  it("keys the first lap by id alone and every lap after with the lap", () => {
    expect(questKey("sessions-100", 1)).toBe("sessions-100");
    expect(questKey("sessions-100", 2)).toBe("sessions-100@2");
    expect(questKey("sessions-100", 12)).toBe("sessions-100@12");

    expect(parseQuestKey("sessions-100")).toEqual({
      id: "sessions-100",
      lap: 1,
    });
    expect(parseQuestKey("sessions-100@2")).toEqual({
      id: "sessions-100",
      lap: 2,
    });
    // Not a quest, not a lap, a lap spelled wrong, or lap one written long.
    expect(parseQuestKey("retired@2")).toBeNull();
    expect(parseQuestKey("sessions-100@")).toBeNull();
    expect(parseQuestKey("sessions-100@x")).toBeNull();
    expect(parseQuestKey("sessions-100@1")).toBeNull();
    expect(parseQuestKey("sessions-100@2.5")).toBeNull();
    expect(parseQuestKey(7)).toBeNull();
  });

  it("never puts a character Firestore forbids in a field path into a key", () => {
    for (const quest of GUILD_QUESTS) {
      for (const lap of [1, 2, 10]) {
        expect(questKey(quest.id, lap)).not.toMatch(/[.*~/[\]]/);
      }
    }
  });

  it("writes the lap as a numeral", () => {
    expect(romanNumeral(1)).toBe("I");
    expect(romanNumeral(2)).toBe("II");
    expect(romanNumeral(4)).toBe("IV");
    expect(romanNumeral(9)).toBe("IX");
    expect(romanNumeral(14)).toBe("XIV");
    expect(romanNumeral(0)).toBe("I");
  });

  it("scales a guild total's target and its reward, and leaves lap one alone", () => {
    const base = questById("sessions-100")!;

    const one = scaleQuest(base, 1);
    expect(one).toMatchObject({
      key: "sessions-100",
      lap: 1,
      target: 100,
      name: "First Hundred",
      blurb: base.blurb,
      reward: GUILD_QUEST_CHAPTERS[0].reward,
    });

    const three = scaleQuest(base, 3);
    expect(three).toMatchObject({
      key: "sessions-100@3",
      lap: 3,
      target: 300,
      name: "First Hundred III",
      blurb: "300 sessions between you.",
      reward: GUILD_QUEST_CHAPTERS[0].reward * 3,
    });
  });

  it("scales the bar on a quest that counts members, not the members", () => {
    expect(scaleQuest(questById("members-sessions-5-x3")!, 2)).toMatchObject({
      target: 3,
      measure: { kind: "reports", scope: "each", each: 10 },
      blurb: "3 members with 10 sessions each.",
    });
    expect(scaleQuest(questById("streak-30-x1")!, 2)).toMatchObject({
      target: 1,
      measure: { kind: "streak", days: 60 },
      blurb: "One member on a 60-day streak at the same time.",
    });
    expect(
      scaleQuest(questById("members-all-categories-x4")!, 2),
    ).toMatchObject({
      target: 4,
      measure: { kind: "allCategoriesEach", hoursEach: 2 },
      blurb: "4 members with 2h in each of the four categories.",
    });
    expect(questAskOfEach(scaleQuest(questById("streak-7-x3")!, 2))).toBe(
      "a 14-day streak",
    );
  });

  it("describes every kind of quest in a sentence", () => {
    expect(describeQuest(questById("hours-50")!.measure, 100)).toBe(
      "100h of practice, all told.",
    );
    // Below a thousand, so the sentence does not depend on the test box's
    // locale for its digit grouping.
    expect(describeQuest(questById("points-2000")!.measure, 900)).toBe(
      "900 practice points scored between you.",
    );
    expect(describeQuest(questById("treasury-300")!.measure, 600)).toBe(
      "600 Fame put into the guild's own.",
    );
    expect(describeQuest(questById("songs-learned-25")!.measure, 50)).toBe(
      "50 songs marked learned.",
    );
    expect(describeQuest(questById("recordings-5")!.measure, 10)).toBe(
      "10 recordings published.",
    );
    expect(describeQuest(questById("daily-quests-30")!.measure, 60)).toBe(
      "60 daily quests completed.",
    );
    expect(describeQuest(questById("exams-10")!.measure, 20)).toBe(
      "20 journey exams passed.",
    );
    expect(describeQuest(questById("submissions-5")!.measure, 10)).toBe(
      "10 entries into the monthly challenge.",
    );
  });
});

describe("the level", () => {
  it("is the number of distinct keys cleared, with no ceiling", () => {
    expect(guildLevelOf([])).toBe(0);
    expect(guildLevelOf(["sessions-100", "sessions-100", "hours-50"])).toBe(2);
    expect(guildLevelOf(allKeys(1))).toBe(50);
    expect(guildLevelOf([...allKeys(1), ...allKeys(2), "hours-50@3"])).toBe(
      101,
    );
  });

  it("reads only keys the catalog can place off a document", () => {
    expect(
      doneQuestKeys({
        quests: {
          "sessions-100": {},
          "retired-quest": {},
          "hours-50@2": {},
          "hours-50@nope": {},
        },
      }),
    ).toEqual(["sessions-100", "hours-50@2"]);
    expect(doneQuestKeys({})).toEqual([]);
    expect(doneQuestKeys({ quests: "nonsense" })).toEqual([]);
    expect(doneQuestKeys(undefined)).toEqual([]);
  });

  it("opens the first chapter with anything still to do, lap by lap", () => {
    expect(activeChapterOf([])).toEqual({ lap: 1, chapter: 0 });

    const firstChapter = questsOfChapter(0).map((quest) => quest.id);
    expect(activeChapterOf(firstChapter.slice(0, 4))).toEqual({
      lap: 1,
      chapter: 0,
    });
    expect(activeChapterOf(firstChapter)).toEqual({ lap: 1, chapter: 1 });

    // A quest from a later chapter cleared early does not skip the chapter.
    expect(activeChapterOf(["sessions-250"])).toEqual({ lap: 1, chapter: 0 });

    // The fiftieth opens the second lap rather than the end of the road.
    expect(currentLapOf(allKeys(1))).toBe(2);
    expect(activeChapterOf(allKeys(1))).toEqual({ lap: 2, chapter: 0 });
    expect(activeChapterOf([...allKeys(1), ...allKeys(2)])).toEqual({
      lap: 3,
      chapter: 0,
    });
    expect(
      activeChapterOf([
        ...allKeys(1),
        ...questsOfChapter(0).map((quest) => questKey(quest.id, 2)),
      ]),
    ).toEqual({ lap: 2, chapter: 1 });
  });
});

describe("formatting", () => {
  it("rounds milliseconds down to the tenth of an hour", () => {
    expect(msToHours(0)).toBe(0);
    expect(msToHours(59 * 60_000)).toBe(0.9);
    expect(msToHours(3_600_000)).toBe(1);
    expect(msToHours(5_400_000 + 5 * 60_000)).toBe(1.5);
    expect(msToHours(Number.NaN)).toBe(0);
    expect(msToHours(-1)).toBe(0);
  });

  it("sticks the unit on, singular where it should be", () => {
    expect(formatQuestAmount("sessions", 1)).toBe("1 session");
    expect(formatQuestAmount("sessions", 250)).toBe("250 sessions");
    expect(formatQuestAmount("hours", 2.5)).toBe("2.5h");
    expect(formatQuestAmount("fame", 300)).toBe("300 Fame");
    expect(formatQuestAmount("members", 1)).toBe("1 member");
    expect(formatQuestAmount("entries", 1)).toBe("1 entry");
    expect(formatQuestAmount("entries", 5)).toBe("5 entries");
  });
});
