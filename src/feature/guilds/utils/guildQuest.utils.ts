import {
  GUILD_QUEST_CHAPTERS,
  lapMultiplier,
  parseQuestKey,
  questById,
  scaleQuest,
} from "feature/guilds/data/guildQuests";
import type { GuildQuestDone } from "feature/guilds/types/guild.types";

/**
 * The quest ledger a guild document carries, read defensively.
 *
 * Two maps live on the document. `quests` is what the guild has cleared: per
 * ledger key (the quest id, with `@lap` after the first lap — see `questKey`),
 * when, and who was on the roster at that moment. The roster is frozen there
 * because that is who earned it, and somebody let in a month later has no
 * claim on it. `questClaims` is what each member has already taken, per uid,
 * as a list of keys. Both are written only by the Admin SDK (`guilds` is
 * closed to clients outright), which is what makes a claim record something
 * that cannot be deleted to get paid twice.
 */

export interface QuestClear {
  key: string;
  /** The catalog quest behind the key. */
  id: string;
  lap: number;
  at: string;
  roster: string[];
}

const isString = (value: unknown): value is string => typeof value === "string";

/** The cleared quests, only those the catalog can still place, oldest first. */
export const readDoneQuests = (
  data: Record<string, any> | undefined,
): QuestClear[] => {
  const stored = data?.quests;
  if (!stored || typeof stored !== "object") return [];

  return Object.entries(stored as Record<string, unknown>)
    .flatMap(([key, value]) => {
      const placed = parseQuestKey(key);
      if (!placed) return [];
      const entry = (value ?? {}) as Record<string, unknown>;
      return [
        {
          key,
          id: placed.id,
          lap: placed.lap,
          at: isString(entry.at) ? entry.at : new Date(0).toISOString(),
          roster: Array.isArray(entry.roster)
            ? entry.roster.filter(isString)
            : [],
        },
      ];
    })
    .sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
};

/** Ledger keys this member has already taken Fame for. */
export const claimedQuestKeys = (
  data: Record<string, any> | undefined,
  uid: string,
): string[] => {
  const stored = data?.questClaims?.[uid];
  return Array.isArray(stored) ? stored.filter(isString) : [];
};

/**
 * Everything cleared, as the member sees it: which they were there for, and
 * which they have already taken. Names and rewards are the lap's own.
 */
export const questDoneList = (
  data: Record<string, any> | undefined,
  uid: string,
): GuildQuestDone[] => {
  const claimed = new Set(claimedQuestKeys(data, uid));

  return readDoneQuests(data).flatMap(({ key, id, lap, at, roster }) => {
    const quest = questById(id);
    if (!quest) return [];
    const played = scaleQuest(quest, lap);
    return [
      {
        id: key,
        questId: id,
        lap,
        chapter: quest.chapter,
        name: played.name,
        reward: played.reward,
        doneAt: at,
        eligible: roster.includes(uid),
        claimed: claimed.has(key),
      },
    ];
  });
};

/**
 * What a member can take right now: cleared while they were on the roster,
 * paid by its chapter and lap, and not taken yet.
 */
export const claimableQuests = (
  data: Record<string, any> | undefined,
  uid: string,
): { keys: string[]; fame: number } => {
  const open = questDoneList(data, uid).filter(
    (quest) => quest.eligible && !quest.claimed && quest.reward > 0,
  );

  return {
    keys: open.map((quest) => quest.id),
    fame: open.reduce((sum, quest) => sum + quest.reward, 0),
  };
};

/** The chapter's card details on a given lap, for the board header. */
export const chapterOf = (
  index: number,
  lap = 1,
): { index: number; name: string; blurb: string; reward: number } | null => {
  const chapter = GUILD_QUEST_CHAPTERS[index];
  return chapter
    ? { index, ...chapter, reward: chapter.reward * lapMultiplier(lap) }
    : null;
};
