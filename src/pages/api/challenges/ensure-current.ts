import {
  CHALLENGE_SONG_COUNT,
  type ChallengeSong,
} from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  challengeWindow,
  currentChallengeId,
} from "feature/challenges/utils/challengeMonth";
import type {
  DocumentReference,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

interface NominationDoc {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
  voteCount?: number;
  createdAt?: FirebaseFirestore.Timestamp;
}

/** Drops `undefined` fields — Firestore rejects them. */
const toChallengeSong = (
  source: Partial<NominationDoc> & {
    songId: string;
    title: string;
    artist: string;
  },
  votes: number,
): ChallengeSong => {
  const song: ChallengeSong = {
    songId: source.songId,
    title: source.title,
    artist: source.artist,
    votes,
  };
  if (source.coverUrl) song.coverUrl = source.coverUrl;
  if (source.tier) song.tier = source.tier;
  if (source.avgDifficulty !== undefined)
    song.avgDifficulty = source.avgDifficulty;
  return song;
};

/**
 * The community ballot for this month, most-backed first. An earlier nomination
 * wins a tie, so being first to propose a song is worth something.
 */
const drawFromVotes = async (challengeId: string): Promise<ChallengeSong[]> => {
  const snap = await firestore
    .collection("challengeNominations")
    .where("challengeId", "==", challengeId)
    .get();

  return snap.docs
    .map((doc: QueryDocumentSnapshot) => doc.data() as NominationDoc)
    .sort(
      (a: NominationDoc, b: NominationDoc) =>
        (b.voteCount ?? 0) - (a.voteCount ?? 0) ||
        (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0),
    )
    .slice(0, CHALLENGE_SONG_COUNT)
    .map((nomination: NominationDoc) =>
      toChallengeSong(nomination, nomination.voteCount ?? 0),
    );
};

/**
 * A quiet month must not leave the board empty, so any unfilled slots fall back
 * to the library's most-practised songs. They carry 0 votes, which the UI shows
 * as a wildcard pick rather than a community choice.
 */
const fillWithPopularSongs = async (
  picked: ChallengeSong[],
): Promise<ChallengeSong[]> => {
  const missing = CHALLENGE_SONG_COUNT - picked.length;
  if (missing <= 0) return picked;

  const snap = await firestore
    .collection("songs")
    .orderBy("popularity", "desc")
    .limit(CHALLENGE_SONG_COUNT * 4)
    .get();

  const alreadyPicked = new Set(picked.map((song) => song.songId));
  const fillers = snap.docs
    .filter((doc: QueryDocumentSnapshot) => !alreadyPicked.has(doc.id))
    .slice(0, missing)
    .map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return toChallengeSong(
        {
          songId: doc.id,
          title: data.title ?? "Unknown",
          artist: data.artist ?? "Unknown",
          coverUrl: data.coverUrl,
          tier: data.tier,
          avgDifficulty: data.avgDifficulty,
        },
        0,
      );
    });

  return [...picked, ...fillers];
};

/**
 * Draws the current month's challenge board if it doesn't exist yet.
 *
 * Idempotent: the board is a single doc keyed by `YYYY-MM`, created inside a
 * transaction, so concurrent callers (every player opening the page on the 1st,
 * plus any cron hitting this route) all collapse into one draw. Runs through
 * the Admin SDK so vote counts can't be forged on the way in.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const challengeId = currentChallengeId();
  const challengeRef: DocumentReference = firestore
    .collection("challenges")
    .doc(challengeId);

  try {
    const existing = await challengeRef.get();
    if (existing.exists) {
      return res.status(200).json({ challengeId, created: false });
    }

    const songs = await fillWithPopularSongs(await drawFromVotes(challengeId));
    if (songs.length === 0) {
      return res
        .status(503)
        .json({ error: "No songs available to draw a challenge from" });
    }

    const { startsAt, endsAt } = challengeWindow(challengeId);

    const created = await firestore.runTransaction(
      async (transaction: Transaction) => {
        const snapshot = await transaction.get(challengeRef);
        if (snapshot.exists) return false;

        transaction.set(challengeRef, {
          title: `${challengeMonthLabel(challengeId)} Challenge`,
          status: "active",
          songs,
          startsAt: Timestamp.fromDate(startsAt),
          endsAt: Timestamp.fromDate(endsAt),
          submissionCount: 0,
          finisherCount: 0,
          createdAt: Timestamp.now(),
        });
        return true;
      },
    );

    return res
      .status(200)
      .json({ challengeId, created, songCount: songs.length });
  } catch (error) {
    console.error("Failed to ensure current challenge:", error);
    return res
      .status(500)
      .json({ error: "Failed to ensure current challenge" });
  }
}
