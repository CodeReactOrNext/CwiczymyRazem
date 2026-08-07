import type {
  Challenge,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import { currentChallengeId } from "feature/challenges/utils/challengeMonth";
import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedGetDocs,
} from "utils/firebase/client/firestoreTracking";

export const CHALLENGES_COLLECTION = "challenges";
export const SUBMISSIONS_COLLECTION = "challengeSubmissions";

const CACHE_TTL = 60 * 1000;

export const invalidateChallengeCaches = () => memoryCache.clear("challenges:");

export const getChallenge = async (
  challengeId: string,
): Promise<Challenge | null> => {
  const cacheKey = `challenges:one:${challengeId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const snap = await trackedGetDoc(
      doc(db, CHALLENGES_COLLECTION, challengeId),
    );
    if (!snap.exists()) return null;
    const challenge = { id: snap.id, ...snap.data() } as Challenge;
    memoryCache.set(cacheKey, challenge, CACHE_TTL);
    return challenge;
  } catch (error) {
    logger.error(error, { context: "getChallenge" });
    return null;
  }
};

/** Boards that already closed, newest first — the archive tab. */
export const getPastChallenges = async (max = 12): Promise<Challenge[]> => {
  const cacheKey = `challenges:past:${max}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, CHALLENGES_COLLECTION),
      orderBy("startsAt", "desc"),
      limit(max + 1),
    );
    const snap = await trackedGetDocs(q);
    const liveId = currentChallengeId();
    const challenges = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Challenge)
      .filter((c) => c.id !== liveId)
      .slice(0, max);
    memoryCache.set(cacheKey, challenges, CACHE_TTL);
    return challenges;
  } catch (error) {
    logger.error(error, { context: "getPastChallenges" });
    return [];
  }
};

/**
 * Every recording on a board in one query. Five songs × a community-sized
 * roster stays small, so grouping client-side beats five per-song queries.
 */
export const getChallengeSubmissions = async (
  challengeId: string,
): Promise<ChallengeSubmission[]> => {
  const cacheKey = `challenges:submissions:${challengeId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("challengeId", "==", challengeId),
    );
    const snap = await trackedGetDocs(q);
    const submissions = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ChallengeSubmission,
    );
    memoryCache.set(cacheKey, submissions, CACHE_TTL);
    return submissions;
  } catch (error) {
    logger.error(error, { context: "getChallengeSubmissions" });
    return [];
  }
};

/**
 * Asks the backend to draw this month's board if it hasn't been drawn yet.
 * Idempotent and best-effort — the board is created by the Admin SDK so the
 * vote count can't be forged on the way in.
 */
export const ensureCurrentChallenge = async (): Promise<void> => {
  try {
    await fetch("/api/challenges/ensure-current", { method: "POST" });
  } catch (error) {
    logger.error(error, { context: "ensureCurrentChallenge" });
  }
};
