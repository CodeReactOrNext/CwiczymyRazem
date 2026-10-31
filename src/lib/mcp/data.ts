import type { CommunityExercise } from "feature/communityExercises/types";
import { communityDocId } from "feature/communityExercises/utils/communityToExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { StatisticsDataInterface } from "types/api.types";
import { getLocalDayKey, isValidTimeZone } from "utils/gameLogic/localDay";

import { firestore } from "./db";
import { McpToolError } from "./results";

/** Data the tool groups share, read the same way everywhere. */

/** The built-in exercise library by id. */
export const exercisesById = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

export const COMMUNITY_EXERCISES = "communityExercises";

export const userRef = (uid: string) => firestore.collection("users").doc(uid);

export interface McpUserDoc {
  displayName?: string;
  statistics?: StatisticsDataInterface;
  skills?: {
    unlockedSkills?: Record<string, number>;
    timeSpent?: Record<string, number>;
  };
}

export async function readUser(uid: string): Promise<McpUserDoc> {
  const data = (await userRef(uid).get()).data();
  if (!data) throw new McpToolError("No riff.quest profile for this token.");
  return data as McpUserDoc;
}

/**
 * Skill points and minutes per skill. Newer profiles keep them in `skills`,
 * older ones only in `statistics.skills` — every tool reads both the same way.
 */
export const skillProgress = (user: McpUserDoc) => ({
  points:
    user.skills?.unlockedSkills ??
    user.statistics?.skills?.unlockedSkills ??
    {},
  timeSpent: user.skills?.timeSpent ?? user.statistics?.skills?.timeSpent ?? {},
});

/**
 * The player's own exercise behind an id, plain or `community-` prefixed;
 * null when there's none or it's someone else's.
 */
export async function readOwnExercise(uid: string, id: string) {
  const docId = communityDocId(id) ?? id;
  const snapshot = await firestore
    .collection(COMMUNITY_EXERCISES)
    .doc(docId)
    .get();
  const data = snapshot.data();
  if (!data || data.authorId !== uid) return null;
  return {
    ref: snapshot.ref,
    id: snapshot.id,
    data: { ...(data as CommunityExercise), id: snapshot.id },
  };
}

/**
 * Whether an exercise id points at anything the player could have played: a
 * library exercise, one of their own, or someone's published exercise.
 */
export async function exerciseExists(uid: string, id: string) {
  if (exercisesById.has(id)) return true;
  const docId = communityDocId(id) ?? id;
  const data = (
    await firestore.collection(COMMUNITY_EXERCISES).doc(docId).get()
  ).data();
  return !!data && (data.authorId === uid || data.isPublic === true);
}

/** An exercise's title: the library's, or the community exercise's; null when gone. */
export async function exerciseTitle(id: string): Promise<string | null> {
  const library = exercisesById.get(id);
  if (library) return library.title;
  const docId = communityDocId(id) ?? id;
  const data = (
    await firestore.collection(COMMUNITY_EXERCISES).doc(docId).get()
  ).data();
  return (data?.title as string | undefined) ?? null;
}

/**
 * The zone a tool counts days in: the one asked for, else the one the app
 * stores with every report (`statistics.timeZone`), else UTC.
 */
export const resolveTimeZone = (
  asked: string | undefined,
  user: McpUserDoc | null,
): string => {
  if (asked !== undefined) {
    if (!isValidTimeZone(asked)) {
      throw new McpToolError(
        `Unknown time zone "${asked}" — use an IANA name like Europe/Warsaw.`,
      );
    }
    return asked;
  }
  const stored = user?.statistics?.timeZone;
  return isValidTimeZone(stored) ? stored : "UTC";
};

/** The player's calendar day of a session log, whose id is its ISO timestamp. */
export const logDay = (logId: string, timeZone: string) => {
  const at = new Date(logId);
  return Number.isNaN(at.getTime())
    ? logId.slice(0, 10)
    : getLocalDayKey(at, timeZone);
};

export const todayIn = (timeZone: string, now: Date = new Date()) =>
  getLocalDayKey(now, timeZone);
