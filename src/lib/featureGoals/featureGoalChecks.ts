import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import {
  collectBpms,
  isExerciseCleared,
} from "feature/scaleTree/data/exerciseClearance";
import { SCALE_TREE_NODES } from "feature/scaleTree/data/scaleTreeNodes";
import type { FeatureGoalId } from "feature/whatNext/data/featureGoals";

/**
 * The parts of the goal checks that need no database: each takes data already
 * read and answers yes or no. Kept apart from the reads so the rules can be
 * tested without Firestore, and so the routes stay a list of lookups.
 */

type UserData = Record<string, any>;

const nonEmpty = (value: unknown) => Array.isArray(value) && value.length > 0;

/** Goals answered by the user document alone. */
export const USER_DOC_GOALS = [
  "first_session",
  "first_guitar",
  "all_categories",
  "open_case",
  "favorite",
  "rig",
  "achievement",
  "guild",
] as const satisfies readonly FeatureGoalId[];

export type UserDocGoal = (typeof USER_DOC_GOALS)[number];

export const checkUserDocGoal = (goal: UserDocGoal, data: UserData): boolean => {
  const stats = data.statistics ?? {};
  const arsenal = data.arsenal ?? {};

  switch (goal) {
    case "first_session":
      return (stats.sessionCount ?? 0) > 0;
    case "first_guitar":
      return nonEmpty(arsenal.inventory);
    case "all_categories": {
      const time = stats.time ?? {};
      return (["technique", "theory", "hearing", "creativity"] as const).every(
        (category) => (time[category] ?? 0) > 0,
      );
    }
    case "open_case":
      // No counter of opened cases is kept. A case leaves a pity counter or
      // something in the dex beyond the single starter guitar; the starter
      // guitar alone never counts.
      return (
        Object.keys(data.casePity ?? {}).length > 0 ||
        (arsenal.dexGuitars?.length ?? 0) + (arsenal.dexEffects?.length ?? 0) >=
          2
      );
    case "favorite":
      return (
        nonEmpty(data.favoriteExerciseIds) ||
        nonEmpty(data.favoritePlanIds) ||
        nonEmpty(data.favoriteSongIds)
      );
    case "rig":
      // Every Arsenal starts from DEFAULT_RIG; anything else was set up by hand.
      return (
        !!arsenal.rig && JSON.stringify(arsenal.rig) !== JSON.stringify(DEFAULT_RIG)
      );
    case "achievement":
      return nonEmpty(stats.achievements);
    case "guild":
      return typeof data.guildId === "string" && data.guildId.length > 0;
    default:
      return false;
  }
};

/**
 * Sessions after which an account is no longer new. "Come back a second day"
 * is there to get a newcomer past day one; anyone past this has long done it.
 */
export const SETTLED_SESSION_COUNT = 10;

/**
 * A second day of practice, read off the statistics alone: a best streak of
 * two days or more is two days by definition, and a settled account is not
 * who the goal is for. Only a genuinely new account falls through to the logs.
 */
export const hasSecondDayInStats = (data: UserData): boolean => {
  const stats = data.statistics ?? {};
  return (
    (stats.dayWithoutBreak ?? 0) >= 2 ||
    (stats.actualDayWithoutBreak ?? 0) >= 2 ||
    (stats.sessionCount ?? 0) >= SETTLED_SESSION_COUNT
  );
};

/**
 * Two different days of practice, from the ids of the first and the last log.
 * Log ids are ISO timestamps; the day is read in the player's own time zone
 * when it is known, so a late-night session and a morning one are two days.
 */
export const spansTwoDays = (
  firstLogId: string | undefined,
  lastLogId: string | undefined,
  timeZone?: string,
): boolean => {
  if (!firstLogId || !lastLogId || firstLogId === lastLogId) return false;
  const day = (id: string) => {
    const date = new Date(id);
    if (Number.isNaN(date.getTime())) return id.slice(0, 10);
    try {
      return date.toLocaleDateString("en-CA", timeZone ? { timeZone } : undefined);
    } catch {
      return id.slice(0, 10);
    }
  };
  return day(firstLogId) !== day(lastLogId);
};

/** Any tempo cleared on any exercise. */
export const hasClearedTempo = (
  progress: ReadonlyMap<string, number[]>,
): boolean => [...progress.values()].some((bpms) => bpms.length > 0);

/** Any exercise of the scale tree cleared at its tempo. */
export const hasClearedScale = (
  progress: ReadonlyMap<string, number[]>,
): boolean =>
  SCALE_TREE_NODES.some((node) =>
    node.requiredExercises.some((req) =>
      isExerciseCleared(req, collectBpms(req, progress as Map<string, number[]>)),
    ),
  );

/** Any Journey step completed, in any module. */
export const hasJourneyStep = (doc: UserData | undefined): boolean =>
  Object.values(doc?.moduleProgress ?? {}).some((module: any) =>
    Object.values(module?.steps ?? {}).some((step: any) => !!step?.completed),
  );

/** Any day of the calendar with something on it. */
export const hasCalendarItems = (doc: UserData | undefined): boolean =>
  Object.values(doc?.days ?? {}).some(nonEmpty);

/** A boss fought at least once. */
export const hasBossRun = (doc: UserData | undefined): boolean =>
  Object.values(doc ?? {}).some(
    (record: any) => (record?.runs ?? 0) > 0 || (record?.bestPhase ?? 0) > 0,
  );

/** A weekly goal collected at least once. */
export const hasWeeklyClaim = (doc: UserData | undefined): boolean =>
  Object.keys(doc?.claims ?? {}).length > 0;
