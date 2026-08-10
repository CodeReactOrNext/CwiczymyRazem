import type { ChallengeNomination } from "feature/challenges/types/challenge.types";
import { nominationDocId } from "feature/challenges/types/challenge.types";
import { logger } from "feature/logger/Logger";
import type { Song } from "feature/songs/types/songs.type";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  query,
  runTransaction,
  Timestamp,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

export const NOMINATIONS_COLLECTION = "challengeNominations";

const CACHE_TTL = 60 * 1000;

const invalidate = () => memoryCache.clear("challenges:nominations");

/** Raised when a player is out of votes for the cycle. */
export class OutOfVotesError extends Error {
  constructor() {
    super("No votes left this cycle");
    this.name = "OutOfVotesError";
  }
}

export const getNominations = async (
  challengeId: string,
): Promise<ChallengeNomination[]> => {
  const cacheKey = `challenges:nominations:${challengeId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, NOMINATIONS_COLLECTION),
      where("challengeId", "==", challengeId),
    );
    const snap = await trackedGetDocs(q);
    const nominations = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ChallengeNomination,
    );
    memoryCache.set(cacheKey, nominations, CACHE_TTL);
    return nominations;
  } catch (error) {
    logger.error(error, { context: "getNominations" });
    return [];
  }
};

/**
 * Puts a song forward for the next board. Nominating counts as the nominator's
 * first vote, so proposing costs the same as backing someone else's pick. If
 * the song is already on the ballot this falls through to a plain vote.
 */
export const nominateSong = async (params: {
  challengeId: string;
  song: Song;
  userId: string;
  userName: string;
}): Promise<void> => {
  const { challengeId, song, userId, userName } = params;
  const ref = doc(
    db,
    NOMINATIONS_COLLECTION,
    nominationDocId(challengeId, song.id),
  );

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    if (snap.exists()) {
      const voters = snap.data().voters ?? [];
      if (voters.some((v: { id: string }) => v.id === userId)) return; // already backed by this player
      transaction.update(ref, {
        voters: arrayUnion({ id: userId, name: userName }),
        voteCount: increment(1),
      });
      return;
    }

    // Firestore rejects `undefined` — keep only the snapshot fields we have.
    const nomination: Record<string, unknown> = {
      challengeId,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      nominatedBy: userId,
      nominatedByName: userName,
      voteCount: 1,
      voters: [{ id: userId, name: userName }],
      createdAt: Timestamp.now(),
    };
    if (song.coverUrl) nomination.coverUrl = song.coverUrl;
    if (song.tier) nomination.tier = song.tier;
    if (song.avgDifficulty !== undefined)
      nomination.avgDifficulty = song.avgDifficulty;

    transaction.set(ref, nomination);
  });

  invalidate();
};

/** Adds or withdraws the player's backing. Returns the resulting state. */
export const toggleNominationVote = async (
  nomination: ChallengeNomination,
  userId: string,
  userName: string,
): Promise<{ voted: boolean }> => {
  const voting = !(nomination.voters ?? []).some((v) => v.id === userId);
  const ref = doc(db, NOMINATIONS_COLLECTION, nomination.id);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Nomination no longer exists");

    const voters = snap.data().voters ?? [];
    // The doc is the source of truth — a stale optimistic view must not
    // double-count a vote or push the counter below zero.
    if (voting === voters.some((v: { id: string }) => v.id === userId)) return;

    transaction.update(ref, {
      voters: voting
        ? arrayUnion({ id: userId, name: userName })
        : arrayRemove({ id: userId, name: userName }),
      voteCount: increment(voting ? 1 : -1),
    });
  });

  invalidate();
  return { voted: voting };
};
